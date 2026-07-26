import { z } from 'zod';

const StringListSchema = z.array(z.string());

const McpServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  disabled: z.boolean().optional(),
  autoApprove: StringListSchema.optional(),
  scope: z.enum(['local', 'project', 'user']).optional(),
}).passthrough();

const SupportFileSchema = z.union([
  z.string(),
  z.object({
    content: z.string(),
    encoding: z.enum(['utf8', 'base64']),
  }).strict(),
]);

const AssetBundleSchema = z.object({
  references: z.record(z.string(), SupportFileSchema).optional(),
  scripts: z.record(z.string(), SupportFileSchema).optional(),
  assets: z.record(z.string(), SupportFileSchema).optional(),
}).passthrough();

const PromptLikeAssetSchema = z.object({
  content: z.string().optional(),
  prompt: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

function requireCapabilityBody(
  value: { content?: string; prompt?: string },
  ctx: z.RefinementCtx,
): void {
  const body = value.prompt ?? value.content;
  if (typeof body !== 'string' || body.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['prompt'],
      message: 'Capability must define a non-empty prompt or content body.',
    });
  }
}

const RuleSchema = PromptLikeAssetSchema.extend({
  globs: z.union([z.string(), StringListSchema]).optional(),
  alwaysApply: z.boolean().optional(),
}).superRefine(requireCapabilityBody);

const SkillSchema = PromptLikeAssetSchema.extend({
  name: z.string().optional(),
  description: z.string().optional(),
  "allowed-tools": StringListSchema.optional(),
  allowedTools: StringListSchema.optional(),
  disableModelInvocation: z.boolean().optional(),
  userInvocable: z.boolean().optional(),
}).merge(AssetBundleSchema).superRefine(requireCapabilityBody);

const CommandSchema = PromptLikeAssetSchema.extend({
  triggers: z.array(z.string()).optional(),
  disableModelInvocation: z.boolean().optional(),
  userInvocable: z.boolean().optional(),
}).superRefine(requireCapabilityBody);

const HookObjectSchema = z.object({
  script: z.string(),
  matcher: z.string().optional(),
  tools: StringListSchema.optional(),
  type: z.string().optional(),
  async: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
}).passthrough();

const HookSchema = z.union([
  z.string(),
  HookObjectSchema,
  z.array(HookObjectSchema).min(1),
]);

const AgentSchema = PromptLikeAssetSchema.extend({
  name: z.string().optional(),
  description: z.string().optional(),
  skills: StringListSchema.optional(),
}).superRefine(requireCapabilityBody);

const ContextSchema = z.object({
  global: z.string().optional(),
}).passthrough();

/**
 * `CanonicalDocument` is the six atomic Capabilities plus global context —
 * nothing else. It is the only shape Adapters may consume; ProjectConfig-only
 * fields (`presets`, `capabilities` refs, `extends`, `tools`, `language`, the
 * legacy `prompts` bag) never appear on it. It lives in `ai-jue-core` (not
 * the CLI package) because Adapters depend only on `ai-jue-core`.
 */
const CanonicalDocumentSchema = z.object({
  context: ContextSchema.optional(),
  rules: z.record(z.string(), RuleSchema).optional(),
  commands: z.record(z.string(), CommandSchema).optional(),
  skills: z.record(z.string(), SkillSchema).optional(),
  agents: z.record(z.string(), AgentSchema).optional(),
  hooks: z.record(z.string(), HookSchema).optional(),
  mcp: z.object({ servers: z.record(z.string(), McpServerSchema).optional() }).optional(),
  // Hermes-only: full-file pass-through for `cron/jobs.json`. The
  // value is `record(string, JobEntry)` (one entry per job_id);
  // the schema is loose (we don't enumerate every cron-job field here,
  // since Hermes adds fields and we shouldn't constrain them).
  cron: z
    .record(
      z.string(),
      z
        .object({
          name: z.string().optional(),
          prompt: z.string().optional(),
          schedule: z.string().optional(),
          repeat: z.number().optional(),
          deliver: z.string().optional(),
          enabled: z.boolean().optional(),
        })
        .passthrough(),
    )
    .optional(),
}).strict();

export type CanonicalDocument = z.infer<typeof CanonicalDocumentSchema>;

const CANONICAL_KEYS: ReadonlyArray<keyof CanonicalDocument> = [
  'context',
  'rules',
  'commands',
  'skills',
  'agents',
  'hooks',
  'mcp',
  'cron',
];

/**
 * Projects a resolved config bag down to `CanonicalDocument`. This is the
 * single place that enforces "target-private configuration does not enter
 * Canonical": any field not in `CANONICAL_KEYS` is dropped, not merely
 * ignored by convention. Accepts any keyed record (not just `ProjectConfig`'s
 * `MergedConfig`, which is CLI-package-owned) since only the seven Canonical
 * keys are ever read from it.
 */
export function toCanonicalDocument(config: Record<string, unknown>): CanonicalDocument {
  const picked: Record<string, unknown> = {};
  for (const key of CANONICAL_KEYS) {
    if (config[key] !== undefined) {
      picked[key] = config[key];
    }
  }
  return CanonicalDocumentSchema.parse(picked);
}

export {
  AgentSchema,
  CanonicalDocumentSchema,
  CommandSchema,
  ContextSchema,
  HookObjectSchema,
  HookSchema,
  McpServerSchema,
  PromptLikeAssetSchema,
  RuleSchema,
  SkillSchema,
  SupportFileSchema,
};
