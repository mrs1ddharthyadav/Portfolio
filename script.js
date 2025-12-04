// script.js — merged, cleaned, and upgraded
// - theme renderer + admin preview support
// - robust mobile nav toggle
// - loader with minimum 2s + body lock
// - project injection from preview or assets/content.json

(function(){
  const PREVIEW_KEY = 'preview_content';
  const P_THEME_KEY = 'portfolio-theme';
  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeIcon');
  const yearEl = document.getElementById('year');

  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- helpers ---------------- */
  function hexToRgb(hex){
    if(!hex) return null;
    hex = (hex||'').replace('#','').trim();
    if(hex.length===3) hex = hex.split('').map(x=>x+x).join('');
    if(hex.length !== 6) return null;
    return { r: parseInt(hex.substr(0,2),16), g: parseInt(hex.substr(2,2),16), b: parseInt(hex.substr(4,2),16) };
  }
  function toRgbaString(color, alpha){
    if(!color) return `rgba(159,180,198,${alpha})`;
    color = color.trim();
    if(color.startsWith('#')){
      const c = hexToRgb(color);
      if(c) return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
    }
    if(color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    if(color.startsWith('rgba(')) return color;
    return color;
  }

  /* ---------------- theme token applier (updated) ---------------- */
  function applyTokensFromVariant(v){
    if(!v) return;
    const root = document.documentElement;

    // palette tokens
    const a1 = v.accent1 || v.accentA || '#6be4ff';
    const a2 = v.accent2 || v.accentB || '#6a6aff';
    const bg  = v.background || v.bg || '#071224';
    const glow = v.glow || a2;
    const textColor = v.textColor || v.text || '#eaf7ff';
    const fontFamily = v.fontFamily || v.font || getComputedStyle(root).getPropertyValue('--font-family') || 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
    const fontSize = (typeof v.fontSize !== 'undefined') ? (v.fontSize + 'px') : (getComputedStyle(root).getPropertyValue('--font-size-base') || '16px');

    // map fine-grained tokens (if admin set them) — fall back to sensible defaults
    const headingColor = v.headingColor || v.heading || textColor;
    const subheadingColor = v.subheadingColor || v.subheading || (function(){
      try{
        if(/^#/.test(textColor)){
          let hex = textColor.replace('#','');
          if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
          const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
          return `rgba(${r}, ${g}, ${b}, 0.65)`;
        }
      }catch(e){}
      return 'rgba(159,180,198,0.65)';
    })();

    const bodyColor = v.bodyColor || textColor;
    const btnText = v.btnText || v.btnTextColor || '#071224';
    const btnBg = v.btnBg || a1;

    // write CSS vars (only variables; DO NOT change other CSS rules)
    root.style.setProperty('--accent-a', a1);
    root.style.setProperty('--accent-b', a2);
    root.style.setProperty('--accent', `linear-gradient(90deg, ${a1}, ${a2})`);
    root.style.setProperty('--hero-glow', glow);
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--text-main', textColor);
    root.style.setProperty('--font-family', fontFamily);
    root.style.setProperty('--font-size-base', fontSize);

    // fine-grained tokens for elements you asked about
    root.style.setProperty('--heading-color', headingColor);
    root.style.setProperty('--subheading-color', subheadingColor);
    root.style.setProperty('--body-color', bodyColor);
    root.style.setProperty('--btn-text', btnText);
    root.style.setProperty('--btn-bg', btnBg);

    // borders / control contrast: choose sensible defaults based on bg luminance
    try{
      let lightBg = false;
      if(/^#/.test(bg)){
        let hex = bg.replace('#','');
        if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
        const r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
        const lum = 0.2126*r + 0.7152*g + 0.0722*b;
        lightBg = lum > 180;
      }
      if(lightBg){
        root.style.setProperty('--card-bg', v.cardBg || 'rgba(255,255,255,0.98)');
        root.style.setProperty('--card-border', v.cardBorder || 'rgba(0,0,0,0.12)');
        root.style.setProperty('--control-border', v.controlBorder || 'rgba(0,0,0,0.12)');
      } else {
        root.style.setProperty('--card-bg', v.cardBg || 'rgba(255,255,255,0.02)');
        root.style.setProperty('--card-border', v.cardBorder || 'rgba(255,255,255,0.06)');
        root.style.setProperty('--control-border', v.controlBorder || 'rgba(255,255,255,0.04)');
      }
    }catch(e){ /* ignore luminance errors */ }
  }

  /* ---------------- light-mode setter ---------------- */
  function setLightMode(on){
    if(on) root.classList.add('light-mode'); else root.classList.remove('light-mode');
    if(icon) icon.textContent = on ? '🌞' : '🌙';
    if(toggleBtn) toggleBtn.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem(P_THEME_KEY, on ? 'light' : 'dark'); } catch(e){}
  }

  /* ---------------- toggleDayNight (new) ---------------- */
  function toggleDayNight() {
    const btn = document.getElementById('dayNightBtn');
    const dayIcon = document.getElementById('dayNightIcon');
    const isLight = root.classList.contains('light-mode');
    const nextLight = !isLight;

    // if admin preview exists, update that
    try {
      const previewRaw = localStorage.getItem(PREVIEW_KEY);
      if (previewRaw) {
        const data = JSON.parse(previewRaw);
        data.theme = data.theme || {};
        data.theme.mode = nextLight ? 'light' : 'dark';
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
      } else {
        localStorage.setItem(P_THEME_KEY, nextLight ? 'light' : 'dark');
      }
    } catch (e) {
      console.warn("preview toggleDayNight parse error", e);
    }

    // apply HTML class for theme
    if (nextLight) root.classList.add('light-mode'); else root.classList.remove('light-mode');

    // apply button UI
    if (dayIcon) dayIcon.textContent = nextLight ? "🌙 Night" : "🌞 Day";
    if (btn) btn.setAttribute("aria-pressed", String(nextLight));
  }

  // If there's a dayNightBtn in the markup, wire it
  const dayNightBtn = document.getElementById('dayNightBtn');
  if(dayNightBtn) dayNightBtn.addEventListener('click', toggleDayNight);

  /* ---------------- applyFromData (applies content + theme) ---------------- */
  function applyFromData(data){
    if(!data) return;
    const storedMode = (function(){ try{ return localStorage.getItem(P_THEME_KEY); }catch(e){return null;} })();
    const dataMode = data.theme && data.theme.mode;
    let activeMode = dataMode || storedMode || 'dark';

    // apply theme/variant
    if(data.theme && (data.theme.dark || data.theme.light)){
      const variant = (activeMode === 'light') ? (data.theme.light || data.theme.dark) : (data.theme.dark || data.theme.light);
      applyTokensFromVariant(variant || {});
      setLightMode(activeMode === 'light');
    } else if(data.theme){
      const v = data.theme || {};
      applyTokensFromVariant({
        accent1: v.accent1, accent2: v.accent2, background: v.background, glow: v.glow,
        textColor: v.textColor, fontFamily: v.fontFamily, fontSize: v.fontSize,
        headingColor: v.headingColor, subheadingColor: v.subheadingColor,
        bodyColor: v.bodyColor, btnTextColor: v.btnTextColor, btnBgColor: v.btnBgColor,
        cardBg: v.cardBg
      });
      setLightMode(v.mode === 'light');
    }

    // content: projects
    if(Array.isArray(data.projects)){
      const grid = document.getElementById('projectsGrid') || document.querySelector('.projects-grid');
      if(grid){
        grid.innerHTML = '';
        data.projects.forEach(p=>{
          const card = document.createElement('div');
          card.className = 'project';
          card.innerHTML = `<div class="small muted">${p.short || 'Coming soon'}</div>
                            <div style="font-weight:700;margin-top:6px">${p.title || 'Untitled'}</div>
                            <div class="muted">${p.desc || ''}</div>`;
          grid.appendChild(card);
        });
      }
    }

    // site meta
    if(data.site){
      document.querySelectorAll('.brand-name').forEach(n=> n.textContent = data.site.name || n.textContent);
      document.querySelectorAll('.brand-sub').forEach(s=> s.textContent = data.site.subtitle || s.textContent);
      if(data.site.resume) document.querySelectorAll('[href$="Sangam_Yadav_Resume.pdf"]').forEach(a=> { a.href = data.site.resume; a.setAttribute('download',''); });
      if(data.site.linkedin){ const l = document.getElementById('linkedin') || document.getElementById('linkedinFooter'); if(l){ l.href = data.site.linkedin; l.target='_blank'; l.rel='noopener'; } }
    }
  }

  /* ---------------- loadAndApply (preview first, then assets/content.json) ---------------- */
  async function loadAndApply(){
    // ensure default preference exists
    try{ if(!localStorage.getItem(P_THEME_KEY)){ localStorage.setItem(P_THEME_KEY, 'dark'); } }catch(e){}

    // 1) preview (admin)
    try{
      const preview = localStorage.getItem(PREVIEW_KEY);
      if(preview){
        const data = JSON.parse(preview);
        applyFromData(data);
        return;
      }
    }catch(e){ console.warn('preview_content parse failed', e); }

    // 2) fetch published content
    try{
      const res = await fetch('assets/content.json?v=' + Date.now(), { cache: 'no-store' });
      if(res && res.ok){
        const data = await res.json();
        applyFromData(data);
        return;
      }
    }catch(e){ console.warn('failed to fetch content.json', e); }

    // 3) fallback to stored theme preference
    try{
      const stored = localStorage.getItem(P_THEME_KEY) || 'dark';
      if(stored === 'light') root.classList.add('light-mode'); else root.classList.remove('light-mode');
    }catch(e){}
  }

  /* ---------------- theme toggle handler (preserve preview) ---------------- */
  function toggleTheme(){
    const currentlyLight = root.classList.contains('light-mode');
    const nextLight = !currentlyLight;
    const preview = localStorage.getItem(PREVIEW_KEY);

    if(preview){
      try{
        const data = JSON.parse(preview);
        data.theme = data.theme || {};
        data.theme.mode = nextLight ? 'light' : 'dark';
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
        const variant = nextLight ? (data.theme.light || data.theme.dark) : (data.theme.dark || data.theme.light);
        if(variant) applyTokensFromVariant(variant);
      }catch(e){ console.warn('preview toggle failed', e); }
    } else {
      try{ localStorage.setItem(P_THEME_KEY, nextLight ? 'light' : 'dark'); }catch(e){}
      // fetch latest content.json and apply variant if present
      fetch('assets/content.json?v=' + Date.now(), {cache:'no-store'})
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if(!json) return;
          json.theme = json.theme || {};
          json.theme.mode = nextLight ? 'light' : 'dark';
          const variant = nextLight ? (json.theme.light || json.theme.dark) : (json.theme.dark || json.theme.light);
          if(variant) applyTokensFromVariant(variant);
        }).catch(()=>{});
    }
    setLightMode(nextLight);
  }

  if(toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  // Listen for admin preview updates from other tab
  window.addEventListener('storage', (e) => {
    if(!e) return;
    if(e.key === PREVIEW_KEY || e.key === P_THEME_KEY){
      setTimeout(loadAndApply, 40);
    }
  });

  // Init
  loadAndApply();
})();

