#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './server.js';
import { isTheme, THEMES, type Theme } from './style.js';

const USAGE = `Usage: adr-reader [directory] [--theme <name>] [--no-open]

Serve a folder of Markdown ADRs on localhost.

Options:
  --theme <name> Default theme: ${Object.keys(THEMES).join(', ')}
                 Readers can still switch themes in the page.
  --no-open      Don't open the browser on start
  -h, --help     Show this help
  -v, --version  Show the version

Environment:
  PORT           Port to serve on (default 4321)`;

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { console.log(USAGE); process.exit(0); }
if (args.includes('-v') || args.includes('--version')) {
  console.log(JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
  process.exit(0);
}
const fail = (msg: string): never => { console.error(`${msg}\n\n${USAGE}`); process.exit(1); };
const dirs: string[] = [];
let theme: Theme = 'default';
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--no-open') continue;
  if (a === '--theme' || a.startsWith('--theme=')) {
    const t = a === '--theme' ? args[++i] : a.slice('--theme='.length);
    if (t === undefined) fail('--theme needs a value');
    else if (!isTheme(t)) fail(`Unknown theme: ${t}`);
    else theme = t;
  } else if (a.startsWith('-')) fail(`Unknown option: ${a}`);
  else dirs.push(a);
}
if (dirs.length > 1) fail('Only one directory can be given');
const dirArg = dirs[0] || '.';

if (!fs.existsSync(dirArg) || !fs.statSync(dirArg).isDirectory()) {
  console.error(`Not a directory: ${path.resolve(dirArg)}\nUsage: npx adr-reader path/to/docs/adr`);
  process.exit(1);
}

serve({
  // Real path, so symlinks can't be used to step outside the folder.
  root: fs.realpathSync(dirArg),
  // An explicit PORT is honored exactly; the default walks up to the next free port.
  port: Number(process.env.PORT) || 4321,
  fixedPort: Boolean(process.env.PORT),
  open: !args.includes('--no-open'),
  dirArg,
  theme,
});
