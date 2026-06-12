export const APP_NAME = 'ThinkCanvas';
export const STORAGE_KEY = 'thinkcanvas_v1';
export const GRID_SIZE = 24;
export const MIN_WIDTH = 180;
export const MIN_HEIGHT = 120;
export const DEFAULT_WIDTH = 300;
export const DEFAULT_HEIGHT = 210;

export const COLOR_THEMES = {
  snow:    {
    label: 'Snow',
    light: { bg:'#ffffff', border:'#e5e5e7', text:'#1d1d1f', headerBg:'#fafafa', accent:'#86868b' },
    dark: { bg:'#1c1c1e', border:'#38383a', text:'#f5f5f7', headerBg:'#2c2c2e', accent:'#98989d' }
  },
  sky:     {
    label: 'Sky',
    light: { bg:'#f0f9ff', border:'#7dd3fc', text:'#075985', headerBg:'#e0f2fe', accent:'#0ea5e9' },
    dark: { bg:'#082f49', border:'#0c4a6e', text:'#bae6fd', headerBg:'#0c4a6e', accent:'#38bdf8' }
  },
  violet:  {
    label: 'Violet',
    light: { bg:'#f5f3ff', border:'#c4b5fd', text:'#5b21b6', headerBg:'#ede9fe', accent:'#8b5cf6' },
    dark: { bg:'#2e1065', border:'#4c1d95', text:'#ddd6fe', headerBg:'#4c1d95', accent:'#a78bfa' }
  },
  emerald: {
    label: 'Emerald',
    light: { bg:'#f0fdf4', border:'#86efac', text:'#065f46', headerBg:'#dcfce7', accent:'#10b981' },
    dark: { bg:'#064e3b', border:'#065f46', text:'#d1fae5', headerBg:'#065f46', accent:'#34d399' }
  },
  amber:   {
    label: 'Amber',
    light: { bg:'#fffbeb', border:'#fde047', text:'#92400e', headerBg:'#fef3c7', accent:'#f59e0b' },
    dark: { bg:'#451a03', border:'#78350f', text:'#fef3c7', headerBg:'#78350f', accent:'#fbbf24' }
  },
  rose:    {
    label: 'Rose',
    light: { bg:'#fff1f2', border:'#fda4af', text:'#9f1239', headerBg:'#ffe4e6', accent:'#f43f5e' },
    dark: { bg:'#4c0519', border:'#881337', text:'#fecdd3', headerBg:'#881337', accent:'#fb7185' }
  },
  slate:   {
    label: 'Slate',
    light: { bg:'#f8fafc', border:'#cbd5e1', text:'#0f172a', headerBg:'#f1f5f9', accent:'#64748b' },
    dark: { bg:'#0f172a', border:'#1e293b', text:'#e2e8f0', headerBg:'#1e293b', accent:'#94a3b8' }
  },
  peach:   {
    label: 'Peach',
    light: { bg:'#fff7ed', border:'#fed7aa', text:'#9a3412', headerBg:'#ffedd5', accent:'#f97316' },
    dark: { bg:'#431407', border:'#7c2d12', text:'#fed7aa', headerBg:'#7c2d12', accent:'#fb923c' }
  },
};

export function resolveTheme(colorKey, isDark) {
  const t = COLOR_THEMES[colorKey] || COLOR_THEMES.snow;
  return isDark ? t.dark : t.light;
}
