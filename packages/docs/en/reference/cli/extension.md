# Extension Author Command

Use `jue inspect --extension <id> --diagnostics` for queries. The author
namespace keeps only pre-publish validation:

```bash
jue extension validate <path-or-package> [--load]
```

By default it checks npm `package.json`, `exports`, and `peerDependencies`
without executing code. `--load` uses an isolated
context to validate Adapter IDs, interfaces, and import-time zero side effects.
Package managers install, upgrade, and remove Extensions.
