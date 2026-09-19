# Cursor failure fixtures

Neutral samples for contract rejection and honest degrade. None of these
values are real credentials. Native Cursor CLI confirmation is not required.

| Sample | Expected behavior | Native check |
| --- | --- | --- |
| `sensitive-reference/` | `read()` / `write()` reject a literal MCP env value | not needed |
| `path-escape-hook/` | `read()` / `write()` reject a hook command that leaves the Artifact root | not needed |
| `invalid-hook-event/` | unknown hook event names pass through unchanged (honest degrade) | not needed |
