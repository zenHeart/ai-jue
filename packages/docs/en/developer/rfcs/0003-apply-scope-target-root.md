# RFC-0003: Apply Scope and Target Root

> Status: Implemented
> Tracking: [Issue #14](https://github.com/zenHeart/ai-jue/issues/14)
> Official sources verified 2026-08-18: Claude Code
> [Settings](https://code.claude.com/docs/en/settings),
> [Memory](https://code.claude.com/docs/en/memory),
> [Skills](https://code.claude.com/docs/en/skills), and
> [MCP](https://code.claude.com/docs/en/mcp)

## Context

`jue apply` currently uses `process.cwd()` for configuration discovery,
Adapter discovery, and the Artifact write root. A user can obtain files such as
`~/.claude` or `~/.codex` only by treating the home directory as a project.
Although the config schema accepts `targets.*.scope = "user"`, execution rejects
it before write.

Git, npm, and Claude Code separate source context from installation scope. Jue
adopts the same model: configuration remains in its real project while apply
scope explicitly selects the Artifact installation boundary.

## Goals

1. Support explicit `project` and `user` apply scopes; retain `project` as default.
2. Let Core resolve and authorize the root while Adapters emit target-native,
   root-relative paths.
3. Share one target context across dry-run, check, apply, rollback, and confirm.
4. Deliver complete Claude Code user scope first and make every other Adapter
   declare its supported scopes.
5. Keep legacy Extensions project-only unless they explicitly opt into user scope.

## Non-goals

- Local, system, enterprise, managed, or organization-wide apply scopes.
- A generic absolute output-directory option.
- Installing Plugins, Bundles, or skill-plugins into user configuration.
- Jue-defined precedence that replaces an Agent's native precedence.
- Inferring user support from similar-looking directories.

## Alternatives

### A. Keep `cd ~` as global mode

This leaves config identity, project identity, and output authority coupled and
cannot preview a user change from the actual config project.

### B. Add arbitrary `--output-dir`

This is flexible but delegates native layout and absolute-path authority to the
caller or Extension without expressing project/user intent.

### C. Explicit scope, Core-authorized root, Adapter-owned layout

CLI/config selects `project | user`; Core resolves a bounded root; the Adapter
emits native relative paths. This reuses Artifact, Adapter, and the current
executor without adding a seventh stable concept.

## Decision

Adopt option C. Apply scope is Artifact conversion and execution context, not
Canonical DSL.

### Resolution order

Each selected Adapter resolves scope independently:

1. CLI `--scope`
2. `targets.<adapter>.scope`
3. default `project`

```bash
jue apply --adapter claude --scope project
jue apply --adapter claude --scope user
jue apply --all --scope user --dry-run
```

```js
export default {
  presets: ["ai-assets"],
  targets: {
    claude: { scope: "user" },
    codex: { scope: "project" }
  }
};
```

### Roots and paths

| Value | Responsibility |
| --- | --- |
| config root | discovers project config, packages, lock, and project footprints |
| apply scope | `project` or `user` |
| Artifact root | Core-authorized project root or `os.homedir()` |
| Artifact path | Adapter-generated safe relative path under the root |

Core does not expose an arbitrary absolute target to Extensions. Tests replace
the home root through dependency injection or an isolated environment. Native
environment overrides outside home require a separate RFC.

### Extension contract

```ts
type ApplyScope = "project" | "user";

interface ArtifactTargetContext {
  scope: ApplyScope;
  artifactRoot: string;
  projectRoot: string; // compatibility window: always artifactRoot
}

interface Adapter {
  supportedScopes?: readonly ApplyScope[]; // absent means ["project"]
}
```

New code uses `artifactRoot`. During a compatibility window Core also passes
`projectRoot === artifactRoot`. An Adapter without `supportedScopes` is
project-only. Every `ArtifactChange` declares the selected scope. Core validates
scope equality, relative paths, and resolved containment before execution; it
does not silently rewrite Adapter output.

### Artifact-kind compatibility

Scope chooses the native installation boundary; Artifact kind chooses shape.
The existing `project` and `workspace` kind names remain for compatibility.

| Artifact family | project scope | user scope |
| --- | --- | --- |
| native `project` / `workspace` | supported | supported after Adapter declaration |
| Plugin / compatible-bundle / skill-plugin | current export behavior | preflight error |

Plugin installation and enablement are native lifecycle operations and are not
inferred from `scope=user`.

### Claude Code mapping

| Capability | project | user |
| --- | --- | --- |
| skills | `.claude/skills/` | `~/.claude/skills/` |
| agents | `.claude/agents/` | `~/.claude/agents/` |
| commands | `.claude/commands/` | `~/.claude/commands/` |
| rules | `.claude/rules/` | `~/.claude/rules/` |
| context | `CLAUDE.md` | `~/.claude/CLAUDE.md` |
| settings/hooks | `.claude/settings.json` | `~/.claude/settings.json` |
| MCP | `.mcp.json` | `~/.claude.json` |

These paths come from Claude Code's official documentation verified on
2026-08-18. On Windows, `~` resolves to `%USERPROFILE%`. Claude Code's native
precedence remains authoritative.

### Nested MCP scope

One Adapter apply has one Artifact root:

- an omitted `mcp.servers.<name>.scope` inherits the apply scope;
- explicit `project` or `user` must match the apply scope;
- a mismatch or `local` fails preflight with the server name and both scopes;
- an Adapter must not silently skip a mismatched server.

### Adapter selection and batches

Explicit `--adapter` and `--all` retain their meaning. Configured targets can be
an explicit selection. Project mode may continue project-footprint detection.
User mode without an unambiguous target prompts interactively and fails with
guidance in non-interactive execution.

`--all` is atomic per Adapter, not transactionally atomic across Adapters. A
failure does not skip later Adapters, and the aggregate result is non-zero.

## Security

1. Core resolves scope and Artifact root before Adapter execution.
2. Every change receives structural and scope validation before plan/check/apply.
3. Absolute paths, traversal, symlink escapes, and resolved paths outside root fail.
4. Managed-block and merged-key ownership remain intact in user files.
5. Planning and execution use the same root; partial batches roll back.
6. Dry-run and check write no target files.
7. User scope authorizes the root; existing per-change high-risk gates still apply.

## Compatibility and migration

- Existing commands without scope retain project behavior.
- Public target scope becomes `project | user`; MCP's native `local` value remains.
- Legacy Adapters without `supportedScopes` stay project-only.
- `projectRoot` remains for one compatibility window while built-ins move to
  `artifactRoot`.
- Running from home without scope remains project mode whose root happens to be
  home; the recommended workflow is `--scope user` from the config project.

## Acceptance

1. CLI, target config, and default resolve in the frozen order.
2. Project output remains path- and byte-compatible.
3. Claude user dry-run previews home paths from project config, and real apply is
   discoverable from an unrelated project.
4. User context, settings/hooks, and MCP use official paths rather than cwd tricks.
5. Scope mismatch, absolute path, traversal, and symlink escape have failure tests.
6. Every built-in Adapter declares project-only or project+user; `--all` continues
   after failures and returns an aggregate non-zero status.
7. Isolated macOS/Linux homes and an authorized Windows `%USERPROFILE%` path pass.
8. Chinese/English Reference, Guide, Agent profile, and implementation status agree.

## Open questions

- Codex, Cursor, OpenClaw, and Hermes need their own official evidence and native
  acceptance before enabling user scope; they remain project-only meanwhile.
- Native roots outside home require a separately approved authorization model.
