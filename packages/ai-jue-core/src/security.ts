const CREDENTIAL_IN_URL = /:\/\/[^/@\s"]+:[^/@\s"]+@/;
const CREDENTIAL_IN_QUERY = /[?&](?:access_?token|api_?key|auth|password|secret)=/i;
// `${VAR}` is a runtime environment variable reference. `${user_config.KEY}`
// is Claude Code's Plugin userConfig injection syntax (resolved from
// declared Plugin config at load time, not a literal secret) — confirmed
// against a real fixture in JUE-106; both are legitimate non-literal
// placeholders, never a value Jue should reject as a credential.
const NON_LITERAL_PLACEHOLDER = /^\$\{(?:[A-Z_][A-Z0-9_]*|user_config\.[A-Za-z_][A-Za-z0-9_]*)\}$/;

/**
 * Rejects literal credentials in a value bound for Canonical or a lock file:
 * no credential embedded in a URL or query string, and any `env` map's
 * values must reference a runtime environment variable (`${VAR}`) or a
 * target's own templated config placeholder (e.g. Claude Code's
 * `${user_config.KEY}`) rather than carry a literal secret. Shared by
 * Capability Source resolution and every Adapter's `read()` so both paths
 * enforce the same rule instead of drifting apart.
 */
export function assertNoLiteralCredentials(value: unknown, location: string): void {
  const serialized = JSON.stringify(value);
  if (CREDENTIAL_IN_URL.test(serialized) || CREDENTIAL_IN_QUERY.test(serialized)) {
    throw new Error(`${location} contains a literal credential`);
  }
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const env =
    record.env && typeof record.env === 'object' && !Array.isArray(record.env)
      ? (record.env as Record<string, unknown>)
      : {};
  for (const [name, envValue] of Object.entries(env)) {
    if (typeof envValue !== 'string' || !NON_LITERAL_PLACEHOLDER.test(envValue)) {
      throw new Error(`${location} env ${name} must reference a runtime environment variable`);
    }
  }
}
