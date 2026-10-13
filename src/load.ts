import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { dateFromBody, statusFromBody } from './parse.js';

export interface Adr {
  /** Path relative to the root, always with forward slashes. */
  rel: string;
  data: Record<string, unknown>;
  content: string;
  h1?: string;
  /** Set when the frontmatter couldn't be parsed. */
  error?: string;
  title: string;
  /** From frontmatter, else from the body (adr-tools, MADR 2). */
  status?: string;
  date?: unknown;
}

/** True when `file` exists and, after resolving symlinks, lives inside `root`. */
export function inRoot(root: string, file: string): boolean {
  try { return fs.realpathSync(file).startsWith(root + path.sep); } catch { return false; }
}

// Re-read on every request so edits show up on refresh.
// ponytail: full rescan per request, add fs.watch + cache if folders get into the thousands
export function load(root: string): Adr[] {
  return fs.readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.md') && !f.split(path.sep).some((p) => p.startsWith('.') || p === 'node_modules'))
    .filter((f) => inRoot(root, path.join(root, f)))
    .map((f): Adr => {
      const rel = f.split(path.sep).join('/');
      const raw = fs.readFileSync(path.join(root, f), 'utf8');
      // A broken frontmatter block shouldn't take the whole reader down; show the file with a warning instead.
      let data: Record<string, unknown> = {}, content = raw, error: string | undefined;
      try { ({ data, content } = matter(raw)); } catch (e) { error = (e as { reason?: string }).reason || (e as Error).message; }
      const h1 = content.match(/^#\s+(.+)$/m)?.[1];
      const status = data.status ? String(data.status) : statusFromBody(content);
      const date = data.date || dateFromBody(content);
      return { rel, data, content, h1, error, title: String(data.title || h1 || path.basename(f, '.md')), status, date };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel, undefined, { numeric: true }));
}
