import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const cli = new URL('../dist/cli.js', import.meta.url).pathname;
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('--help prints usage and exits 0', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage: adr-reader/);
});

test('--version prints the package version', () => {
  const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(run('--version').stdout.trim(), version);
});

test('unknown options and missing folders fail', () => {
  assert.equal(run('--nope').status, 1);
  assert.match(run('--nope').stderr, /Unknown option: --nope/);
  assert.match(run('does/not/exist').stderr, /Not a directory/);
});
