// script.js (theme renderer for index.html)
// This script reads localStorage.preview_content (admin preview) and assets/content.json (published).
// It applies token CSS variables and toggles the .light-mode class for full-site theme switch.
// It also listens for storage events (admin apply live) and for user toggle clicks.

(function(){
  const PREVIEW_KEY = 'preview_content';
  const P_THEME_KEY = 'portfolio-theme';
  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeIcon');
  const yearEl = document.getElementById('year');

  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // ========================
// NEW toggleDayNight() FUNCTION
// ========================
function toggleDayNight() {
  const PREVIEW_KEY = 'preview_content';
  const P_THEME_KEY = 'portfolio-theme';
  const root = document.documentElement;
  const btn = document.getElementById('dayNightBtn');
  const icon = document.getElementById('dayNightIcon');

  const isLight = root.classList.contains('light-mode');
  const nextLight = !isLight;

  // if admin preview exists, update that
  const previewRaw = localStorage.getItem(PREVIEW_KEY);
  if (previewRaw) {
    try {
      const data = JSON.parse(previewRaw);
      data.theme = data.theme || {};
      data.theme.mode = nextLight ? 'light' : 'dark';
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Preview parse error", e);
    }
  } else {
    // normal user preference
    localStorage.setItem(P_THEME_KEY, nextLight ? 'light' : 'dark');
  }

  // apply HTML class for theme
  if (nextLight) root.classList.add('light-mode');
  else root.classList.remove('light-mode');

  // apply button UI
  if (icon) icon.textContent = nextLight ? "🌙 Night" : "🌞 Day";
  if (btn) btn.setAttribute("aria-pressed", String(nextLight));
}


  // helpers
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
  function isLight(hex){
    try{
      const c = hexToRgb(hex);
      if(!c) return false;
      const lum = 0.2126*c.r + 0.7152*c.g + 0.0722*c.b;
      return lum > 180;
    }catch(e){ return false; }
  }

/* REPLACE applyTokensFromVariant(v) in script.js with this function */
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
  const fontSize = (typeof v.fontSize !== 'undefined') ? (v.fontSize + 'px') : getComputedStyle(root).getPropertyValue('--font-size-base') || '16px';

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

  // borders / control contrast: choose sensible defaults based on bg
  try{
    let isLight = false;
    if(/^#/.test(bg)){
      let hex = bg.replace('#','');
      if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
      const r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
      const lum = 0.2126*r + 0.7152*g + 0.0722*b;
      isLight = lum > 180;
    }
    if(isLight){
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


  function setLightMode(on){
    if(on) root.classList.add('light-mode'); else root.classList.remove('light-mode');
    if(icon) icon.textContent = on ? '🌞' : '🌙';
    if(toggleBtn) toggleBtn.setAttribute('aria-pressed', String(on));
    localStorage.setItem(P_THEME_KEY, on ? 'light' : 'dark');
  }

  function applyFromData(data){
    if(!data) return;
    const storedMode = localStorage.getItem(P_THEME_KEY);
    const dataMode = data.theme && data.theme.mode;
    let activeMode = dataMode || storedMode || 'dark';

    // If explicit variants present, choose correct one
    if(data.theme && (data.theme.dark || data.theme.light)){
      const variant = (activeMode === 'light') ? (data.theme.light || data.theme.dark) : (data.theme.dark || data.theme.light);
      applyTokensFromVariant(variant || {});
      setLightMode(activeMode === 'light');
    } else if(data.theme){
      const v = data.theme || {};
      applyTokensFromVariant({
        accent1: v.accent1, accent2: v.accent2, background: v.background, glow: v.glow,
        textColor: v.textColor, fontFamily: v.fontFamily, fontSizeBase: v.fontSizeBase,
        fontSizeHeading: v.fontSizeHeading, scale: v.scale, muted: v.muted,
        headingColor: v.headingColor, subheadingColor: v.subheadingColor,
        bodyColor: v.bodyColor, btnTextColor: v.btnTextColor, btnBgColor: v.btnBgColor,
        cardBg: v.cardBg
      });
      setLightMode(v.mode === 'light');
    }

    // content: projects
    if(Array.isArray(data.projects)){
      const grid = document.querySelector('.projects-grid');
      if(grid){
        grid.innerHTML = '';
        data.projects.forEach(p=>{
          const card = document.createElement('div');
          card.className = 'project glass';
          card.innerHTML = `<div class="coming">${(p.short||'Coming soon')}</div>
            <div class="title">${(p.title||'Untitled')}</div>
            <div class="mini muted">${(p.desc||'')}</div>`;
          grid.appendChild(card);
        });
      }
    }

    // site meta
    if(data.site){
      document.querySelectorAll('.brand-name').forEach(n=> n.textContent = data.site.name || n.textContent);
      document.querySelectorAll('.brand-sub').forEach(s=> s.textContent = data.site.subtitle || s.textContent);
      if(data.site.resume){
        document.querySelectorAll('[href$="Sangam_Yadav_Resume.pdf"]').forEach(a=>{
          a.href = data.site.resume;
          a.setAttribute('download','');
        });
      }
      if(data.site.linkedin){
        const l = document.getElementById('linkedin');
        if(l){ l.href = data.site.linkedin; l.target='_blank'; l.rel='noopener'; }
      }
    }
  }

  /* ---------------- loadAndApply() ----------------
   Replace existing loadAndApply with this.
   Behavior:
     1) If localStorage.preview_content exists -> use it (admin preview precedence)
     2) Else try fetch('assets/content.json') and apply
     3) Else fallback: use localStorage.portfolio-theme or default 'dark'
   Only changes theme application and project injection; does not alter HTML structure or CSS rules.
*/
async function loadAndApply(){
  const PREVIEW_KEY = 'preview_content';
  const P_THEME_KEY = 'portfolio-theme';
  const root = document.documentElement;
  const projectsGrid = document.getElementById('projectsGrid');

  // ensure default preference exists (dark)
  try{ if(!localStorage.getItem(P_THEME_KEY)){ localStorage.setItem(P_THEME_KEY, 'dark'); } }catch(e){}

  // 1) admin preview (authoritative)
  const preview = localStorage.getItem(PREVIEW_KEY);
  if(preview){
    try{
      const data = JSON.parse(preview);
      if(data && data.theme){
        // determine mode and variant
        const mode = (data.theme.mode) ? data.theme.mode : (localStorage.getItem(P_THEME_KEY) || 'dark');
        const variant = (mode === 'light') ? (data.theme.light || data.theme.dark) : (data.theme.dark || data.theme.light);
        applyTokensFromVariant(variant || data.theme);
        if(mode === 'light') root.classList.add('light-mode'); else root.classList.remove('light-mode');
      }
      // apply site text + projects if present
      if(data.site){
        document.querySelectorAll('.brand-name').forEach(n=> n.textContent = data.site.name || n.textContent);
        document.querySelectorAll('.brand-sub').forEach(s=> s.textContent = data.site.subtitle || s.textContent);
        if(data.site.resume) document.querySelectorAll('[href$="Sangam_Yadav_Resume.pdf"]').forEach(a=> { a.href = data.site.resume; a.setAttribute('download',''); });
        if(data.site.linkedin){ const l = document.getElementById('linkedin'); if(l){ l.href = data.site.linkedin; l.target='_blank'; l.rel='noopener'; } }
      }
      if(Array.isArray(data.projects) && projectsGrid){
        projectsGrid.innerHTML = '';
        data.projects.forEach(p => {
          const card = document.createElement('div');
          card.className = 'project';
          card.innerHTML = `<div class="small muted">${p.short || 'Coming soon'}</div>
                            <div style="font-weight:700;margin-top:6px">${p.title || 'Untitled'}</div>
                            <div class="muted">${p.desc || ''}</div>`;
          projectsGrid.appendChild(card);
        });
      }
      return;
    }catch(e){ console.warn('preview_content parse failed', e); }
  }

  // 2) fetch published content.json
  try{
    const res = await fetch('assets/content.json?v=' + Date.now(), { cache: 'no-store' });
    if(res && res.ok){
      const data = await res.json();
      if(data && data.theme){
        const mode = (data.theme.mode) ? data.theme.mode : (localStorage.getItem(P_THEME_KEY) || 'dark');
        const variant = (mode === 'light') ? (data.theme.light || data.theme.dark) : (data.theme.dark || data.theme.light);
        applyTokensFromVariant(variant || data.theme);
        if(mode === 'light') root.classList.add('light-mode'); else root.classList.remove('light-mode');
      }
      if(data.site){
        document.querySelectorAll('.brand-name').forEach(n=> n.textContent = data.site.name || n.textContent);
        document.querySelectorAll('.brand-sub').forEach(s=> s.textContent = data.site.subtitle || s.textContent);
        if(data.site.resume) document.querySelectorAll('[href$="Sangam_Yadav_Resume.pdf"]').forEach(a=> { a.href = data.site.resume; a.setAttribute('download',''); });
        if(data.site.linkedin){ const l = document.getElementById('linkedin'); if(l){ l.href = data.site.linkedin; l.target='_blank'; l.rel='noopener'; } }
      }
      if(Array.isArray(data.projects) && projectsGrid){
        projectsGrid.innerHTML = '';
        data.projects.forEach(p => {
          const card = document.createElement('div');
          card.className = 'project';
          card.innerHTML = `<div class="small muted">${p.short || 'Coming soon'}</div>
                            <div style="font-weight:700;margin-top:6px">${p.title || 'Untitled'}</div>
                            <div class="muted">${p.desc || ''}</div>`;
          projectsGrid.appendChild(card);
        });
      }
      return;
    }
  }catch(e){ console.warn('failed to fetch content.json', e); }

  // 3) fallback: respect stored preference (ensured earlier)
  try{
    const stored = localStorage.getItem(P_THEME_KEY) || 'dark';
    if(stored === 'light') root.classList.add('light-mode'); else root.classList.remove('light-mode');
  }catch(e){}
}


  // Toggle handler — preserve preview when present
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
      }catch(e){
        console.warn('preview toggle failed', e);
      }
    } else {
      localStorage.setItem(P_THEME_KEY, nextLight ? 'light' : 'dark');
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
