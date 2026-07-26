Neutral fixture workspace AGENTS.md for the OpenClaw Adapter (JUE-302).

This file exists to prove that the JUE-302 Adapter round-trips an
`AGENTS.md` global-context value through the workspace's managed-block
section, the same way the Claude Adapter's `capabilities/context.ts`
handles CLAUDE.md and the Codex Adapter's `capabilities/context.ts`
handles AGENTS.md.

The body inside the OpenClaw-managed block (delimited below) becomes
`context.global` in the Canonical document; everything outside the
block is preserved verbatim on the next write.
