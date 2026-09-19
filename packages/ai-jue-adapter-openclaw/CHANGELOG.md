## [0.3.4](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.3.3...ai-jue-adapter-openclaw@v0.3.4) (2026-09-20)

### Features

- Accept explicit `tools.openclaw.bundleFormat: "cursor"` without changing `auto`.

## [0.3.3](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.3.2...ai-jue-adapter-openclaw@v0.3.3) (2026-09-20)

### Bug fixes

- Align Core, Claude, and Codex peer ranges with the current in-repo releases.

## [0.3.2](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.3.1...ai-jue-adapter-openclaw@v0.3.2) (2026-09-19)

### Bug fixes

- Preserve root-relative Skill sidecars across workspace and bundle artifacts.
- Require contained regular marker files and exact native inventory identity.
- Confirm bundle format through isolated install, list, and inspect operations.

## [0.3.1](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.3.0...ai-jue-adapter-openclaw@v0.3.1) (2026-08-24)

### Bug fixes

- Preserve portable Skill `scripts` and `assets` across OpenClaw workspace
  and compatible-bundle artifacts.
- Publish public project metadata without a placeholder contact email.

## [0.3.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.2.2...ai-jue-adapter-openclaw@v0.3.0) (2026-08-21)

### Breaking changes

- The default Extension export is the only package entry and requires the new
  Core target context plus bounded Claude/Codex peer ranges.

### Bug fixes

- Native confirmation always uses an isolated temporary home and never creates
  or removes the operator's real OpenClaw profile.

# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.2.1...ai-jue-adapter-openclaw@1.0.0) (2026-08-10)


### Bug Fixes

* **security:** bump js-yaml to 4.3.1 (CVE-2026-59870) ([8e5b7a0](https://github.com/zenHeart/ai-jue/commit/8e5b7a06cd8f87c08c1c75b1b58a4dd0d2c6a9dd))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-openclaw@v0.2.0...ai-jue-adapter-openclaw@1.0.0) (2026-08-06)


### Features

* **apply:** Artifact kind selection + OpenClaw compatible-bundle (RFC-0002) ([996fbb3](https://github.com/zenHeart/ai-jue/commit/996fbb3456c337be90d6d57e6648fc6eca0fe323))
# 1.0.0 (2026-07-27)


### Features

* **JUE-301/302/303/401:** Codex, OpenClaw, Hermes Adapters + portable Canonical fixture ([00f19f6](https://github.com/zenHeart/ai-jue/commit/00f19f611c902293a3ccf0c2a0f386d066c8848f))
