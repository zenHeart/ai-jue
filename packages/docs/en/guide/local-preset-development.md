# Developing a Preset Locally

A Preset is a plain npm package (see [Preset npm Package Convention](../reference/preset-manifest.md)).
For local development, point at the source directory directly — no publish
step required.

## 1. Use a local path dependency instead of publishing

Install the local directory straight into the consuming project:

```bash
npm install --save-dev /path/to/jue-preset-team
```

npm records it as a `file:` dependency in `package.json`:

```json
{
  "devDependencies": {
    "jue-preset-team": "file:../jue-preset-team"
  }
}
```

`node_modules/jue-preset-team` is a symlink to the source directory, not a
copy — edits to the Preset's source take effect immediately; re-run
`jue apply` to see the latest content without re-running `npm install`.

Install, upgrade, version comparison, publish, and removal are npm/pnpm/yarn's
job; Jue does not duplicate that layer. Whichever source a `presets` entry
resolves to is entirely determined by the dependency specifier declared in
the consuming project's `package.json`.

## 2. Verify

`ai.config.js`:

```js
export default {
  presets: ["team"]
};
```

```bash
npx jue validate
npx jue apply --adapter claude --dry-run
```

`validate` confirms the Preset resolves; `apply --dry-run` shows the Artifact
diff that would be written, without writing it. Drop `--dry-run` once you
confirm the result.

## 3. Multiple local Presets in a monorepo

If the consuming project and multiple Presets live in the same npm
workspaces monorepo (`package.json` declares `"workspaces": ["presets/*"]`),
a single `npm install` symlinks every workspace Preset into `node_modules`
automatically — no per-package `npm install --save-dev` needed.

## 4. Local overrides remote

Which source a given Preset name resolves to is decided entirely by the
specifier declared for it in `package.json`:

```json
{
  "devDependencies": {
    "jue-preset-team": "file:../jue-preset-team"
  }
}
```

Swap the specifier for a published version (e.g. `"^2.1.0"`) or a Git
reference to switch to a remote source. This is npm's own dependency
resolution — a single source of truth. Jue performs no secondary merge
between a local and a remote source for the same Preset name.

## 5. Current limitation

There is no way to self-check a Preset from inside its own directory yet,
without a consuming project that references it. Today's `jue validate`
checks the consuming project's `ai.config.js`, not the Preset itself;
setting up the minimal consumer above is the only path today. A
`jue preset validate <path-or-package>` command that skips this step is
listed as a planned, not-yet-implemented target shape in
[Preset Author Commands](../reference/cli/preset.md).
