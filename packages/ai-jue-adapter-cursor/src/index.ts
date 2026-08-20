import { applyChangesOrThrow, defineExtension, toCanonicalDocument } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

export { read } from "./read";
export type { ReadContext } from "./read";
export { write } from "./write";
export type { WriteContext } from "./write";
export { confirm } from "./confirm";
export type { ConfirmContext } from "./confirm";
export { detectArtifactKind } from "./capabilities/layout";
export {
  readMarketplaceIndex,
  validateMarketplaceIndex,
  writeMarketplaceIndex,
} from "./capabilities/marketplace";
export type {
  CursorMarketplaceManifest,
  CursorMarketplaceMetadata,
  CursorMarketplaceOwner,
  CursorMarketplacePlugin,
} from "./capabilities/marketplace";

export async function generate(config: any, outputDir: string): Promise<void> {
  const canonical = toCanonicalDocument(config);
  const changes = await write(canonical, {
    projectRoot: outputDir,
    artifactKind: "project",
    cursorTools: config.tools?.cursor,
  });
  applyChangesOrThrow(outputDir, changes);
}

const cursorAdapter: Adapter = {
  id: "cursor",
  capabilities: {
    rules: "supported",
    commands: "supported",
    skills: "supported",
    agents: "supported",
    hooks: "supported",
    mcp: "supported",
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [cursorAdapter] });
