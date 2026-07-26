export interface SplitFrontmatter {
  /** Raw YAML text between the `---` fences, or `null` if there is none. */
  frontmatterText: string | null;
  body: string;
}

/**
 * Splits `---\n<yaml>\n---\n<body>` markdown into its YAML text and body,
 * without parsing the YAML itself — callers bring their own YAML parser so
 * this stays a plain string utility reusable by every Adapter's Read
 * direction without adding a YAML dependency to `ai-jue-core`.
 */
export function splitFrontmatter(raw: string): SplitFrontmatter {
  if (!raw.startsWith('---\n')) {
    return { frontmatterText: null, body: raw };
  }
  const closingIndex = raw.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { frontmatterText: null, body: raw };
  }
  return {
    frontmatterText: raw.slice(4, closingIndex),
    body: raw.slice(closingIndex + 5),
  };
}
