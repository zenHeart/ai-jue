import { deepMerge } from "ai-jue-core";
import { MergedConfig } from "./config";

function getGlobalContext(config: MergedConfig): string {
  return typeof config?.context?.global === "string"
    ? config.context.global.trim()
    : "";
}

/**
 * `AGENTS.md` is additive across layers while structured assets keep deep-merge
 * semantics. Keeping this in one place prevents resolver/preset drift.
 */
export function mergeConfigWithLayeredContext(
  base: MergedConfig,
  incoming: MergedConfig,
): MergedConfig {
  const baseContext = getGlobalContext(base);
  const incomingContext = getGlobalContext(incoming);
  const merged = deepMerge(base, incoming);
  const layeredContext = [baseContext, incomingContext]
    .filter(Boolean)
    .join("\n\n");

  if (layeredContext) {
    merged.context = merged.context || {};
    merged.context.global = layeredContext;
  }

  return merged;
}
