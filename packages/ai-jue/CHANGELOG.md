## [2.1.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v2.0.0...ai-jue@v2.1.0) (2026-08-24)

### Features

- Presets support flat Markdown files and directory layouts for commands,
  rules, agents, and hooks.
- Flat-file language variants select the requested locale without creating
  suffixed Canonical Capability names.
- Flat hooks preserve YAML frontmatter as structured hook metadata.
- Duplicate flat-file and directory definitions fail explicitly.

## [2.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.5.3...ai-jue@v2.0.0) (2026-08-21)

### Breaking changes

- `ai-jue` is a CLI-only package; the non-existent root module entry is removed.
- `jue apply` resolves an explicit `project | user` scope and passes one
  `{ scope, artifactRoot, artifactKind }` context to each Adapter.
- Extension packages are loaded only through their `defineExtension()` default
  export; package-level Adapter method fallbacks are removed.

### Features

- Claude user apply writes target-native user paths while configuration remains
  in the source project.
- `--dry-run` and `--check` no longer initialize config, install Adapters,
  rewrite `ai-jue.lock`, or write Artifacts.
- Apply performs target-native confirmation after atomic execution.

# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.5.2...ai-jue@1.0.0) (2026-08-18)


### Bug Fixes

* support npm Capability Sources on Windows ([#15](https://github.com/zenHeart/ai-jue/issues/15)) ([bcebc1d](https://github.com/zenHeart/ai-jue/commit/bcebc1dafbbfacef4ba1786947498370752ae2f1)), closes [#13](https://github.com/zenHeart/ai-jue/issues/13)
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.5.1...ai-jue@1.0.0) (2026-08-10)


### Bug Fixes

* **security:** bump js-yaml to 4.3.1 (CVE-2026-59870) ([8e5b7a0](https://github.com/zenHeart/ai-jue/commit/8e5b7a06cd8f87c08c1c75b1b58a4dd0d2c6a9dd))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.5.0...ai-jue@1.0.0) (2026-08-06)


### Features

* **apply:** Artifact kind selection + OpenClaw compatible-bundle (RFC-0002) ([996fbb3](https://github.com/zenHeart/ai-jue/commit/996fbb3456c337be90d6d57e6648fc6eca0fe323))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.3.2...ai-jue@1.0.0) (2026-07-27)


### Bug Fixes

* **apply:** tighten Hermes auto-detect footprint away from config.yaml ([eac1b0e](https://github.com/zenHeart/ai-jue/commit/eac1b0ef28a672df424d5e4ba7367b07a16b70d4))
* **capability-source:** isolate the offline-mirror test path from the real cache ([d0d7d91](https://github.com/zenHeart/ai-jue/commit/d0d7d91d12a6699997aede2453d87854c7bcf53b))
* resolve project-local presets in real consumers ([aab6fc8](https://github.com/zenHeart/ai-jue/commit/aab6fc895a2cdf610d0856f12a12baad7ce761b7))


### Features

* add Capability Source (ai.capabilities) resolver and Codex adapter ([18166e2](https://github.com/zenHeart/ai-jue/commit/18166e2a784d70630223123dd17bcd045c3e3846))
* close Jue capability protocol gaps ([e188507](https://github.com/zenHeart/ai-jue/commit/e1885078b620e644968ec195cf867aead57de0af))
* **JUE-301/302/303/401:** Codex, OpenClaw, Hermes Adapters + portable Canonical fixture ([00f19f6](https://github.com/zenHeart/ai-jue/commit/00f19f611c902293a3ccf0c2a0f386d066c8848f))
* standardize Jue capabilities and launch site MVP ([9e1fd2f](https://github.com/zenHeart/ai-jue/commit/9e1fd2fd55b2ecaa4f2f4a69163a62a22361dd15))
# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.3.1...ai-jue@1.0.0) (2026-03-19)


### Bug Fixes

* fix ai-jue preset error ([3f2a464](https://github.com/zenHeart/ai-jue/commit/3f2a4642005d74d355f572abaa3f056dc1711ac1))
* 完成草 ([b683b0d](https://github.com/zenHeart/ai-jue/commit/b683b0dab47ae6c5844e473f9d631551495836e5))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.3.0...ai-jue@1.0.0) (2026-02-16)


### Bug Fixes

* 完成修改 ([959dc2f](https://github.com/zenHeart/ai-jue/commit/959dc2f5583a7016fdbe951fff04c3011cc70c8e))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.2.0...ai-jue@1.0.0) (2026-02-16)


### Bug Fixes

* fix test error ([6342266](https://github.com/zenHeart/ai-jue/commit/63422661b7366c294cc753543a53d3fd8b4b03c3))


### Features

* implement 'jue format' command and enhance Copilot adapter ([1932176](https://github.com/zenHeart/ai-jue/commit/1932176d7d306b80f595aee4641cf46f1f49e43b))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.1.1...ai-jue@1.0.0) (2026-02-15)


### Bug Fixes

* add draft ([f765a72](https://github.com/zenHeart/ai-jue/commit/f765a72225891c9fce901686918db25280d00449))
* apply adapter install and runtime lang override ([2b52aee](https://github.com/zenHeart/ai-jue/commit/2b52aeecdce8f43c1b7d6fd906347afaf19aaf97))


### Features

* **claude:** command-skill separation and lazy creation pattern ([5454f5c](https://github.com/zenHeart/ai-jue/commit/5454f5ca034b16142e4e13f34dc8909589975a5d))
* Gemini adapter TOML commands, CLI typo tolerance, skills loading fix ([2e712a5](https://github.com/zenHeart/ai-jue/commit/2e712a5f918f24b8918f2fec148995b683920912))
* **gemini:** fix skill mapping and standard-compliant skill generation ([65fdfa8](https://github.com/zenHeart/ai-jue/commit/65fdfa8af9956cecc47bb69df23582349af990dc))
* **gemini:** precision documentation and skill-creator optimization ([5f51d79](https://github.com/zenHeart/ai-jue/commit/5f51d79b8553a63aa5ae86053a70eb7a21560da1))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.1.0...ai-jue@1.0.0) (2026-02-12)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.14...ai-jue@1.0.0) (2026-02-12)


### Bug Fixes

* **commands:** remove unsupported content field in loader ([224f38a](https://github.com/zenHeart/ai-jue/commit/224f38a8b0c141884c35380c33a1b864f87b81bf))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.13...ai-jue@1.0.0) (2026-02-10)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.12...ai-jue@1.0.0) (2026-02-10)


### Bug Fixes

* 完成国际化任务 ([61bbcb6](https://github.com/zenHeart/ai-jue/commit/61bbcb6f3c69e77ff803af35938755d37b5632ff))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.11...ai-jue@1.0.0) (2026-02-10)


### Bug Fixes

* add ai jue ([b5d6f68](https://github.com/zenHeart/ai-jue/commit/b5d6f6854cc6426155a044af3873d7a075f5fa0f))
* test publish ([0e89d02](https://github.com/zenHeart/ai-jue/commit/0e89d02e56223c9eacd0ab9b7e420bda9d41ba81))



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.10...ai-jue@1.0.0) (2026-02-10)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.9...ai-jue@1.0.0) (2026-02-10)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.8...ai-jue@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.7...ai-jue@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.6...ai-jue@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.5...ai-jue@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@v1.0.4...ai-jue@1.0.0) (2026-02-09)



# [1.0.0](https://github.com/zenHeart/ai-jue/compare/ai-jue@1.0.3...ai-jue@1.0.0) (2026-02-09)



# 1.0.0 (2026-02-09)


### Bug Fixes

* fix ci ([5efb5ff](https://github.com/zenHeart/ai-jue/commit/5efb5ff89b5fcb3c7d5abd1d5f571935abd2ccad))
* fix ci bug ([df5ac79](https://github.com/zenHeart/ai-jue/commit/df5ac79ff81ed77f2e514469dc1cf1c0f92bf9d5))


### Features

* init with ai ([24aedc9](https://github.com/zenHeart/ai-jue/commit/24aedc9415ff234ff9d46a98382942c8a64e7c72))



# 1.0.0 (2026-02-09)


### Bug Fixes

* fix ci ([5efb5ff](https://github.com/zenHeart/ai-jue/commit/5efb5ff89b5fcb3c7d5abd1d5f571935abd2ccad))


### Features

* init with ai ([24aedc9](https://github.com/zenHeart/ai-jue/commit/24aedc9415ff234ff9d46a98382942c8a64e7c72))
