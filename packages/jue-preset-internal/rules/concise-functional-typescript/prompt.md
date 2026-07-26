---
description: Keep TypeScript implementation small, composable and dispatch-table driven
globs:
  - "packages/ai-jue*/src/**/*.ts"
alwaysApply: true
---

# Concise, Functional TypeScript

When implementing or reviewing TypeScript in this repo:

1. Replace an `if/else` or `switch` chain that dispatches on a discriminant
   value (a `type`, `kind`, or `converter` field) with a lookup table —
   `Record<Discriminant, Handler>` — so adding a case is a one-line addition,
   not a new branch.
2. Prefer small, single-purpose, named functions over inline branching logic;
   a function should do one thing that its name fully describes (Unix
   philosophy: composable pieces over monolithic control flow).
3. Split a file once it accumulates unrelated responsibilities; a module
   should have one reason to change. Do not let any single file grow into a
   catch-all for a whole subsystem.
4. Favor pure functions (same input -> same output, no hidden mutation of
   arguments or shared state) for data transforms; isolate side effects
   (filesystem, network, process spawn) behind thin, clearly named wrappers.
5. Use TypeScript's type system to make illegal states unrepresentable:
   discriminated unions and `Record<K, V>` exhaustiveness over `any`,
   optional chaining plus type guards over manual `typeof` checks scattered
   through the code.
6. Prefer composition (small functions calling small functions) over deep
   nesting; extract a named function instead of adding another indentation
   level.
