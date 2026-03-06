/* ══════════════════════════════════════════════════════
   THEME DEFINITIONS
   ══════════════════════════════════════════════════════ */
const THEMES = [
  { id: 'violet-dark',   label: 'Violet',  dark: true,  swatch: '#7c6aff' },
  { id: 'violet-light',  label: 'Violet',  dark: false, swatch: '#5b47e0' },
  { id: 'emerald-dark',  label: 'Emerald', dark: true,  swatch: '#22d87a' },
  { id: 'emerald-light', label: 'Emerald', dark: false, swatch: '#16a34a' },
  { id: 'amber-dark',    label: 'Amber',   dark: true,  swatch: '#f5a623' },
  { id: 'rose-dark',     label: 'Rose',    dark: true,  swatch: '#f43f7e' },
  { id: 'cyan-dark',     label: 'Cyan',    dark: true,  swatch: '#06b6d4' },
    // Simple Light Themes
  { id: 'sky-light',     label: 'Sky',     dark: false, swatch: '#38bdf8' },
  { id: 'mint-light',    label: 'Mint',    dark: false, swatch: '#34d399' },
  { id: 'peach-light',   label: 'Peach',   dark: false, swatch: '#fb923c' },
  { id: 'lavender-light',label: 'Lavender',dark: false, swatch: '#a78bfa' },
  { id: 'sand-light',    label: 'Sand',    dark: false, swatch: '#eab308' },

  // Modern Themes
  { id: 'midnight-dark', label: 'Midnight',dark: true,  swatch: '#1e293b' },
  { id: 'neon-blue',     label: 'Neon Blue',dark: true, swatch: '#2563eb' },
  { id: 'electric-purple',label:'Electric Purple',dark:true,swatch:'#9333ea' },
  { id: 'teal-modern',   label: 'Teal',    dark: true,  swatch: '#0d9488' },
  { id: 'crimson-dark',  label: 'Crimson', dark: true,  swatch: '#dc2626' },
];

/* ══════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════ */
let is24Hour     = false;
let currentTheme = 'violet-dark';

const THEME_KEY  = 'clk-theme';
const FORMAT_KEY = 'clk-format';

/* ══════════════════════════════════════════════════════
   DOM REFS
   ══════════════════════════════════════════════════════ */
const segHours   = document.getElementById('seg-hours');
const segMins    = document.getElementById('seg-minutes');
const segSecs    = document.getElementById('seg-seconds');
const ampmEl     = document.getElementById('ampm-badge');
const dateEl     = document.getElementById('date-display');
const tzEl       = document.getElementById('timezone-label');

const dlBtn      = document.getElementById('dark-light-btn');
const dlIcon     = document.getElementById('dl-icon');
const dlLabel    = document.getElementById('dl-label');
const formatBtn  = document.getElementById('format-btn');
const formatLbl  = document.getElementById('format-label');
const gearBtn    = document.getElementById('gear-btn');

const settingsPanel   = document.getElementById('settings-panel');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettings   = document.getElementById('close-settings');
const themeGrid       = document.getElementById('theme-grid');
const pillToggle      = document.getElementById('format-toggle');
const fmt12El         = document.getElementById('fmt-12');
const fmt24El         = document.getElementById('fmt-24');

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
const pad   = n => String(n).padStart(2, '0');
const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS= ['January','February','March','April','May','June',
               'July','August','September','October','November','December'];

/**
 * Set two-digit value into a seg-cell without layout shift.
 * We update each .d span individually so the cell width (2ch) never changes.
 */
function setCell(cell, value) {
  const s = pad(value);
  const spans = cell.querySelectorAll('.d');
  spans[0].textContent = s[0];
  spans[1].textContent = s[1];
}

/* ══════════════════════════════════════════════════════
   CLOCK TICK
   ══════════════════════════════════════════════════════ */
let lastSec = -1;

