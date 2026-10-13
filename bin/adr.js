#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const args = process.argv.slice(2);
const dirArg = args.find((a) => !a.startsWith('--')) || '.';
const root = path.resolve(dirArg);
const shouldOpen = !args.includes('--no-open');
const port = Number(process.env.PORT) || 4321;

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Not a directory: ${root}\nUsage: npx adr path/to/docs/adr`);
  process.exit(1);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? v.map(fmt).join(', ') : typeof v === 'object' && v ? JSON.stringify(v) : String(v));

// Re-read on every request so edits show up on refresh.
// ponytail: full rescan per request, add fs.watch + cache if folders get into the thousands
function load() {
  return fs.readdirSync(root, { recursive: true })
    .filter((f) => f.endsWith('.md') && !f.split(path.sep).some((p) => p.startsWith('.') || p === 'node_modules'))
    .map((f) => {
      const rel = f.split(path.sep).join('/');
      const { data, content } = matter(fs.readFileSync(path.join(root, f), 'utf8'));
      const h1 = content.match(/^#\s+(.+)$/m)?.[1];
      return { rel, data, content, h1, title: data.title || h1 || path.basename(f, '.md') };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel, undefined, { numeric: true }));
}

const badge = (status) => status ? `<span class="badge s-${esc(String(status).toLowerCase().split(/\s/)[0])}">${esc(status)}</span>` : '';

function sidebar(adrs, current) {
  let dir = null, out = '';
  for (const a of adrs) {
    const d = path.posix.dirname(a.rel);
    if (d !== dir) { dir = d; if (d !== '.') out += `<li class="dir">${esc(d)}</li>`; }
    out += `<li><a href="/${encodeURI(a.rel)}"${a === current ? ' class="active"' : ''} data-q="${esc((a.title + ' ' + a.rel + ' ' + (a.data.status || '')).toLowerCase())}">${esc(a.title)}${badge(a.data.status)}</a></li>`;
  }
  return `<aside><a class="home" href="/">ADRs <small>${adrs.length}</small></a>
<input id="q" type="search" placeholder="Filter…" autocomplete="off" aria-label="Filter ADRs"><ul>${out}</ul></aside>`;
}

function page(title, adrs, current, main) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head><body>${sidebar(adrs, current)}<main>${main}</main>
<script>
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const v = q.value.toLowerCase();
  document.querySelectorAll('aside a[data-q]').forEach((a) => a.parentElement.hidden = !a.dataset.q.includes(v));
});
addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
new EventSource('/__reload').onmessage = () => location.reload();
</script></body></html>`;
}

function indexPage(adrs) {
  const rows = adrs.map((a) => `<tr><td><a href="/${encodeURI(a.rel)}">${esc(a.title)}</a><div class="path">${esc(a.rel)}</div></td><td>${badge(a.data.status)}</td><td class="date">${a.data.date ? esc(fmt(a.data.date)) : ''}</td></tr>`).join('');
  return page('Architecture Decision Records', adrs, null, `<h1>Architecture Decision Records</h1><p class="path">${esc(root)}</p>
${adrs.length ? `<table><thead><tr><th>Decision</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>No Markdown files found.</p>'}`);
}

function adrPage(adrs, a) {
  const meta = Object.entries(a.data).filter(([k]) => k !== 'title' && k !== 'status')
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(fmt(v))}</dd>`).join('');
  const body = a.h1 && !a.data.title ? marked.parse(a.content) : `<h1>${esc(a.title)}</h1>${marked.parse(a.content)}`;
  const i = adrs.indexOf(a), prev = adrs[i - 1], next = adrs[i + 1];
  const nav = (x, label) => x ? `<a href="/${encodeURI(x.rel)}"><small>${label}</small>${esc(x.title)}</a>` : '<span></span>';
  return page(a.title, adrs, a, `<div class="meta">${badge(a.data.status)}<span class="path">${esc(a.rel)}</span></div>
${meta ? `<dl>${meta}</dl>` : ''}<article>${body}</article><nav class="pn">${nav(prev, '← Previous')}${nav(next, 'Next →')}</nav>`);
}

const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf' };

// Live reload: browsers hold an SSE connection; any change under root pings them.
const clients = new Set();
let timer;
fs.watch(root, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => clients.forEach((c) => c.write('data: reload\n\n')), 100);
});

function openBrowser(url) {
  const [cmd, ...rest] = process.platform === 'darwin' ? ['open'] : process.platform === 'win32' ? ['cmd', '/c', 'start', '""'] : ['xdg-open'];
  spawn(cmd, [...rest, url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}

http.createServer((req, res) => {
  if (req.url === '/__reload') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    return req.on('close', () => clients.delete(res));
  }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).slice(1); } catch { rel = null; }
  const adrs = load();
  const send = (code, html) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); };
  if (rel === '') return send(200, indexPage(adrs));
  const a = adrs.find((x) => x.rel === rel);
  if (a) return send(200, adrPage(adrs, a));
  // Static assets (diagrams referenced from ADRs), confined to root.
  const file = rel != null && path.resolve(root, rel);
  if (file && file.startsWith(root + path.sep) && TYPES[path.extname(file).toLowerCase()] && fs.existsSync(file)) {
    res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] });
    return fs.createReadStream(file).pipe(res);
  }
  send(404, page('Not found', adrs, null, '<h1>Not found</h1><p><a href="/">Back to index</a></p>'));
}).on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use. Try PORT=4322 npx adr-reader ${dirArg}` : e.message);
  process.exit(1);
}).listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}`;
  console.log(`ADR reader for ${root}\n→ ${url}`);
  if (shouldOpen) openBrowser(url);
});

const CSS = `
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
.pn{display:flex;justify-content:space-between;gap:16px;margin-top:56px;padding-top:20px;border-top:1px solid var(--line)}
.pn a{text-decoration:none;max-width:48%}.pn a:last-child{text-align:right}.pn small{display:block;color:var(--muted)}
@media (max-width:800px){body{grid-template-columns:1fr}aside{position:static;height:auto;max-height:40vh;border-right:0;border-bottom:1px solid var(--line)}main{padding:24px 16px 60px}}
`;
