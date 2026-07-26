# JUE-303 Phase-1 notes (incomplete, 2026-07-26)

Real Hermes install on cwr: `D:\devuser\.hermes\` (v0.18.0 per the prior
worker report; real config at `D:\devuser\.hermes\config.yaml`).

## Top-level fields in the REAL config.yaml (verified by direct read)

I read the first ~200 lines of `config.yaml`. Fields seen so far:

- `model` (object — primary provider + default model + base_url + api_mode + context_length)
- `providers` (object — multiple provider configs with `key_env` references)
- `fallback_providers` (array — ordered fallback list)
- `toolsets` (array)
- `agent` (object — `max_turns`, `gateway_timeout`, `restart_drain_timeout`, `api_max_retries`,
  `service_tier`, `tool_use_enforcement`, `task_completion_guidance`, `environment_probe`,
  `environment_hint`, `gateway_timeout_warning`, `clarify_timeout`, `gateway_notify_interval`,
  `gateway_auto_continue_freshness`, `image_input_mode`, `disabled_toolsets`, `verbose`,
  `reasoning_effort`)
- `terminal` (object — `backend`, `modal_mode`, `cwd`, `timeout`, `env_passthrough`,
  `shell_init_files`, `auto_source_bashrc`, multiple `docker_image`/`singularity_image`/
  `modal_image`/`daytona_image` keys, `container_cpu`, `container_memory`, `container_disk`,
  `container_persistent`, `docker_volumes`, `docker_mount_cwd_to_workspace`, `docker_extra_args`,
  `docker_run_as_host_user`, `persistent_shell`)
- `web` (object)
- `browser` (object — `inactivity_timeout`, `command_timeout`, `record_sessions`,
  `allow_private_urls`, `engine`, `auto_local_for_private_urls`, `cdp_url`, `dialog_policy`,
  `dialog_timeout_s`, `camofox` subobject)
- `checkpoints` (object — `enabled`, `max_snapshots`, `max_total_size_mb`, `max_file_size_mb`,
  `auto_prune`, `retention_days`, `delete_orphans`, `min_interval_hours`)
- `file_read_max_chars` (integer)
- `tool_output` (object — `max_bytes`, `max_lines`, `max_line_length`)
- `tool_loop_guardrails` (object — `warnings_enabled`, `hard_stop_enabled`, `warn_after` subobject,
  `hard_stop_after` subobject)
- `compression` (object — `enabled`, `threshold`, `target_ratio`, `protect_last_n`,
  `hygiene_hard_message_limit`, `protect_first_n`, `abort_on_summary_failure`)
- `kanban` (object — `dispatch_in_gateway`, `dispatch_interval_seconds`, `failure_limit`,
  `worker_log_rotate_bytes`, `worker_log_backup_count`, `orchestrator_profile`,
  `default_assignee`, `auto_decompose`, `auto_decompose_per_tick`,
  `dispatch_stale_timeout_seconds`)
- `prompt_caching` (object)
- `openrouter` (object)
- `bedrock` (object — region, discovery subobject, guardrail subobject)
- `auxiliary` (object — vision/web_extract/compression/skills_hub/approval/mcp subobjects,
  each with provider/model/base_url/api_key/timeout)

This is the first ~200 lines. The file is much longer; a JUE-303 build
needs a complete field-by-field read before mapping to Canonical.

## Skills tree at D:\devuser\.hermes\skills\

The skills/ directory contains ~30 top-level category directories:
`.archive`, `.bundled_manifest`, `.curator_backups`, `.curator_state`,
`.hub`, `.usage.json`, `.usage.json.lock`, `apple`, `autonomous-ai-agents`,
`computer-use`, `creative`, `data-science`, `devops`, `diagramming`,
`dogfood`, `domain`, `email`, `feeds`, `gaming`, `gifs`, `github`,
`hermes`, `inference-sh`, `leisure`, `mcp`, `media`, `mlops`, `note-taking`,
`productivity`, `red-teaming`, and more. That's a different shape
than OpenClaw's flat `skills/<name>/SKILL.md`: Hermes is
**two-deep** (`skills/<category>/<name>/SKILL.md`).

The `.bundled_manifest` file (78 lines) lists the real bundled skill IDs
(airtable, apple-notes, claude-code, codex, computer-use, dogfood,
github-auth, hermes-agent, hermes-agent-skill-authoring, himalaya,
huggingface-hub, etc.) — each with an MD5 hash suffix. This is a
**real ground truth** for what skills are bundled in this Hermes install.

## Real SKILL.md format

`D:\devuser\.hermes\skills\hermes\self-manage\SKILL.md` (likely path
after the `\skills\<category>\<name>\SKILL.md` pattern). Will need
direct read to confirm frontmatter shape.

## Hooks dir

`D:\devuser\.hermes\hooks` is empty in the SSH listing (compare to
OpenClaw's `~/.openclaw/hooks/`). Either Hermes doesn't have a
per-workspace hooks dir, or hooks live elsewhere (e.g. global
`hooks.d/` or a config key in `config.yaml`).

## Plugins

`D:\devuser\.hermes\plugins` — need to look inside.

## What the existing JUE-303 prior worker reported

A background worker earlier in the session did Phase-1 discovery and
reported: Hermes v0.18.0, real `config.yaml` with `mcp.servers`,
`plugins.enabled`, `skills.external_dirs`, `cron.jobs` (real
`hermes-branch-sync` job at `0 23 * * *`), empty `plugins/`/`hooks/`
dirs, `~/.hermes/skills/<category>/<name>/SKILL.md` convention.

The current session's direct SSH observations **partially contradict** the
prior report: the skills dir is two-deep (`<category>/<name>/SKILL.md`),
not one-deep, and `hooks` appears empty (consistent with the prior
report's "empty `hooks/`" claim but a different shape than I expected
for "OpenClaw-like hook" round-tripping).

## Recommended path forward for JUE-303 (in next session)

1. Read the rest of `config.yaml` (likely 500+ lines based on the
   field count seen) to get a complete top-level field list.
2. Read a real `SKILL.md` to get frontmatter shape.
3. Read `~/.hermes/plugins/` and `~/.hermes/cron/` to understand plugin
   + cron shapes.
4. Build the JUE-303 Adapter (sibling to JUE-301/302): capabilities/
   read.ts/write.ts/confirm.ts/index.ts + fixtures/ + test/contract.test.ts
   + scripts/verify-hermes-native.js.
5. Walle ↔ Hermes can be the native confirmation bridge, but Walle's
   responsiveness has been slow in this session; consider falling back to
   running `tirith` (the real Hermes binary at `D:\devuser\.hermes\bin\tirith`,
   ~9.8MB) directly via SSH for native confirmation.
