import { describe, expect, it } from 'vitest';
import { assertNoLiteralCredentials } from '../src/security';

describe('assertNoLiteralCredentials', () => {
  it('accepts a server with no env', () => {
    expect(() => assertNoLiteralCredentials({ command: 'node' }, 'fixture')).not.toThrow();
  });

  it('accepts an env value that references a runtime variable', () => {
    expect(() =>
      assertNoLiteralCredentials({ command: 'node', env: { TOKEN: '${API_TOKEN}' } }, 'fixture'),
    ).not.toThrow();
  });

  it("accepts Claude Code's ${user_config.KEY} Plugin injection placeholder", () => {
    expect(() =>
      assertNoLiteralCredentials(
        { command: 'node', env: { GREETING: '${user_config.GREETING}' } },
        'fixture',
      ),
    ).not.toThrow();
  });

  it('rejects a literal env value', () => {
    expect(() =>
      assertNoLiteralCredentials({ command: 'node', env: { TOKEN: 'sk-literal-value' } }, 'fixture'),
    ).toThrow('must reference a runtime environment variable');
  });

  it('rejects a credential embedded in a URL', () => {
    expect(() =>
      assertNoLiteralCredentials({ command: 'https://user:pass@example.com' }, 'fixture'),
    ).toThrow('contains a literal credential');
  });

  it('rejects a credential embedded in a query string', () => {
    expect(() =>
      assertNoLiteralCredentials({ command: 'https://example.com?api_key=abc123' }, 'fixture'),
    ).toThrow('contains a literal credential');
  });
});
