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
