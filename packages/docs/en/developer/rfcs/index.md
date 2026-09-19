# RFCs

RFCs record proposals that change public contracts, Canonical, Adapter, or
Extension mechanisms. Local implementation detail and ordinary tasks do not
require an RFC.

## Status

| Status | Meaning |
| --- | --- |
| `Proposed` | Open for discussion; not an accepted implementation contract |
| `Accepted` | Architecture decision accepted and eligible for Roadmap |
| `Implementing` | In progress with linked status and tests |
| `Implemented` | Implementation, verification, and docs complete |
| `Rejected` | Not adopted; rationale retained |
| `Superseded` | Replaced by a newer RFC |

## Index

| RFC | Status | Decision |
| --- | --- | --- |
| [RFC-0001: Minimal conversion model](0001-minimal-conversion-model.md) | Accepted | One pipeline, two adaptation responsibilities, Extensions register Adapters |
| [RFC-0002: Plugin / Bundle Artifact apply contract](0002-plugin-artifact-apply.md) | Implemented | CLI/`targets` and four-agent plugin paths wired; OpenClaw `compatible-bundle` delegates to Claude/Codex; Hermes thin `skill-plugin` landed |
| [RFC-0003: Apply scope and target root](0003-apply-scope-target-root.md) | Implemented | Explicit project/user scope; Core authorizes roots and Adapters emit native relative paths |
| [RFC-0004: Inspect contract for project-layer cross-tool links](0004-inspect-link-pattern.md) | Implemented | `jue inspect --diagnostics` reports broken, degraded, in-repo, and out-of-repo Skill links |
| [RFC-0005: directoryPerItem orphan removal](0005-directory-per-item-prune.md) | Implemented | Emit `delete` for item directories `read()` still recognizes after Canonical dropped them |
| [RFC-0006: Same-runtime Skill collision planning](0006-skill-same-runtime-collision.md) | Proposed | Adapters supply discovery-root evidence; Core plans same-name collisions before write |

New RFCs include context, goals/non-goals, alternatives, decision, contract,
security, compatibility/migration, acceptance, and open questions. Accepted
RFCs enter the Roadmap; Implemented requires reproducible evidence.
