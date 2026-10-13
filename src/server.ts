import fs from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { inRoot, load } from './load.js';
import { adrPage, indexPage, page } from './render.js';

export interface ServeOptions {
  root: string;
  port: number;
  /** When true, a busy port is an error instead of a cue to try the next one. */
  fixedPort: boolean;
  open: boolean;
  /** The directory as the user typed it, for error hints. */
  dirArg: string;
}

const TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf' };

function openBrowser(url: string): void {
  const [cmd, ...rest] = process.platform === 'darwin' ? ['open'] : process.platform === 'win32' ? ['cmd', '/c', 'start', '""'] : ['xdg-open'];
  spawn(cmd, [...rest, url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}

export function serve({ root, port, fixedPort, open, dirArg }: ServeOptions): http.Server {
  // Live reload: browsers hold an SSE connection; any change under root pings them.
  const clients = new Set<http.ServerResponse>();
  let timer: NodeJS.Timeout | undefined;
  fs.watch(root, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => clients.forEach((c) => c.write('data: reload\n\n')), 100);
  });

  const server = http.createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let rel: string | null;
    try { rel = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).slice(1); } catch { rel = null; }
    const adrs = load(root);
    const send = (code: number, html: string) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); };
    if (rel === '') return send(200, indexPage(root, adrs));
    const a = adrs.find((x) => x.rel === rel);
    if (a) return send(200, adrPage(adrs, a));
    // Static assets (diagrams referenced from ADRs), confined to root.
    const file = rel != null ? path.resolve(root, rel) : null;
    const type = file && TYPES[path.extname(file).toLowerCase()];
    if (file && type && inRoot(root, file)) {
      res.writeHead(200, { 'content-type': type });
      fs.createReadStream(file).pipe(res);
      return;
    }
    send(404, page('Not found', adrs, null, '<h1>Not found</h1><p><a href="/">Back to index</a></p>'));
  });

  server.on('error', (e: NodeJS.ErrnoException) => {
    if (e.code === 'EADDRINUSE' && !fixedPort && port < 4340) return void server.listen(++port, '127.0.0.1');
    console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use. Try PORT=${port + 1} npx adr-reader ${dirArg}` : e.message);
    process.exit(1);
  });
  server.on('listening', () => {
    const url = `http://localhost:${port}`;
    console.log(`ADR reader for ${root}\n→ ${url}`);
    if (open) openBrowser(url);
  });
  return server.listen(port, '127.0.0.1');
}
