# Creating a Preset

The core of `ai-jue` is its reusable preset ecosystem. A preset is an independent npm package that encapsulates a series of reusable "capability assets".

## Quick Creation

Use the `create-preset` command to quickly generate a preset template:

```bash
npx jue create-preset myteam
```

This will create a directory named `jue-preset-myteam` containing the standard preset structure.

## Directory Structure

Modern `ai-jue` presets are **Build-Free** collections of pure files. The CLI scans the file structure within the package directly.

```
jue-preset-myteam/
├── package.json
├── README.md
├── prompts/                    # Stores Prompts
│   └── code-style/             # Prompt Name (Folder Name)
│       ├── prompt.md           # Generic Content
│       ├── prompt.zh-CN.md     # Chinese Content (Optional)
│       └── META.json           # Metadata (Optional)
└── skills/                     # Stores Skills
    └── component-gen/          # Skill Name (Folder Name)
        ├── prompt.md
        └── META.json
```

### Structure Explanation

1. **Capability as Directory**
    Under `prompts` or `skills` directories, each specific capability must be an **independent directory**. The directory name is the capability ID.

2. **`META.json` (Optional)**
    You can use `META.json` in the capability directory to define metadata:

    ```json
    {
      "description": "Generates a React component",
      "parameters": [...]
    }
    ```

3. **Multi-language Content**
    Supports naming conventions like `prompt.md` (default), `prompt.zh-CN.md`, etc.

## Publishing

Once ready, publish directly to npm:

```bash
npm publish
```

No TypeScript compilation required, and no `index.ts` export file needed.
