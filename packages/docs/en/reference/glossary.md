# Glossary

Jue defines exactly six stable concepts. Other nouns must remain external
platform terms, configuration fields, interface methods, or execution stages.

## Capability {#capability}

A reusable ability an Agent can use. Current types are `skills`, `agents`,
`commands`, `rules`, `hooks`, and `mcp.servers`. A Capability describes what an
Agent can do, not a target layout or install method.

## Preset {#preset}

A versioned, composable, distributable Capability collection. A Preset is
declarative data and a logical reuse unit; it does not execute code or equal an
Agent Plugin.

## Canonical DSL {#canonical-dsl}

The sole intermediate representation and semantic source of truth for both
conversion directions. Inputs are converted and merged into the Canonical DSL
before a target Adapter produces Artifacts; Agent import runs the reverse
direction.

The Canonical DSL defines both the specification and normalized data.
Relationships, origin, and ownership are DSL data.

## Extension {#extension}

Jue's unified executable extension mechanism. An Extension registers Adapters
through the stable API. It differs from an Agent Plugin and from a data-only
Preset.

## Adapter {#adapter}

The complete conversion unit for one Agent inside an Extension. It converts
between Agent-native config and the Canonical DSL, then produces, updates, and
confirms Artifacts.

## Artifact {#artifact}

Native output produced or maintained for a target Agent, such as config,
directory, Plugin, Bundle, or Archive. An Artifact is a physical delivery form;
a Preset is a logical Capability collection.

Plugin is an Agent-specific name for an Artifact form. It may carry
Capabilities, a manifest, runtime code, and install requirements.
