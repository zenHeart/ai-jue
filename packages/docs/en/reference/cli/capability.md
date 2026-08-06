# Capability Author Command

The `jue capability` namespace retains only the author operation that changes
the external-reference lock:

```bash
jue capability update [<id>]
```

It resolves `file:`, exact `npm:`, or pinned `github:` references and atomically
updates `ai-jue.lock`. Omitting the ID updates every reference; a failed update
exits with code 1. It never implicitly runs `apply`.
