## [0.3.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-codex@v0.2.1...ai-jue-adapter-codex@v0.3.0) (2026-08-21)

### Breaking changes

- The default Extension export is the only package entry and requires
  `ai-jue-core@^2.0.0` with an explicit project target context.

### Bug fixes

- Ships `@iarna/toml` as a runtime dependency so isolated consumers can load
  the packed Adapter.

# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-adapter-codex@v0.2.0...ai-jue-adapter-codex@1.0.0) (2026-08-06)


### Features

* **apply:** Artifact kind selection + OpenClaw compatible-bundle (RFC-0002) ([996fbb3](https://github.com/zenHeart/ai-jue/commit/996fbb3456c337be90d6d57e6648fc6eca0fe323))
# 1.0.0 (2026-07-27)


### Features

* add Capability Source (ai.capabilities) resolver and Codex adapter ([18166e2](https://github.com/zenHeart/ai-jue/commit/18166e2a784d70630223123dd17bcd045c3e3846))
* **JUE-301/302/303/401:** Codex, OpenClaw, Hermes Adapters + portable Canonical fixture ([00f19f6](https://github.com/zenHeart/ai-jue/commit/00f19f611c902293a3ccf0c2a0f386d066c8848f))
