import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import { logger } from './logger';

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

const ConfigSchema = z
  .object({
    preset: z.string().optional(),
    presets: z.array(z.string()).optional(),
    extends: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
    language: z.string().optional(),
    mcp: z
      .object({
        servers: z.record(z.string(), McpServerSchema).optional(),
      })
      .optional(),
    context: ContextSchema.optional(),
    commands: z.record(z.string(), CommandSchema).optional(),
    prompts: z.record(z.string(), PromptLikeAssetSchema).optional(),
    rules: z.record(z.string(), RuleSchema).optional(),
    skills: z.record(z.string(), SkillSchema).optional(),
    hooks: z.record(z.string(), HookSchema).optional(),
    agents: z.record(z.string(), AgentSchema).optional(),
    tools: z.record(z.string(), z.any()).optional(),
    // Allow other properties for flexibility, but validate core ones
  })
  .passthrough()
  .superRefine((config, ctx) => {
    const allowedTopLevelKeys = new Set([
      'preset',
      'presets',
      'extends',
      'language',
      'mcp',
      'context',
      'commands',
      'prompts',
      'rules',
      'skills',
      'hooks',
      'agents',
      'tools',
    ]);

    for (const key of Object.keys(config)) {
      if (!allowedTopLevelKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Unknown top-level capability field "${key}". Move tool-specific config under tools.<tool> or a canonical capability field.`,
        });
      }
    }

    if (config.preset && Array.isArray(config.presets) && config.presets.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preset"],
        message: "Invalid combination: use either 'preset' or 'presets', not both.",
      });
    }

    if (Array.isArray(config.presets) && config.presets.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["presets"],
        message: "Invalid combination: 'presets' must not be an empty array.",
      });
    }

  });

export type MergedConfig = z.infer<typeof ConfigSchema> & { [key: string]: any };
export {
  AgentSchema,
  CommandSchema,
  ConfigSchema,
  ContextSchema,
  HookObjectSchema,
  HookSchema,
  McpServerSchema,
  PromptLikeAssetSchema,
  RuleSchema,
  SkillSchema,
  SupportFileSchema,
};

const explorer = cosmiconfig('ai', {
  searchPlaces: [
    'ai.config.js',
    'ai.config.cjs',
    'ai.config.json',
    '.airc.js',
    '.airc.cjs',
    '.airc.json',
    'jue.config.js',
    'jue.config.cjs',
    'jue.config.json',
    '.juerc.js',
    '.juerc.cjs',
    '.juerc.json',
    'package.json'
  ],
});

export async function loadConfig(): Promise<MergedConfig> {
  try {
    const result = await explorer.search();
    if (result && result.config) {
      let config = result.config;
      if (typeof result.config === 'function') {
         config = result.config();
         if (config instanceof Promise) {
           config = await config;
         }
      }
      
      // Validate schema
      try {
          const validatedConfig = ConfigSchema.parse(config);
          return validatedConfig;
      } catch (validationError: any) {
          if (validationError instanceof z.ZodError) {
              logger.error('Configuration validation failed:');
              // Ensure errors exists and is an array
              if (validationError.errors && Array.isArray(validationError.errors)) {
                  validationError.errors.forEach((err: any) => {
                      const path = err.path && err.path.length > 0 ? err.path.join('.') : 'root';
                      logger.error(`- ${path}: ${err.message}`);
                  });
              } else {
                  logger.error(String(validationError));
              }
              process.exit(1);
          }
          throw validationError;
      }
    }
    return {};
  } catch (error) {
    logger.error(`Error loading configuration: ${(error as Error).message}`);
    return {};
  }
}
