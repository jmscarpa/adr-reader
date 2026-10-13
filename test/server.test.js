import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { serve } from '../dist/server.js';
import { fixture } from './helpers.js';

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

const outside = fixture({ 'secret.png': 'secret' });
const root = fixture({
  '0001-first.md': '---\ntitle: First decision\nstatus: Accepted\ndate: 2026-01-10\ndeciders: [Ana, Bruno]\n---\nSee [next](0002-second.md).\n',
  '0002-second.md': '# Second decision\n',
  'diagram.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'notes.txt': 'not served',
});
fs.symlinkSync(path.join(outside, 'secret.png'), path.join(root, 'leak.png'));

const port = await freePort();
const server = serve({ root, port, fixedPort: true, open: false, dirArg: root, theme: 'dracula' });
await new Promise((resolve) => server.once('listening', resolve));
test.after(() => { server.closeAllConnections(); server.close(); });

const get = (p) => fetch(`http://127.0.0.1:${port}${p}`);

test('index lists every ADR with status and date', async () => {
  const res = await get('/');
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /First decision/);
  assert.match(html, /Second decision/);
  assert.match(html, /class="badge s-accepted">Accepted/);
  assert.match(html, /2026-01-10/);
});

test('ADR page shows metadata and previous/next links', async () => {
  const html = await (await get('/0001-first.md')).text();
  assert.match(html, /<dt>deciders<\/dt><dd>Ana, Bruno<\/dd>/);
  assert.match(html, /<h1>First decision<\/h1>/);
  assert.match(html, /href="\/0002-second.md"><small>Next →/);
});

test('serves images from the folder with the right type', async () => {
  const res = await get('/diagram.svg');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/svg+xml');
});

test('does not serve other file types, paths outside the folder or symlinks out of it', async () => {
  for (const p of ['/notes.txt', '/..%2f..%2fetc%2fhostname', '/leak.png', '/missing.md']) {
    assert.equal((await get(p)).status, 404, p);
  }
});

test('pages start on the configured theme and offer every theme in the picker', async () => {
  const html = await (await get('/')).text();
  assert.match(html, /<html lang="en" data-theme="dracula">/);
  const options = [...html.matchAll(/<option value="([a-z]+)">/g)].map((m) => m[1]);
  assert.deepEqual(options, ['default', 'github', 'paper', 'dracula']);
});
