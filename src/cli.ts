#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './server.js';

const USAGE = `Usage: adr-reader [directory] [--no-open]

Serve a folder of Markdown ADRs on localhost.

Options:
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
const unknown = args.filter((a) => a.startsWith('-') && a !== '--no-open');
const dirs = args.filter((a) => !a.startsWith('-'));
if (unknown.length || dirs.length > 1) {
  console.error(`${unknown.length ? `Unknown option: ${unknown[0]}` : 'Only one directory can be given'}\n\n${USAGE}`);
  process.exit(1);
}
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
});
