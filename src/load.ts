import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { dateFromBody, relationsFromBody, relationsFromData, statusFromBody, type RawRelation } from './parse.js';

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
  /** Links to other ADRs, both declared here and implied by the other side (A supersedes B → B superseded by A). */
  relations: Relation[];
}

export interface Relation {
  label: string;
  adr: Adr;
}

const INVERSE: Record<string, string> = {
  Supersedes: 'Superseded by', 'Superseded by': 'Supersedes',
  Amends: 'Amended by', 'Amended by': 'Amends',
  Clarifies: 'Clarified by', 'Clarified by': 'Clarifies',
};

/** True when `file` exists and, after resolving symlinks, lives inside `root`. */
export function inRoot(root: string, file: string): boolean {
  try { return fs.realpathSync(file).startsWith(root + path.sep); } catch { return false; }
}

// Re-read on every request so edits show up on refresh.
// ponytail: full rescan per request, add fs.watch + cache if folders get into the thousands
export function load(root: string): Adr[] {
  const pending = new Map<Adr, RawRelation[]>();
  const adrs = fs.readdirSync(root, { recursive: true, encoding: 'utf8' })
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
      const adr: Adr = { rel, data, content, h1, error, title: String(data.title || h1 || path.basename(f, '.md')), status, date, relations: [] };
      pending.set(adr, [...relationsFromData(data), ...relationsFromBody(content)]);
      return adr;
    })
    .sort((a, b) => a.rel.localeCompare(b.rel, undefined, { numeric: true }));
  link(adrs, pending);
  return adrs;
}

/** The leading number of a file name: `0003-use-mysql.md` → 3. */
const number = (rel: string): number | undefined => {
  const m = path.posix.basename(rel).match(/^\D*?(\d+)/);
  return m ? Number(m[1]) : undefined;
};

/** Finds the ADR a reference points to: a relative path, or a number such as `3` or `ADR-0003`. */
function resolve(adrs: Adr[], from: Adr, ref: string): Adr | undefined {
  if (ref.endsWith('.md')) {
    let target: string;
    try { target = decodeURI(ref); } catch { target = ref; }
    const rel = path.posix.normalize(path.posix.join(path.posix.dirname(from.rel), target));
    return adrs.find((a) => a.rel === rel) ?? adrs.find((a) => a.rel === path.posix.normalize(target));
  }
  const n = ref.match(/\d+/)?.[0];
  if (n === undefined) return undefined;
  const matches = adrs.filter((a) => a !== from && number(a.rel) === Number(n));
  // With nested folders the same number can repeat; prefer the one next to the referring ADR.
  return matches.find((a) => path.posix.dirname(a.rel) === path.posix.dirname(from.rel)) ?? matches[0];
}

function link(adrs: Adr[], pending: Map<Adr, RawRelation[]>): void {
  const add = (from: Adr, label: string, to: Adr) => {
    if (from !== to && !from.relations.some((r) => r.label === label && r.adr === to)) from.relations.push({ label, adr: to });
  };
  for (const a of adrs) {
    for (const { label, ref } of pending.get(a) ?? []) {
      const target = resolve(adrs, a, ref);
      if (!target) continue;
      add(a, label, target);
      if (INVERSE[label]) add(target, INVERSE[label], a);
    }
  }
  // A record that something else supersedes is superseded, even if it never says so.
  for (const a of adrs) if (!a.status && a.relations.some((r) => r.label === 'Superseded by')) a.status = 'Superseded';
}
