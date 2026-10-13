// Inlined into every page so the reader is a single request and works offline.
// Every color, font and width comes from a custom property, so a theme is just a set of variables.

export const THEMES = {
  default: 'Default',
  github: 'GitHub',
  paper: 'Paper',
  dracula: 'Dracula',
} as const;

export type Theme = keyof typeof THEMES;
export const isTheme = (t: string): t is Theme => Object.hasOwn(THEMES, t);

const SANS = 'system-ui,-apple-system,"Segoe UI",sans-serif';
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

// Variables each theme sets. Status colors are badge backgrounds; --on-status and --on-gray are the text on them.
const vars = (v: Record<string, string>): string => Object.entries(v).map(([k, x]) => `--${k}:${x}`).join(';');

const DEFAULT_LIGHT = {
  bg: '#fbfaf7', fg: '#1f2328', muted: '#6b6f76', line: '#e6e2da', side: '#f3f1ec', accent: '#2f5bd3', 'on-accent': '#fff', code: '#f0ede6', heading: 'var(--fg)',
  green: '#1f883d', yellow: '#bf8700', red: '#cf222e', gray: '#6e7781', 'on-status': '#fff', 'on-gray': 'var(--on-status)',
  font: SANS, 'font-size': '16px', 'heading-font': 'var(--font)', mono: MONO, width: '780px',
};
const DEFAULT_DARK = { bg: '#16181c', fg: '#e4e2dd', muted: '#959aa3', line: '#2c3036', side: '#1c1f24', accent: '#8aa8ff', code: '#22262c' };

const GITHUB_LIGHT = {
  bg: '#ffffff', fg: '#1f2328', muted: '#59636e', line: '#d1d9e0', side: '#f6f8fa', accent: '#0969da', 'on-accent': '#fff', code: '#eff2f5',
  font: '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif', width: '880px',
};
const GITHUB_DARK = { bg: '#0d1117', fg: '#e6edf3', muted: '#9198a1', line: '#3d444d', side: '#010409', accent: '#4493f8', code: '#1f2428', green: '#238636', yellow: '#9e6a03', red: '#da3633', gray: '#656c76' };

const PAPER_LIGHT = {
  bg: '#fdfbf6', fg: '#2a2723', muted: '#7a7268', line: '#e8e1d3', side: '#f6f1e7', accent: '#9a3412', 'on-accent': '#fff', code: '#f1ebdf',
  green: '#3f6212', yellow: '#a16207', red: '#b91c1c', gray: '#78716c',
  font: '"Iowan Old Style","Palatino Linotype",Charter,Georgia,serif', 'font-size': '18px', 'heading-font': 'var(--font)', width: '680px',
};
const PAPER_DARK = { bg: '#1c1a17', fg: '#e9e3d8', muted: '#a39b8f', line: '#35312b', side: '#211f1b', accent: '#f0a37a', 'on-accent': '#1c1a17', code: '#2a2722' };

// https://draculatheme.com/contribute — dark only, by design.
const DRACULA = {
  bg: '#282a36', fg: '#f8f8f2', muted: '#8b93c4', line: '#44475a', side: '#21222c', accent: '#bd93f9', 'on-accent': '#282a36', code: '#343746', heading: '#ff79c6',
  green: '#50fa7b', yellow: '#f1fa8c', red: '#ff5555', gray: '#6272a4', 'on-status': '#282a36', 'on-gray': '#f8f8f2',
};

const light = (sel: string, v: Record<string, string>) => `${sel}{${vars(v)};color-scheme:light dark}`;
const dark = (sel: string, v: Record<string, string>) => `@media (prefers-color-scheme:dark){${sel}{${vars(v)}}}`;

const THEME_CSS = [
  light(':root', DEFAULT_LIGHT), dark(':root', DEFAULT_DARK),
  light(':root[data-theme=github]', GITHUB_LIGHT), dark(':root[data-theme=github]', GITHUB_DARK),
  light(':root[data-theme=paper]', PAPER_LIGHT), dark(':root[data-theme=paper]', PAPER_DARK),
  `:root[data-theme=dracula]{${vars(DRACULA)};color-scheme:dark}`,
].join('\n');

export const CSS = `${THEME_CSS}
*{box-sizing:border-box}
body{margin:0;display:grid;grid-template-columns:300px 1fr;min-height:100vh;background:var(--bg);color:var(--fg);font:var(--font-size)/1.65 var(--font)}
aside{position:sticky;top:0;height:100vh;overflow:auto;background:var(--side);border-right:1px solid var(--line);padding:20px 14px;font-family:${SANS}}
aside .top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 6px 12px}
aside .home{font-weight:700;font-size:18px;color:var(--fg);text-decoration:none}
aside .home small{color:var(--muted);font-weight:400;font-size:13px}
#theme{padding:3px 6px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;font-size:12px;cursor:pointer}
#q{width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px;margin-bottom:10px}
aside ul{list-style:none;margin:0;padding:0}
aside li a{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;color:var(--fg);text-decoration:none;font-size:14px;line-height:1.35}
aside li a:hover{background:var(--line)}
aside li a.active{background:var(--accent);color:var(--on-accent)}
aside li.dir{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:14px 8px 4px}
main{max-width:var(--width);width:100%;padding:48px 40px 80px;margin:0 auto}
a{color:var(--accent)}
h1,h2,h3,h4{font-family:var(--heading-font);color:var(--heading)}
h1{font-size:2rem;line-height:1.2;margin:.2em 0 .6em}
h2{margin-top:2em;padding-bottom:.25em;border-bottom:1px solid var(--line)}
code{font-family:var(--mono);background:var(--code);padding:.15em .35em;border-radius:4px;font-size:.88em}
pre{background:var(--code);padding:14px 16px;border-radius:8px;overflow:auto}pre code{padding:0;background:none}
blockquote{margin:1em 0;padding:.2em 1em;border-left:3px solid var(--line);color:var(--muted)}
img{max-width:100%}
table{border-collapse:collapse;width:100%;margin:1em 0}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:13px;color:var(--muted);font-weight:600}
.path{color:var(--muted);font-size:13px;font-family:var(--mono)}
td .path{font-size:12px}.date{white-space:nowrap;color:var(--muted)}
.meta{display:flex;gap:12px;align-items:center}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:16px 0 0;padding:12px 16px;border:1px solid var(--line);border-radius:8px;font-size:14px}
dt{color:var(--muted);text-transform:capitalize}dd{margin:0}
.badge{flex:none;font-family:${SANS};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:#8884;color:var(--fg)}
.s-accepted{background:var(--green);color:var(--on-status)}.s-proposed,.s-draft{background:var(--yellow);color:var(--on-status)}
.s-rejected{background:var(--red);color:var(--on-status)}.s-deprecated,.s-superseded{background:var(--gray);color:var(--on-gray)}
aside a.active .badge{background:color-mix(in srgb,var(--on-accent) 22%,transparent);color:var(--on-accent)}
.warn{margin:16px 0 0;padding:10px 14px;border:1px solid var(--red);border-radius:8px;color:var(--red);font-size:14px}
.pn{display:flex;justify-content:space-between;gap:16px;margin-top:56px;padding-top:20px;border-top:1px solid var(--line)}
.pn a{text-decoration:none;max-width:48%}.pn a:last-child{text-align:right}.pn small{display:block;color:var(--muted)}
@media (max-width:800px){body{grid-template-columns:1fr}aside{position:static;height:auto;max-height:40vh;border-right:0;border-bottom:1px solid var(--line)}main{padding:24px 16px 60px}}
`;
