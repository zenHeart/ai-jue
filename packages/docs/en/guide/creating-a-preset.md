# Creating a Preset

The core of `ai-jue` is a reusable preset ecosystem. A preset is an independent npm package that encapsulates reusable AI collaboration assets.

## Quick Creation

```bash
npx jue create-preset myteam
```

This generates `jue-preset-myteam`.

## Recommended Directory Protocol

Follow the Minimal Knowledge Principle and align with mainstream tool conventions:

```text
jue-preset-myteam/
├── package.json
├── README.md
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
└── tools/
    ├── gemini/
    └── cursor/
```

Notes:

- `AGENTS.md`: global system context and hard constraints
- `skills/`: skill assets
- `commands/`: custom commands
- `rules/`: project rules
- `agents/`: custom agents
- `hooks/`: lifecycle hooks
- `tools/<tool>/`: tool-specific configuration

## Relation to `.ai`

Preset structure is isomorphic to local `.ai/`, so teams can first accumulate assets in a project and then package them with minimal reshaping.

## Publish

```bash
npm publish
```

Most presets are consumed directly as file assets without a build step.
