import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import {
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
  toCanonicalDocument,
} from 'ai-jue-core';
import type { CanonicalDocument } from 'ai-jue-core';
import { logger } from './logger';

const CapabilityRefSchema = z.object({
  source: z.string().regex(/^(file|npm|github):.+/),
  type: z.enum(['rule', 'command', 'skill', 'agent', 'hook', 'mcp']),
  ref: z.string().optional(),
  path: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  integrity: z.string().optional(),
  status: z.never().optional(),
}).strict();

const ConfigSchema = z
  .object({
    preset: z.string().optional(),
    presets: z.array(z.string()).optional(),
    extends: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
    extensions: z.array(z.string()).optional(),
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
    capabilities: z.record(z.string(), CapabilityRefSchema).optional(),
    /** Per-adapter Artifact selection (RFC-0002). */
    targets: z
      .record(
        z.string(),
        z
          .object({
            enabled: z.boolean().optional(),
            artifact: z.string().optional(),
            scope: z.enum(['project', 'local', 'user']).optional(),
          })
          .strict(),
      )
      .optional(),
    // Allow other properties for flexibility, but validate core ones
  })
  .passthrough()
  .superRefine((config, ctx) => {
    const allowedTopLevelKeys = new Set([
      'preset',
      'presets',
      'extends',
      'extensions',
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
      'capabilities',
      'targets',
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

export type { CanonicalDocument };
export {
  AgentSchema,
  CanonicalDocumentSchema,
  CapabilityRefSchema,
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
  toCanonicalDocument,
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
