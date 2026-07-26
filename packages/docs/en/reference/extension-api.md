# Extension API Reference

An Extension's default export returns Adapters through `defineExtension()`:

```ts
export default defineExtension({
  adapters: [openclawAdapter]
});
```

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
```

`read` converts Agent-native config to the Canonical DSL. `write` computes exact
Artifact changes without mutating state. Core validates and executes approved
changes. An Extension receives no general write, install, network, or process
callback; side-effecting Artifacts use Core-supported kinds and approval
policies. `confirm` uses the target Agent's parser, CLI, or real read path.

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
`delete`. `path` must be a safe project-relative path.

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
