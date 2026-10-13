import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../dist/load.js';
import { fixture } from './helpers.js';

test('reads title from frontmatter, then first heading, then filename', () => {
  const root = fixture({
    '0001-a.md': '---\ntitle: From frontmatter\n---\n# Ignored\n',
    '0002-b.md': '# From heading\n',
    '0003-from-filename.md': 'no heading\n',
  });
  assert.deepEqual(load(root).map((a) => a.title), ['From frontmatter', 'From heading', '0003-from-filename']);
});

test('sorts naturally so 2 comes before 10', () => {
  const root = fixture({ 'adr-10.md': '', 'adr-2.md': '', 'adr-1.md': '' });
  assert.deepEqual(load(root).map((a) => a.rel), ['adr-1.md', 'adr-2.md', 'adr-10.md']);
});

test('includes nested folders with forward-slash paths and skips hidden ones and node_modules', () => {
  const root = fixture({
    'backend/0001.md': '',
    '.git/x.md': '',
    'node_modules/pkg/readme.md': '',
  });
  assert.deepEqual(load(root).map((a) => a.rel), ['backend/0001.md']);
});

test('keeps an ADR with broken frontmatter and reports the error', () => {
  const root = fixture({ '0001.md': '---\ntitle: [oops\n---\n# Still here\n' });
  const [adr] = load(root);
  assert.equal(adr.title, 'Still here');
  assert.ok(adr.error);
  assert.deepEqual(adr.data, {});
});

test('ignores symlinked Markdown that points outside the folder', () => {
  const outside = fixture({ 'secret.md': '# secret' });
  const root = fixture({ '0001.md': '' });
  fs.symlinkSync(path.join(outside, 'secret.md'), path.join(root, 'leak.md'));
  assert.deepEqual(load(root).map((a) => a.rel), ['0001.md']);
});
