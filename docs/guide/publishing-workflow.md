# Release Workflow Guide

This guide describes the release process for the `ai-jue` monorepo.

## Prerequisites

- Ensure you have write access to the repository.
- Ensure your local environment is set up (`npm install`).

## Pre-Release Checklist

Before triggering a release, please ensure the following:

1.  **Git Status**: Ensure your working directory is clean.
    ```bash
    git status
    ```
2.  **Consistency Check**: Run the automated consistency check to verify package metadata.
    ```bash
    npm run check-consistency
    ```
3.  **Build & Test**: Ensure everything builds and passes tests.
    ```bash
    npm run build
    npm run test
    ```

## Release Process

We use a custom release script that wraps `semver` and `git` commands to manage versioning and tagging.

1.  **Run Release Script**:
    ```bash
    npm run release
    ```

2.  **Follow Prompts**:
    - Select the release type (patch, minor, major, etc.).
    - Confirm the version bump.

3.  **Automation**:
    - The script will automatically:
        - Bump the version in `package.json`.
        - Update `CHANGELOG.md`.
        - Create a git commit.
        - Create per-package tags (e.g., `ai-jue-core@v1.0.6`).
        - Create a batch tag (e.g., `release-batch@v20260209063350`).
        - Push the commit and all tags to GitHub.

4.  **CI/CD Trigger**:
    - Pushing the batch tag triggers the GitHub Action defined in `.github/workflows/release.yml`.
    - This workflow will build once, then publish all packages listed in `release-note.md` in a single workflow run.

## Troubleshooting

-   **Release not triggering**: Check if the batch tag was pushed (`git push origin --tags`).
-   **CI Failure**: Check the GitHub Actions logs.
-   **Metadata Errors**: Run `npm run check-consistency` and fix reported issues.
