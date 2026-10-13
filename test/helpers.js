import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Creates a temp folder from a { 'rel/path.md': 'contents' } map and returns its real path. */
export function fixture(files) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-reader-')));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}
