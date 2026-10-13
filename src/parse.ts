// Reads status and date from the body of ADRs that don't use frontmatter, as written by
// adr-tools (`Date: …` line and a `## Status` section) and MADR 2 / log4brains (`* Status: …` bullets).

const KNOWN = /^(accepted|proposed|draft|rejected|deprecated|superseded)\b/i;

/** Markdown inline syntax down to plain text: links keep their text, emphasis and code marks go. */
const plain = (s: string): string => s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();

/**
 * `Key: value` as a plain line or a list item, e.g. `Date: 2026-01-05` or `* Status: accepted`.
 * Only looked for above the first section heading, where these tools put them.
 */
function field(content: string, key: string): string | undefined {
  const preamble = content.split(/^#{2,}\s/m)[0];
  return preamble.match(new RegExp(`^(?:[*-]\\s+)?\\**${key}\\**:\\s*(.+)$`, 'im'))?.[1].trim();
}

/** Lines of the `## Status` section, without blanks. */
export function statusSection(content: string): string[] {
  const m = content.match(/^#{2,3}\s*Status\s*$([\s\S]*?)(?=^#{1,3}\s|(?![\s\S]))/im);
  return m ? m[1].split('\n').map((l) => l.trim()).filter(Boolean) : [];
}

/** Turns a status line into a badge label: the known keyword if it leads, the line itself if short. */
function label(line: string): string | undefined {
  const text = plain(line);
  const known = text.match(KNOWN)?.[1];
  if (known) return known[0].toUpperCase() + known.slice(1).toLowerCase();
  return text && text.length <= 24 ? text : undefined;
}

export function statusFromBody(content: string): string | undefined {
  const f = field(content, 'Status');
  if (f) return label(f);
  const first = statusSection(content)[0];
  return first ? label(first) : undefined;
}

export function dateFromBody(content: string): string | undefined {
  return field(content, 'Date')?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
}

/** A link to another ADR, before it's resolved: `Superseded by` + `0003-use-mysql.md`. */
export interface RawRelation {
  label: string;
  /** A path relative to the ADR, or anything with a number in it (`3`, `ADR-0003`). */
  ref: string;
}

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1).toLowerCase();

/** Relation lines in the Status section, as adr-tools writes them: `Superseded by [3. Use MySQL](0003-use-mysql.md)`. */
export function relationsFromBody(content: string): RawRelation[] {
  return statusSection(content).flatMap((line) => {
    const m = line.match(/^[-*\s]*\**([a-z][a-z ]*?)\**:?\s+\[[^\]]*\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/i);
    return m ? [{ label: capitalize(m[1]), ref: m[2] }] : [];
  });
}

const FRONTMATTER_KEYS: Record<string, string> = {
  supersedes: 'Supersedes',
  'superseded-by': 'Superseded by',
  superseded_by: 'Superseded by',
  supersededby: 'Superseded by',
};

/** Frontmatter keys that hold relations, so they can be left out of the metadata table. */
export const isRelationKey = (key: string): boolean => Object.hasOwn(FRONTMATTER_KEYS, key.toLowerCase());

/** `supersedes: 0001-foo.md` or `superseded-by: [3, 4]` in frontmatter. */
export function relationsFromData(data: Record<string, unknown>): RawRelation[] {
  return Object.entries(data).flatMap(([k, v]) => {
    const label = FRONTMATTER_KEYS[k.toLowerCase()];
    if (!label || v == null) return [];
    return (Array.isArray(v) ? v : [v]).map((ref) => ({ label, ref: String(ref) }));
  });
}
