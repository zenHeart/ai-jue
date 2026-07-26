---
description: Prefer the shared capability-mapping engine over hand-rolled Adapter parse/serialize logic
globs:
  - "packages/ai-jue-adapter-*/src/**/*.ts"
alwaysApply: true
---

# Capability Mapping Over Bespoke Parsers

When implementing or reviewing an Agent Adapter's `read()`/`write()`:

1. Before writing a parser or serializer for a Canonical Capability's native
   shape, check whether it matches one of the four factories in
   `packages/ai-jue-core/src/capability-mapping.ts`:
   `flatMarkdownDirectory`, `directoryPerItem`, `managedMarkdownFile`,
   `mergedJsonFile`. Most Capabilities across most Agents fit one of these
   four shapes.
2. Declare the mapping once, in a small `capabilities/<capability>.ts` file,
   and drive both `read()` and `write()` from the same declaration via
   `readCapabilities`/`writeCapabilities`. Never hand-write a `read`
   function and a separate `write` function for the same Capability that
   are merely expected to stay inverses by convention — one caught bug
   (Claude's `context.global` round-trip silently corrupting through an
   unstripped managed-block wrapper) came from exactly that pattern.
3. Inject agent-specific shape knowledge (e.g. how an Agent represents a
   hook, or which MCP scope maps to a project-relative path) as
   `toCanonical`/`toNative` callbacks passed into `mergedJsonFile`, not by
   modifying the generic engine. The engine only knows generic file-merge
   mechanics; it must never learn a specific Agent's shape.
4. Only write a fully custom `CapabilityMapping` — or skip the engine for
   that one Capability — when the shape genuinely has no sibling among the
   other Capabilities (e.g. Claude's `@import`-resolving `context.global`).
   Forcing every shape through the abstraction for its own sake adds
   ceremony without reducing duplication.
5. Keep `read.ts`/`write.ts` as thin compositions over a `capabilities/`
   mapping table (roughly 30–50 lines each); if either grows past that, the
   growth is almost always shape-specific logic that belongs in a
   `capabilities/*.ts` file instead.
