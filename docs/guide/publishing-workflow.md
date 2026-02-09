# Release Workflow Guide

This guide describes the release process for the `ai-jue` monorepo.

## Prerequisites

- Ensure you have write access to the repository.
- Ensure you are logged in to npm (if running manually, though CI handles actual publishing).
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
    *Optional: Use `--scope <package_name>` to release a specific package.*

2.  **Follow Prompts**:
    - Select the release type (patch, minor, major, etc.).
    - Confirm the version bump.

3.  **Automation**:
    - The script will automatically:
        - Bump the version in `package.json`.
        - Update `CHANGELOG.md`.
        - Create a git commit.
        - Create a git tag (e.g., `ai-jue-core@1.0.6`).
        - Push the commit and tag to GitHub.

4.  **CI/CD Trigger**:
    - Pushing the tag triggers the GitHub Action defined in `.github/workflows/release.yml`.
    - This workflow will:
        - Build the project.
        - Publish to npm using Provenance (if public) or standard auth (if private).
        - Create a GitHub Release.

## Troubleshooting

-   **Release not triggering**: Check if the tag was pushed (`git push --tags`).
-   **CI Failure**: Check the GitHub Actions logs.
-   **Metadata Errors**: Run `npm run check-consistency` and fix reported issues.
