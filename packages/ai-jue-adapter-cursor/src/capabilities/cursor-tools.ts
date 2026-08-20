import fs from "fs";
import path from "path";
import type { ArtifactChange } from "ai-jue-core";
import { hashArtifactContent } from "ai-jue-core";
import {
  readMarketplaceIndex,
  writeMarketplaceIndex,
  type CursorMarketplaceManifest,
} from "./marketplace";

export interface CursorToolsConfig {
  ignore?: string[];
  indexingIgnore?: string[];
  marketplace?: CursorMarketplaceManifest;
  /** Control field resolved separately for Plugin output. */
  pluginManifest?: unknown;
  [key: string]: unknown;
}

function textChange(
  target: string,
  root: string,
  relativePath: string,
  content: string,
): ArtifactChange | null {
  const absolutePath = path.join(root, relativePath);
  const exists = fs.existsSync(absolutePath);
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  const existing = exists ? fs.readFileSync(absolutePath, "utf8") : undefined;
  if (existing === normalized) return null;
  return {
    target,
    kind: exists ? "update" : "create",
    ownership: "full",
    scope: "project",
    path: relativePath,
    beforeHash: exists ? hashArtifactContent(existing!) : null,
    afterHash: hashArtifactContent(normalized),
    content: normalized,
    risk: "low",
    requiresApproval: false,
    atomicState: "planned",
  };
}

/** `tools.cursor` passthrough: ignore files + `.cursor/settings.json`. */
export function writeCursorTools(
  root: string,
  target: string,
  cursorTools?: CursorToolsConfig,
): ArtifactChange[] {
  if (!cursorTools || typeof cursorTools !== "object") return [];
  const changes: ArtifactChange[] = [];
  if (cursorTools.marketplace !== undefined) {
    changes.push(...writeMarketplaceIndex(root, target, cursorTools.marketplace));
  }
  if (Array.isArray(cursorTools.ignore) && cursorTools.ignore.length > 0) {
    const change = textChange(target, root, ".cursorignore", cursorTools.ignore.join("\n"));
    if (change) changes.push(change);
  }
  if (Array.isArray(cursorTools.indexingIgnore) && cursorTools.indexingIgnore.length > 0) {
    const change = textChange(target, root, ".cursorindexingignore", cursorTools.indexingIgnore.join("\n"));
    if (change) changes.push(change);
  }
  const settings = { ...cursorTools };
  delete settings.ignore;
  delete settings.indexingIgnore;
  delete settings.marketplace;
  delete settings.pluginManifest;
  if (Object.keys(settings).length > 0) {
    const filePath = path.join(root, ".cursor", "settings.json");
    const exists = fs.existsSync(filePath);
    const existingRaw = exists ? fs.readFileSync(filePath, "utf8") : undefined;
    let existingParsed: Record<string, unknown> = {};
    if (existingRaw) {
      try {
        existingParsed = JSON.parse(existingRaw) as Record<string, unknown>;
      } catch {
        existingParsed = {};
      }
    }
    const merged = { ...existingParsed, ...settings };
    const finalRaw = `${JSON.stringify(merged, null, 2)}\n`;
    if (existingRaw?.trim() !== finalRaw.trim()) {
      changes.push({
        target,
        kind: exists ? "update" : "create",
        ownership: "merged-keys",
        scope: "project",
        path: ".cursor/settings.json",
        beforeHash: existingRaw !== undefined ? hashArtifactContent(existingRaw) : null,
        afterHash: hashArtifactContent(finalRaw),
        content: finalRaw,
        risk: "low",
        requiresApproval: false,
        atomicState: "planned",
      });
    }
  }
  return changes;
}

export function readCursorTools(root: string): CursorToolsConfig | undefined {
  const result: CursorToolsConfig = {};
  const marketplace = readMarketplaceIndex(root);
  if (marketplace) result.marketplace = marketplace;
  const ignorePath = path.join(root, ".cursorignore");
  if (fs.existsSync(ignorePath)) {
    result.ignore = fs
      .readFileSync(ignorePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const indexingIgnorePath = path.join(root, ".cursorindexingignore");
  if (fs.existsSync(indexingIgnorePath)) {
    result.indexingIgnore = fs
      .readFileSync(indexingIgnorePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const settingsPath = path.join(root, ".cursor", "settings.json");
  if (fs.existsSync(settingsPath)) {
    try {
      Object.assign(result, JSON.parse(fs.readFileSync(settingsPath, "utf8")) as Record<string, unknown>);
    } catch {
      // ignore invalid settings.json on read
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
