# Documentation Source-of-Truth Contract

## Priority

Accepted RFC records decisions; Architecture defines the six concepts;
Specifications define testable Canonical DSL semantics; Reference defines CLI,
configuration, npm conventions, and API; Agent profiles record evidence;
Developer docs record gaps; Guides and README teach user tasks.

Architecture, Specifications, and Reference describe the target contract. Agent
profiles and Developer docs describe current facts. Conflicts are fixed rather
than guessed around.

## Closed concept set

Public terms are exactly Capability, Preset, Canonical DSL, Extension, Adapter,
and Artifact. Aliases for normalized structures, target-private containers,
converter types, output drivers, execution plans, lifecycles, validators, and
runtime stages remain fields, methods, Artifact properties, or ordinary
behavior descriptions.

## Ecosystem reuse

- npm `package.json` is the package source of truth.
- npm `peerDependencies` is the API compatibility source of truth.
- Node.js `exports` is the Extension entrypoint source of truth.
- `defineExtension()` is the sole Adapter inventory.
- Agent-native Plugins, Bundles, configs, and discovery protocols are adapted as
  Artifacts instead of duplicated.

## Change gate

Public changes update both languages, Architecture, Reference, Agent profiles,
Developer status, and contract tests. A new concept requires an RFC proving the
six concepts cannot express it. Planned behavior uses a `> [!WARNING]` block
linked to Implementation Status; runnable examples use implemented behavior
only, and the warning is removed when implementation completes.

Stable documentation describes the current contract positively. Rejected or
removed alternatives stay in RFC decision history and do not flow back into
README, Guides, Architecture, Specifications, Reference, or Agent profiles. If
removing a sentence leaves operation, implementation, and acceptance complete,
remove it.
