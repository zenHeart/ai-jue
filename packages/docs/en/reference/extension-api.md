# Extension API Reference

An Extension's default export returns Adapters through `defineExtension()`:

```ts
export default defineExtension({
  adapters: [openclawAdapter]
});
```

The default export is the Extension's only runtime entry. Package entries keep
one default export; `read`, `write`, `confirm`, and capability metadata are
members of the returned Adapter. `jue apply` requires an `ai-jue-adapter-*`
package to contribute exactly one Adapter.

Module import performs no file write, network access, process execution, or
global mutation. npm `peerDependencies` declares compatible Jue versions and
`exports` declares the entrypoint; Jue adds no package fields.

## `defineExtension`

```ts
interface ExtensionDefinition {
  adapters: Adapter[];
}

declare function defineExtension(
  definition: ExtensionDefinition
): ExtensionDefinition;
```

Extension name, version, and entrypoint come from npm `package.json` and are not
repeated. `adapter.id` is process-wide unique; conflicts fail.

## `Adapter`

```ts
interface Adapter {
  id: string;
  capabilities: CapabilitySupport;
  supportedScopes?: readonly ("project" | "user")[];

  read(context: ReadContext): Promise<CanonicalDocument>;
  write(
    canonical: CanonicalDocument,
    context: WriteContext
  ): Promise<ArtifactChange[]>;
  confirm(
    results: ArtifactResult[],
    context: ConfirmContext
  ): Promise<Confirmation>;
}

interface ArtifactTargetContext {
  artifactRoot: string;
  scope: "project" | "user";
  artifactKind?: string;
}

interface ReadContext extends ArtifactTargetContext {}

interface WriteContext extends ArtifactTargetContext {
  toolsConfig?: Record<string, unknown>;
  pluginManifest?: {
    name: string;
    version: string;
    description?: string;
    author?: { name: string; email?: string; url?: string };
    variables?: Record<string, unknown>;
  };
}

interface ConfirmContext extends ArtifactTargetContext {}
```

`read` converts Agent-native config to the Canonical DSL. `write` computes exact
Artifact changes without mutating state. Core validates and executes approved
changes. An Extension receives no general write, install, network, or process
callback; side-effecting Artifacts use Core-supported kinds and approval
policies. `confirm` uses the target Agent's parser, CLI, or real read path.

`ArtifactTargetContext` is the only target environment Core passes after
resolution and validation. `read`, `write`, and `confirm` receive the same
required `scope` and `artifactRoot`; an Adapter does not default scope or keep a
second root field. `toolsConfig` and `pluginManifest` remain target-private and
apply only to the current Artifact conversion.

`supportedScopes` defaults to `["project"]`; an Adapter declares it only when
it safely maps an additional apply root. Core exclusively owns scope defaulting
and authorization. A project-only Adapter omits `supportedScopes`, while its
methods still receive Core's resolved `scope: "project"`. Adding a scope changes
the Core type and validation once, then only the Adapters that support that scope.

Same-target writes preserve valid unmanaged fields. Supported semantics satisfy
`read(write(Canonical))` round trips. Target-private fields never cross Agents.

## `ArtifactChange`

```ts
interface ArtifactChange {
  target: string;
  kind: "create" | "update" | "delete";
  ownership: "full" | "managed-block" | "merged-keys";
  scope: "project" | "local" | "user";
  path: string;
  beforeHash: string | null;
  afterHash: string | null;
  content?: string | { content: string; encoding: "utf8" | "base64" };
  risk: "low" | "medium" | "high";
  requiresApproval: boolean;
  atomicState: "planned" | "applied" | "rolled-back" | "failed";
}
```

`ownership` records how much of the path an Adapter controls: `full` means Jue
owns the whole file (safe to fully overwrite); `managed-block` means Jue owns
only the content between `AI-JUE:START/END`, with the rest of the file left to
the user; `merged-keys` means Jue owns specific keys in a JSON document via
deep merge. `atomicState` tracks this change's lifecycle as Core executes it;
a batch of `ArtifactChange`s either all reach `applied` or all roll back to
`rolled-back` on any failure, never a partial write. `beforeHash` must be
`null` when `kind` is `create`; `afterHash` must be `null` when `kind` is
`delete`; both must be present when `kind` is `update`. `content` is the
actual bytes Core writes: it must be present with a hash matching `afterHash`
when `kind` is `create`/`update`, and must be omitted when `kind` is
`delete`. `path` must be safe and relative to the current `artifactRoot`.

## Results and errors

```ts
interface ArtifactResult {
  change: ArtifactChange;
  applied: boolean;
}

interface Confirmation {
  target: string;
  status: "confirmed" | "unconfirmed" | "failed";
  evidence?: string;
}
```

`Confirmation` distinguishes `confirmed`, `unconfirmed`, and `failed`; a
missing confirmation path is never `confirmed`, and a `confirmed` status must
carry redacted `evidence`.

Errors include stable `code`, stage, Adapter ID, actionable `remediation`, and
redacted details. Extensions never swallow errors or only log them.
