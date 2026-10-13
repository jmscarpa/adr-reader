// Inlined into every page so the reader is a single request and works offline.
export const CSS = `
:root{--bg:#fbfaf7;--fg:#1f2328;--muted:#6b6f76;--line:#e6e2da;--side:#f3f1ec;--accent:#2f5bd3;--code:#f0ede6;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#16181c;--fg:#e4e2dd;--muted:#959aa3;--line:#2c3036;--side:#1c1f24;--accent:#8aa8ff;--code:#22262c}}
*{box-sizing:border-box}
body{margin:0;display:grid;grid-template-columns:300px 1fr;min-height:100vh;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}
aside{position:sticky;top:0;height:100vh;overflow:auto;background:var(--side);border-right:1px solid var(--line);padding:20px 14px}
aside .home{display:block;font-weight:700;font-size:18px;color:var(--fg);text-decoration:none;margin:0 6px 12px}
aside .home small{color:var(--muted);font-weight:400;font-size:13px}
#q{width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px;margin-bottom:10px}
aside ul{list-style:none;margin:0;padding:0}
aside li a{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;color:var(--fg);text-decoration:none;font-size:14px;line-height:1.35}
aside li a:hover{background:var(--line)}
aside li a.active{background:var(--accent);color:#fff}
aside li.dir{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:14px 8px 4px}
main{max-width:780px;width:100%;padding:48px 40px 80px;margin:0 auto}
a{color:var(--accent)}
h1{font-size:2rem;line-height:1.2;margin:.2em 0 .6em}
h2{margin-top:2em;padding-bottom:.25em;border-bottom:1px solid var(--line)}
code{background:var(--code);padding:.15em .35em;border-radius:4px;font-size:.9em}
pre{background:var(--code);padding:14px 16px;border-radius:8px;overflow:auto}pre code{padding:0;background:none}
blockquote{margin:1em 0;padding:.2em 1em;border-left:3px solid var(--line);color:var(--muted)}
img{max-width:100%}
table{border-collapse:collapse;width:100%;margin:1em 0}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:13px;color:var(--muted);font-weight:600}
.path{color:var(--muted);font-size:13px;font-family:ui-monospace,monospace}
td .path{font-size:12px}.date{white-space:nowrap;color:var(--muted)}
.meta{display:flex;gap:12px;align-items:center}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:16px 0 0;padding:12px 16px;border:1px solid var(--line);border-radius:8px;font-size:14px}
dt{color:var(--muted);text-transform:capitalize}dd{margin:0}
.badge{flex:none;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:#8884;color:var(--fg)}
.s-accepted{background:#1f883d;color:#fff}.s-proposed,.s-draft{background:#bf8700;color:#fff}
.s-rejected{background:#cf222e;color:#fff}.s-deprecated,.s-superseded{background:#6e7781;color:#fff}
aside a.active .badge{background:#fff3;color:#fff}
.warn{margin:16px 0 0;padding:10px 14px;border:1px solid #cf222e;border-radius:8px;color:#cf222e;font-size:14px}
.pn{display:flex;justify-content:space-between;gap:16px;margin-top:56px;padding-top:20px;border-top:1px solid var(--line)}
.pn a{text-decoration:none;max-width:48%}.pn a:last-child{text-align:right}.pn small{display:block;color:var(--muted)}
@media (max-width:800px){body{grid-template-columns:1fr}aside{position:static;height:auto;max-height:40vh;border-right:0;border-bottom:1px solid var(--line)}main{padding:24px 16px 60px}}
`;