function tick() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  /* Seconds flash only on change */
  if (s !== lastSec) {
    lastSec = s;
    segSecs.classList.remove('flash');
    void segSecs.offsetWidth; // reflow to restart animation
    segSecs.classList.add('flash');
  }

  /* Format */
  if (is24Hour) {
    setCell(segHours, h);
    ampmEl.classList.add('hidden');
  } else {
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    setCell(segHours, h);
    ampmEl.textContent = ampm;
    ampmEl.classList.remove('hidden');
  }

  setCell(segMins, m);
  setCell(segSecs, s);

  /* Date */
  dateEl.textContent = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  /* Timezone offset */
  const offset = -now.getTimezoneOffset();
  const sign   = offset >= 0 ? '+' : '-';
  const abs    = Math.abs(offset);
  tzEl.textContent = `UTC${sign}${pad(Math.floor(abs/60))}:${pad(abs%60)}`;
}

/* ══════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════ */
function applyTheme(id) {
  currentTheme = id;
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(THEME_KEY, id);

  /* Update dark/light button label */
  const t = THEMES.find(x => x.id === id);
  if (t) {
    dlIcon.textContent  = t.dark ? '☀️' : '🌙';
    dlLabel.textContent = t.dark ? 'Light' : 'Dark';
  }

  /* Highlight active card in grid */
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === id);
  });
}

/* Dark/Light quick toggle: flip between dark and light variant of current palette */
dlBtn.addEventListener('click', () => {
  const cur  = THEMES.find(x => x.id === currentTheme);
  if (!cur) return;

  // Find opposite brightness variant for same palette name
  const palette = cur.label.toLowerCase();
  const target  = THEMES.find(x =>
    x.label.toLowerCase() === palette && x.dark !== cur.dark
  );
  applyTheme(target ? target.id : (cur.dark ? 'violet-light' : 'violet-dark'));
});

/* ══════════════════════════════════════════════════════
   FORMAT
   ══════════════════════════════════════════════════════ */
function applyFormat(use24) {
  is24Hour = use24;
  formatLbl.textContent = use24 ? '24h' : '12h';
  pillToggle.setAttribute('aria-checked', String(use24));
  fmt12El.classList.toggle('active', !use24);
  fmt24El.classList.toggle('active', use24);
  localStorage.setItem(FORMAT_KEY, use24 ? '24' : '12');
  tick();
}

formatBtn.addEventListener('click', () => applyFormat(!is24Hour));
pillToggle.addEventListener('click', () => applyFormat(!is24Hour));

/* ══════════════════════════════════════════════════════
   SETTINGS PANEL
   ══════════════════════════════════════════════════════ */
function buildThemeGrid() {
  themeGrid.innerHTML = '';
  THEMES.forEach(t => {
    const card = document.createElement('button');
    card.className   = 'theme-card';
    card.dataset.theme = t.id;
    card.innerHTML   = `
      <span class="theme-swatch" style="background:${t.swatch}"></span>
      <span>${t.label}<br><small style="opacity:0.6;font-weight:400">${t.dark?'Dark':'Light'}</small></span>
    `;
    card.addEventListener('click', () => applyTheme(t.id));
    themeGrid.appendChild(card);
  });
}

function openSettings() {
  settingsPanel.classList.add('open');
  settingsPanel.setAttribute('aria-hidden', 'false');
  settingsOverlay.classList.add('open');
  /* highlight active card */
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === currentTheme);
  });
}

function closeSettingsPanel() {
  settingsPanel.classList.remove('open');
  settingsPanel.setAttribute('aria-hidden', 'true');
  settingsOverlay.classList.remove('open');
}

gearBtn.addEventListener('click', openSettings);
closeSettings.addEventListener('click', closeSettingsPanel);
settingsOverlay.addEventListener('click', closeSettingsPanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettingsPanel(); });

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
buildThemeGrid();

const savedTheme  = localStorage.getItem(THEME_KEY)  || 'violet-dark';
const savedFormat = localStorage.getItem(FORMAT_KEY) || '12';

applyTheme(savedTheme);
applyFormat(savedFormat === '24');

tick();
setInterval(tick, 1000);
