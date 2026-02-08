import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import pc from 'picocolors';
import { logger } from './logger';

const McpServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

const CommandSchema = z.object({
  description: z.string().optional(),
  prompt: z.string(),
  triggers: z.array(z.string()).optional(),
});

const HookSchema = z.union([
    z.string(),
    z.object({
        script: z.string(),
        tools: z.array(z.string()).optional()
    })
]);

const SubAgentSchema = z.object({
  description: z.string().optional(),
  prompt: z.string(),
  tools: z.array(z.string()).optional(),
});

const ConfigSchema = z.object({
  preset: z.string().optional(),
  presets: z.array(z.string()).optional(),
  extends: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  language: z.string().optional(),
  mcp: z.object({
      servers: z.record(z.string(), McpServerSchema).optional()
  }).optional(),
  commands: z.record(z.string(), CommandSchema).optional(),
  hooks: z.record(z.string(), HookSchema).optional(),
  subAgents: z.record(z.string(), SubAgentSchema).optional(),
  tools: z.record(z.string(), z.any()).optional(),
  // Allow other properties for flexibility, but validate core ones
}).passthrough();

export type MergedConfig = z.infer<typeof ConfigSchema> & { [key: string]: any };

const explorer = cosmiconfig('ai', {
  searchPlaces: [
    'ai.config.js',
    'ai.config.json',
    '.airc.js',
    '.airc.json',
    'jue.config.js',
    'jue.config.json',
    '.juerc.js',
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
