# Official Presets

`ai-jue` provides a series of officially maintained presets designed to offer out-of-the-box best practices for different technology stacks and development scenarios.

## jue-preset-base

**The Basic Preset**, suitable for all types of projects. It contains general software engineering best practices.

* **Contents**:
  * Code Review Guidelines
  * Git Commit Conventions
  * General Error Handling Recommendations
  * Performance Optimization Tips
  * Security Audit Basics
  * Documentation Writing Guide

**Installation**:

```bash
npm install -D jue-preset-base
```

## jue-preset-internal (Repo-only Preset)

**Repository governance preset** used to bootstrap the `ai-jue` monorepo itself. It is not intended as a general public preset.

* **Capability boundary**:
  * `base` handles reusable engineering capabilities
  * `internal` handles repo governance and release constraints

## Combination Usage

You can combine multiple presets using the `presets` array in `ai.config.js`.

\`\`\`javascript
// ai.config.js
module.exports = {
  presets: [
    'base'
  ]
}
\`\`\`

`ai-jue` loads presets in the order of the array, so later configurations will overwrite or merge with earlier ones.