/* ---------- Page loader with minimum 2s display + body lock ---------- */
(function(){
  const loader = document.getElementById('pageLoader');
  if(!loader) return;

  const root = document.documentElement;
  const body = document.body;
  let loaded = false;
  let minTimePassed = false;

  // apply lock immediately
  root.classList.add('loading');
  body.classList.add('loading');

  function removeLockAndHide(){
    root.classList.remove('loading');
    body.classList.remove('loading');
    loader.classList.add('hidden');
    setTimeout(()=>{ try{ loader.remove(); }catch(e){} }, 600);
  }

  function hideIfReady(){
    if(!loaded || !minTimePassed) return;
    removeLockAndHide();
  }

  setTimeout(()=>{
    minTimePassed = true;
    hideIfReady();
  }, 2000);

  window.addEventListener('load', ()=>{
    loaded = true;
    hideIfReady();
  });

  // safety fallback
  setTimeout(()=>{
    if(!loader.classList.contains('hidden')) removeLockAndHide();
  }, 8000);

  // allow site code to indicate readiness for async flows
  document.addEventListener('site-ready', ()=>{
    loaded = true;
    hideIfReady();
  });
})();

/* ---------- Robust mobile nav toggle (single, reliable implementation) ---------- */
(function(){
  try {
    const header = document.querySelector('.site-header');
    if(!header) return;
    const headerInner = header.querySelector('.header-inner');
    if(!headerInner) return;

    // reuse or create the button
    let btn = document.getElementById('mobileHamburger');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'mobileHamburger';
      btn.type = 'button';
      btn.className = 'btn small';
      btn.setAttribute('aria-label', 'Open navigation');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '☰';
      headerInner.appendChild(btn);
    }

    const nav = header.querySelector('.nav');
    if(!nav) console.warn('mobile-nav: .nav not found inside header');

    function openNav(){ header.classList.add('nav-open'); btn.setAttribute('aria-expanded','true'); }
    function closeNav(){ header.classList.remove('nav-open'); btn.setAttribute('aria-expanded','false'); }
    function toggleNav(e){ if(e && e.stopPropagation) e.stopPropagation(); header.classList.toggle('nav-open'); btn.setAttribute('aria-expanded', String(header.classList.contains('nav-open'))); }

    btn.addEventListener('click', toggleNav);

    // close when clicking outside nav or button
    document.addEventListener('click', (e) => {
      if(!header.classList.contains('nav-open')) return;
      const target = e.target;
      if(nav && (nav.contains(target) || btn.contains(target))) return;
      closeNav();
    });

    // close on Escape key
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && header.classList.contains('nav-open')) closeNav();
    });

    // close when a nav link is clicked
    header.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', closeNav));
  } catch (err) {
    console.error('mobile-nav: unexpected error', err);
  }
})();

(function(){
  const header = document.querySelector('.site-header');
  if(!header){ console.warn('no .site-header found'); return; }
  let btn = document.getElementById('mobileHamburger');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'mobileHamburger';
    btn.type = 'button';
    btn.className = 'btn small';
    btn.setAttribute('aria-label','Open navigation');
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML = '☰';
    const headerInner = header.querySelector('.header-inner') || header;
    headerInner.appendChild(btn);
    console.log('mobileHamburger created');
  } else {
    console.log('mobileHamburger exists');
  }

  // remove existing click handlers (defensive)
  btn.replaceWith(btn.cloneNode(true));
  btn = document.getElementById('mobileHamburger');

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    header.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', String(header.classList.contains('nav-open')));
    console.log('hamburger toggled, nav-open =', header.classList.contains('nav-open'));
  });

  // quick check
  console.log('hamburger handler attached');
})();
