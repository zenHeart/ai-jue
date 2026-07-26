---
description: Enforce a minimal concept budget and positive documentation
globs:
  - "README*.md"
  - "packages/docs/**/*.md"
  - "packages/docs/.vitepress/**/*.ts"
alwaysApply: true
---

# Documentation Concept Budget

When creating or reviewing public documentation:

1. Describe only the current model and executable user path.
2. Do not teach removed, rejected, or nonexistent concepts through negative
   wording such as “does not exist”, “no longer used”, or “not split into”.
3. Keep rejected alternatives only in the decision history of an RFC.
4. Do not link rejected alternatives from navigation, Guides, Reference, or
   runnable examples.
5. Treat every named noun as a concept-budget cost. Prefer an existing concept,
   a field, a method, or a plain behavior description.
6. Delete any sentence whose removal leaves the current configuration,
   implementation contract, and acceptance criteria complete.
7. Scan both locales for stale terms and commands before declaring the
   documentation complete.
