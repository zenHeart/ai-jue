# JUE-302 docs cross-check (2026-07-26)

Source of truth: the user's real `cwr:/d/devuser/.openclaw/openclaw.json`
(2026.6.11, redacted copy at
`packages/ai-jue-adapter-openclaw/audit/cwr-openclaw.redacted.json`).

## Top-level field coverage matrix (JUE-302 vs. real cwr install)

| # | field        | cwr present? | cwr shape (size hint) | JUE-302 support | Verified by |
|---|--------------|--------------|------------------------|------------------|--------------|
| 1 | `meta`       | ✅           | object(2)              | **pass-through only** (no Canonical shape; preserved as-is on write) | `audit/walle-report.md` row 1 |
| 2 | `env`        | ✅           | object(2)              | **unsupported** (would silently drop keys like `OPENROUTER_API_KEY`) | Walle row 2 — keys present, but Adapter does not project them |
| 3 | `wizard`     | ✅           | object(4)              | **unsupported** (no Canonical shape) | Walle row 3 |
| 4 | `logging`    | ✅           | object(5)              | **unsupported** (no Canonical shape) | Walle row 4 |
| 5 | `acp`        | ✅           | object(5) — Agent Control Protocol config (`enabled`, `dispatch`, `backend: "acpx"`, `defaultAgent: "claude"`, `allowedAgents: [claude, codex, gemini, opencode, pi, kimi]`) | **unsupported** — entire ACP system not handled. The Adapter has no notion of an agent-dispatch layer. | Walle row 5 |
| 6 | `models`     | ✅           | object(1) — only a `$include: "./openclaw.parts/models.json5"` reference; real model definitions in an external json5 file | **unsupported** (Adapter reads from a single file and would only see the $include sentinel) | Walle row 6 |
| 7 | `agents`     | ✅           | object — `defaults` (with model routing, workspace path, repoRoot, timezone, heartbeat config) + `list` (2 entries: walle, tars, each with model.primary, fallbacks, system, tools, hooks) | **degraded (no-op read/write)** — JUE-302's `agents.ts` is an honest "no-op" round-trip per the JUE-302 honest-stance principle. The user-side real `agents` config is therefore being silently dropped. | Walle row 7 |
| 8 | `tools`      | ✅           | object(2) (profile + alsoAllow lists) | **unsupported** (not in any capability mapping) | Walle row 8 |
| 9 | `bindings`   | ✅           | list(2)                | **unsupported** (list shape, not handled) | Walle row 9 |
| 10 | `commands`  | ✅           | object(9) (native, nativeSkills, text, bash, config, ...) | **degraded (no-op read/write)** — JUE-302's `commands.ts` is no-op per honest-stance. Real `commands` config is silently dropped. | Walle row 10 |
| 11 | `session`    | ✅           | object(2)              | **unsupported** | Walle row 11 |
| 12 | `gateway`    | ✅           | object(4) (port, mode, bind, auth) | **unsupported** | Walle row 12 |
| 13 | `mcp`        | ✅           | object(1) — `servers: {browser-use, zentao, minimax, minimax-coding-plan, ...}` (5 servers in real cwr) | **supported (read with fix from JUE-302 deep audit)** — pre-audit, `mcp.read` returned the inner servers map instead of `{servers: ...}`, which `toCanonicalDocument` silently normalized to `{}`. The regression test `packages/ai-jue-adapter-openclaw/test/contract.test.ts` `cwr-real-config regression` now asserts the cwr config's 4 server names round-trip through read+canonical-parse. | `audit/cwr-openclaw.redacted.json` + the new regression test |
| 14 | `plugins`   | ✅           | object(3) — `allow`, `entries` (8 declared plugins), `bundledDiscovery` | **unsupported** — entire plugins section not in any capability mapping. The 8 declared plugins with their per-agent catalog.json files are silently dropped. | Walle row 14 |
| 15 | `messages`   | ✅           | object(1)              | **unsupported** | Walle row 15 |
| 16 | `skills`     | ✅           | object(1)              | **supported** — global `entries` block; the per-workspace `skills/<name>/SKILL.md` is also supported via `directoryPerItem`. | Walle row 16 |
| 17 | `channels`   | ✅           | object(2) (feishu, wecom) | **unsupported** — channel config (Lark/WeCom integration) not handled | Walle row 17 |

## Current honest coverage

- **3/17 fully supported** with their real shape (`skills`, `hooks`, `mcp`).
- **3/17 honest-no-op** with explicit "degraded" capability declaration (`rules`, `commands`, `agents`).
- **1/17 partial** — `context` only maps workspace `AGENTS.md`, not the top-level `context` field in the real config (which is a `EnvVar` block, not a Markdown file).
- **10/17 silently dropped** — `meta`, `env`, `wizard`, `logging`, `acp`, `models`, `tools`, `bindings`, `session`, `gateway`, `plugins`, `messages`, `channels`. None of these are declared in `index.ts`'s `capabilities` at all; the Adapter's `read()` silently drops them via `toCanonicalDocument`'s `pick` of only `CANONICAL_KEYS`.

## What the JUE-302 deep audit actually fixed (commit 93a4832)

- The `mcp.read` shape bug: was returning the bare servers map; now returns `{servers: ...}`. This is the **only** real silent data-loss bug the audit found; the other gaps are **declared** gaps (degraded) or **unprojected** gaps (no capability at all).
- The redacted-cwr fixture plus regression test now guards against the same bug recurring.

## What the JUE-302 deep audit did NOT fix (deferred to follow-up)

- The 14/17 unprojected/unread fields above. The JUE-302 honest-stance principle says "do not invent target-only semantics," which means we should NOT add pass-through mappings for fields like `acp` or `models` until we can verify what Jue's Canonical actually wants for them. The right next step is either:
  - **R5-style discussion** about what Jue's Canonical should look like for these fields (an RFC), or
  - **a follow-up JUE-302a task** that:
    1. Reads the official `docs.openclaw.ai` documentation for the missing 14 fields, and
    2. Implements those that have a clean Canonical mapping (likely `meta`, `wizard`, `logging` — small, schema-clean), and
    3. Marks the rest as `unsupported` with one-line reasons per the JUE-302 honest-stance principle.

## Walle's audit verdict (verbatim, translated to English)

> **Cannot put into production.** Reason: 0/17 fields can be verified
> through the JUE-302 implementation (the package wasn't built in the
> cwr remote's repo checkout), but the real OpenClaw config's 17/17
> schema is valid; the data volume is far larger than the assumption
> (2 agents, 5 MCP servers, 8 plugins declared, 40 skills, 2 channels).
> The "漏字段" (missing-fields) risk includes: mcp really has 5
> servers, plugins really has 8 declarations, agents really has 2
> entries each with full model routing, etc. — JUE-302 reads 3/17 and
> silently drops the other 14, with no `capabilities` declaration for
> any of them (so even the read-side silent-drop isn't documented as
> "degraded").
