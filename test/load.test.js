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

test('frontmatter status and date win over the body', () => {
  const root = fixture({
    '0001.md': '---\nstatus: Rejected\n---\n# A\n\nDate: 2026-01-05\n\n## Status\n\nAccepted\n',
    '0002.md': '# B\n\nDate: 2026-01-05\n\n## Status\n\nAccepted\n',
  });
  assert.deepEqual(load(root).map((a) => [a.status, a.date]), [['Rejected', '2026-01-05'], ['Accepted', '2026-01-05']]);
});

const rels = (a) => a.relations.map((r) => `${r.label} ${r.adr.rel}`);

test('links ADRs both ways and marks the old one as superseded', () => {
  const root = fixture({
    '0001-old.md': '# 1. Old\n\n## Status\n\nAccepted\n',
    '0002-unrelated.md': '# 2. Unrelated\n',
    '0003-new.md': '# 3. New\n\n## Status\n\nAccepted\n\nSupersedes [1. Old](0001-old.md)\n',
  });
  const [old, , neu] = load(root);
  assert.deepEqual(rels(neu), ['Supersedes 0001-old.md']);
  assert.deepEqual(rels(old), ['Superseded by 0003-new.md']);
  // Status stays as written when the ADR has one; only missing statuses are filled in.
  assert.equal(old.status, 'Accepted');
});

test('fills in Superseded when the old record has no status, and resolves numbers', () => {
  const root = fixture({
    'a/0001-old.md': '# Old\n',
    'b/0001-other.md': '# Other\n',
    'a/0002-new.md': '---\nsupersedes: ADR-0001\n---\n# New\n',
  });
  const adrs = load(root);
  const old = adrs.find((a) => a.rel === 'a/0001-old.md');
  assert.equal(old.status, 'Superseded');
  assert.deepEqual(rels(old), ['Superseded by a/0002-new.md']);
  assert.deepEqual(rels(adrs.find((a) => a.rel === 'b/0001-other.md')), []);
});

test('does not duplicate a relation stated on both sides, and ignores unknown targets', () => {
  const root = fixture({
    '0001.md': '# 1\n\n## Status\n\nSuperseded by [2](0002.md)\n',
    '0002.md': '# 2\n\n## Status\n\nAccepted\n\nSupersedes [1](0001.md)\n\nSupersedes [9](0009-missing.md)\n',
  });
  const [one, two] = load(root);
  assert.deepEqual(rels(one), ['Superseded by 0002.md']);
  assert.deepEqual(rels(two), ['Supersedes 0001.md']);
});
