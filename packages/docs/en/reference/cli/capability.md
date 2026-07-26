# Capability Author Command

Use `jue inspect --capability <id>` for queries. The namespace retains only the
author operation that changes the external-reference lock:

```bash
jue capability update [<id>] [--dry-run]
```

It resolves `file:`, exact `npm:`, or pinned `github:` references and atomically
updates `ai-jue.lock`. `--dry-run` shows version, content hash, and lock diff;
`--frozen` forbids updates; `--offline` requires trusted cache. It never
implicitly runs `apply`.
