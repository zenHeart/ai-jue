import { MergedConfig } from './config';
import { logger } from './logger';

function toObject(value: any): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function normalizeConfig(config: MergedConfig): MergedConfig {
  const conflictPolicy = config.conflictPolicy === 'warn' ? 'warn' : 'error';
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

  for (const [name, value] of Object.entries(hooks)) {
    const hook = value as any;
    if (typeof hook === 'object' && hook && typeof hook.script === 'string') {
      hooks[name] = hook.script;
    }
  }

  for (const [name, rawAgent] of Object.entries(agents)) {
    const agent = toObject(rawAgent);
    if (!agent.prompt && typeof agent.content === 'string') {
      agent.prompt = agent.content;
    }
    if (!agent.skills && Array.isArray(agent.tools)) {
      agent.skills = [...agent.tools];
    }
    if (!agent.tools && Array.isArray(agent.skills)) {
      agent.tools = [...agent.skills];
    }
    if (Array.isArray(agent.skills) && Array.isArray(agent.tools)) {
      const skillsSet = new Set(agent.skills);
      const toolsSet = new Set(agent.tools);
      const same =
        skillsSet.size === toolsSet.size &&
        [...skillsSet].every((item) => toolsSet.has(item));
      if (!same) {
        const message = `Agent "${name}" has conflicting skills/tools lists.`;
        if (conflictPolicy === 'warn') {
          logger.warn(message);
        } else {
          throw new Error(message);
        }
      }
    }
    agents[name] = agent;
  }

  return normalized;
}
