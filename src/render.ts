import path from 'node:path';
import { marked } from 'marked';
import type { Adr } from './load.js';
import { isRelationKey } from './parse.js';
import { CSS, THEMES, type Theme } from './style.js';

export interface RenderContext {
  root: string;
  /** Theme used until the reader picks another one in the page. */
  theme: Theme;
}

const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (v: unknown): string => (v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? v.map(fmt).join(', ') : typeof v === 'object' && v ? JSON.stringify(v) : String(v));
const md = (s: string): string => marked.parse(s, { async: false });

const badge = (status: unknown): string => status ? `<span class="badge s-${esc(String(status).toLowerCase().split(/\s/)[0])}">${esc(status)}</span>` : '';

function sidebar(adrs: Adr[], current: Adr | null): string {
  let dir: string | null = null, out = '';
  for (const a of adrs) {
    const d = path.posix.dirname(a.rel);
    if (d !== dir) { dir = d; if (d !== '.') out += `<li class="dir">${esc(d)}</li>`; }
    out += `<li><a href="/${encodeURI(a.rel)}"${a === current ? ' class="active"' : ''} data-q="${esc((a.title + ' ' + a.rel + ' ' + (a.status || '')).toLowerCase())}">${esc(a.title)}${badge(a.status)}</a></li>`;
  }
  const themes = Object.entries(THEMES).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
  return `<aside><div class="top"><a class="home" href="/">ADRs <small>${adrs.length}</small></a>
<select id="theme" aria-label="Theme">${themes}</select></div>
<input id="q" type="search" placeholder="Filter…" autocomplete="off" aria-label="Filter ADRs"><ul>${out}</ul></aside>`;
}

export function page(ctx: RenderContext, title: string, adrs: Adr[], current: Adr | null, main: string): string {
  return `<!doctype html><html lang="en" data-theme="${ctx.theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style>
<script>
// Apply the reader's saved theme before first paint so the page doesn't flash.
const THEMES = ${JSON.stringify(Object.keys(THEMES))};
try { const t = localStorage.getItem('adr-reader-theme'); if (THEMES.includes(t)) document.documentElement.dataset.theme = t; } catch {}
</script></head><body>${sidebar(adrs, current)}<main>${main}</main>
<script>
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const v = q.value.toLowerCase();
  document.querySelectorAll('aside a[data-q]').forEach((a) => a.parentElement.hidden = !a.dataset.q.includes(v));
});
addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
const theme = document.getElementById('theme');
theme.value = document.documentElement.dataset.theme;
theme.addEventListener('change', () => {
  document.documentElement.dataset.theme = theme.value;
  try { localStorage.setItem('adr-reader-theme', theme.value); } catch {}
});
new EventSource('/__reload').onmessage = () => location.reload();
</script></body></html>`;
}

const link = (a: Adr): string => `<a href="/${encodeURI(a.rel)}">${esc(a.title)}</a>`;

function relations(a: Adr): string {
  if (!a.relations.length) return '';
  return `<ul class="rel">${a.relations.map((r) => `<li><span class="label">${esc(r.label)}</span>${link(r.adr)}${badge(r.adr.status)}</li>`).join('')}</ul>`;
}

/** "by <newer ADR>" under a Superseded badge in the index. */
const supersededBy = (a: Adr): string => {
  const by = a.relations.filter((r) => r.label === 'Superseded by');
  return by.length ? `<div class="by">by ${by.map((r) => link(r.adr)).join(', ')}</div>` : '';
};

export function indexPage(ctx: RenderContext, adrs: Adr[]): string {
  const rows = adrs.map((a) => `<tr><td><a href="/${encodeURI(a.rel)}">${esc(a.title)}</a><div class="path">${esc(a.rel)}</div></td><td>${badge(a.status)}${supersededBy(a)}</td><td class="date">${a.date ? esc(fmt(a.date)) : ''}</td></tr>`).join('');
  return page(ctx, 'Architecture Decision Records', adrs, null, `<h1>Architecture Decision Records</h1><p class="path">${esc(ctx.root)}</p>
${adrs.length ? `<table><thead><tr><th>Decision</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>No Markdown files found.</p>'}`);
}

export function adrPage(ctx: RenderContext, adrs: Adr[], a: Adr): string {
  const meta = Object.entries(a.data).filter(([k]) => k !== 'title' && k !== 'status' && !isRelationKey(k))
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(fmt(v))}</dd>`).join('');
  const body = a.h1 && !a.data.title ? md(a.content) : `<h1>${esc(a.title)}</h1>${md(a.content)}`;
  const i = adrs.indexOf(a), prev = adrs[i - 1], next = adrs[i + 1];
  const nav = (x: Adr | undefined, label: string) => x ? `<a href="/${encodeURI(x.rel)}"><small>${label}</small>${esc(x.title)}</a>` : '<span></span>';
  return page(ctx, a.title, adrs, a, `<div class="meta">${badge(a.status)}<span class="path">${esc(a.rel)}</span></div>
${a.error ? `<p class="warn">Couldn't read the frontmatter: ${esc(a.error)}</p>` : ''}
${meta ? `<dl>${meta}</dl>` : ''}${relations(a)}<article>${body}</article><nav class="pn">${nav(prev, '← Previous')}${nav(next, 'Next →')}</nav>`);
}
