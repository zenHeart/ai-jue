## [2.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.4.2...ai-jue-core@v2.0.0) (2026-08-21)

### Breaking changes

- `ai-jue-core/testkit` receives Vitest APIs from the caller instead of loading
  Vitest through CommonJS, so the published testkit works with Vitest 4 ESM.
- Adapter `read`, `write`, and `confirm` contexts require one resolved
  `{ scope, artifactRoot, artifactKind }` target context; `projectRoot` is
  removed.
- Extension package entries expose the validated default Extension contract.

### Features

- Core validates scope equality, bounded paths, symlink containment, and
  user-scope rollback against the same authorized root.

# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.4.1...ai-jue-core@1.0.0) (2026-08-10)


### Bug Fixes

* **security:** bump js-yaml to 4.3.1 (CVE-2026-59870) ([8e5b7a0](https://github.com/zenHeart/ai-jue/commit/8e5b7a06cd8f87c08c1c75b1b58a4dd0d2c6a9dd))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.4.0...ai-jue-core@1.0.0) (2026-08-06)


### Features

* **apply:** Artifact kind selection + OpenClaw compatible-bundle (RFC-0002) ([996fbb3](https://github.com/zenHeart/ai-jue/commit/996fbb3456c337be90d6d57e6648fc6eca0fe323))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.2.1...ai-jue-core@1.0.0) (2026-07-27)


### Features

* add Capability Source (ai.capabilities) resolver and Codex adapter ([18166e2](https://github.com/zenHeart/ai-jue/commit/18166e2a784d70630223123dd17bcd045c3e3846))
* **JUE-301/302/303/401:** Codex, OpenClaw, Hermes Adapters + portable Canonical fixture ([00f19f6](https://github.com/zenHeart/ai-jue/commit/00f19f611c902293a3ccf0c2a0f386d066c8848f))
* standardize Jue capabilities and launch site MVP ([9e1fd2f](https://github.com/zenHeart/ai-jue/commit/9e1fd2fd55b2ecaa4f2f4a69163a62a22361dd15))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.2.0...ai-jue-core@1.0.0) (2026-03-19)


### Bug Fixes

* fix ai-jue preset error ([3f2a464](https://github.com/zenHeart/ai-jue/commit/3f2a4642005d74d355f572abaa3f056dc1711ac1))
* 完成修改 ([959dc2f](https://github.com/zenHeart/ai-jue/commit/959dc2f5583a7016fdbe951fff04c3011cc70c8e))
* 完成草 ([b683b0d](https://github.com/zenHeart/ai-jue/commit/b683b0dab47ae6c5844e473f9d631551495836e5))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.1.0...ai-jue-core@1.0.0) (2026-02-15)


### Bug Fixes

* apply adapter install and runtime lang override ([2b52aee](https://github.com/zenHeart/ai-jue/commit/2b52aeecdce8f43c1b7d6fd906347afaf19aaf97))
* normalize AGENTS managed block generation ([5ce16c6](https://github.com/zenHeart/ai-jue/commit/5ce16c6912feb33a020f924bbadee6d822fe7228))
* 修复错误 ([4085133](https://github.com/zenHeart/ai-jue/commit/408513359efdd2da6c8f13d2bb00446fc3cd314e))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.14...ai-jue-core@1.0.0) (2026-02-12)


### Bug Fixes

* 完成国际化任务 ([61bbcb6](https://github.com/zenHeart/ai-jue/commit/61bbcb6f3c69e77ff803af35938755d37b5632ff))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.13...ai-jue-core@1.0.0) (2026-02-10)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.12...ai-jue-core@1.0.0) (2026-02-10)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.11...ai-jue-core@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.10...ai-jue-core@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.9...ai-jue-core@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.8...ai-jue-core@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.7...ai-jue-core@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@1.0.6...ai-jue-core@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue-core@v1.0.5...ai-jue-core@1.0.0) (2026-02-09)



## [1.0.5](https://github.com/ai-jue/ai-jue/compare/ai-jue-core@v1.0.4...ai-jue-core@1.0.5) (2026-02-09)



## [1.0.4](https://github.com/ai-jue/ai-jue/compare/ai-jue-core@v1.0.3...ai-jue-core@1.0.4) (2026-02-09)



## [1.0.3](https://github.com/ai-jue/ai-jue/compare/ai-jue-core@v1.0.2...ai-jue-core@1.0.3) (2026-02-09)



## 1.0.2 (2026-02-09)


### Bug Fixes

* 修复脚本错误 ([eba7c8d](https://github.com/ai-jue/ai-jue/commit/eba7c8d5b86ce50814ed23ca5eeca1b88511cd0f))


### Features

* enhance release script with scope filtering ([1003e78](https://github.com/ai-jue/ai-jue/commit/1003e7843b1ce3ec575a43ca21005b106c8386d9))
* init with ai ([24aedc9](https://github.com/ai-jue/ai-jue/commit/24aedc9415ff234ff9d46a98382942c8a64e7c72))



## 1.0.1 (2026-02-09)


### Bug Fixes

* 修复脚本错误 ([eba7c8d](https://github.com/ai-jue/ai-jue/commit/eba7c8d5b86ce50814ed23ca5eeca1b88511cd0f))


### Features

* enhance release script with scope filtering ([1003e78](https://github.com/ai-jue/ai-jue/commit/1003e7843b1ce3ec575a43ca21005b106c8386d9))
* init with ai ([24aedc9](https://github.com/ai-jue/ai-jue/commit/24aedc9415ff234ff9d46a98382942c8a64e7c72))



## 1.0.1 (2026-02-09)


### Features

* enhance release script with scope filtering ([1003e78](https://github.com/ai-jue/ai-jue/commit/1003e7843b1ce3ec575a43ca21005b106c8386d9))
* init with ai ([24aedc9](https://github.com/ai-jue/ai-jue/commit/24aedc9415ff234ff9d46a98382942c8a64e7c72))



# Changelog

All notable changes to this project will be documented in this file.
