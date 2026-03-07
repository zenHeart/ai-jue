import { MergedConfig } from './config';

function toObject(value: any): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/**
 * Standardizes the configuration object to ensure consistent property access
 * across different adapters and commands.
 * 
 * Key transformations:
 * - Ensures all major asset categories (rules, commands, etc.) are objects.
 * - Maps 'content' field to 'prompt' for commands and agents if prompt is missing.
 * - Flattens hook objects to their script strings.
 * - Guarantees context.global is a string.
 * 
 * @param config - The raw merged configuration
 * @returns A standardized configuration object
 */
export function normalizeConfig(config: MergedConfig): MergedConfig {
  const context = toObject(config.context);
  const prompts = toObject(config.prompts);
  const rules = toObject(config.rules);
  const skills = toObject(config.skills);
  const commands = toObject(config.commands);
  const agents = toObject(config.agents);
  const hooks = toObject(config.hooks);
  const tools = toObject(config.tools);

  const normalized: MergedConfig = {
    ...config,
    context,
    prompts,
    rules,
    skills,
    commands,
    agents,
    hooks,
    tools,
  };

  if (typeof context.global !== 'string') {
    context.global = '';
  }

  for (const [name, cmd] of Object.entries(commands)) {
    const command = toObject(cmd);
    if (!command.prompt && typeof command.content === 'string') {
      command.prompt = command.content;
    }
    commands[name] = command;
  }

  for (const [name, value] of Object.entries(rules)) {
    const rule = toObject(value);
    if (!rule.content && typeof rule.prompt === 'string') {
      rule.content = rule.prompt;
    }
    rules[name] = rule;
  }

  for (const [name, value] of Object.entries(skills)) {
    const skill = toObject(value);
    if (!skill.content && typeof skill.prompt === 'string') {
      skill.content = skill.prompt;
    }
    if (!skill.prompt && typeof skill.content === 'string') {
      skill.prompt = skill.content;
    }
    skills[name] = skill;
  }

  for (const [name, value] of Object.entries(hooks)) {
    const hook = value as any;
    if (typeof hook === 'string' || Array.isArray(hook)) {
      hooks[name] = hook;
      continue;
    }

    if (typeof hook === 'object' && hook) {
      const normalizedHook = { ...hook };
      if (Array.isArray(normalizedHook.tools)) {
        normalizedHook.tools = normalizedHook.tools
          .map((tool: unknown) => String(tool).trim())
          .filter(Boolean);
      }
      hooks[name] = normalizedHook;
    }
  }

  for (const [name, rawAgent] of Object.entries(agents)) {
    const agent = toObject(rawAgent);
    if (!agent.prompt && typeof agent.content === 'string') {
      agent.prompt = agent.content;
    }
    if (!agent.content && typeof agent.prompt === 'string') {
      agent.content = agent.prompt;
    }
    agents[name] = agent;
  }

  return normalized;
}
