import type { ExtensionDefinition } from "ai-jue-core";
import { runCoreAdapter } from "../../src/core-apply";
import type { MergedConfig } from "../../src/config";

export async function applyExtension(
  extension: ExtensionDefinition,
  config: unknown,
  outputDir: string,
): Promise<void> {
  if (extension.adapters.length !== 1) {
    throw new Error("Test apply requires exactly one Adapter");
  }
  await runCoreAdapter(
    extension.adapters[0],
    config as MergedConfig,
    outputDir,
    {},
  );
}
