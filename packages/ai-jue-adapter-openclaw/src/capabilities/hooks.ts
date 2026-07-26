import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import * as yaml from "js-yaml";
import type { ArtifactChange, CapabilityMapping } from "ai-jue-core";

const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function assertSafeName(name: string): void {
  if (!SAFE_NAME.test(name)) {
    throw new Error(`OpenClaw hook name must be a safe single path segment: ${name}`);
  }
}

function sha256(s: string | Buffer): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * OpenClaw hooks live at `<workspace>/hooks/<name>/HOOK.md` + `handler.js`
 * (verified by reading `~/.openclaw/workspace-jue-probe/hooks/jue-probe-hook/HOOK.md`
 * and `handler.js`). The shared `directoryPerItem` factory assumes a main
 * file plus a `files/` or `references/` bundle directory; OpenClaw keeps
 * `handler.js` as a SIBLING of `HOOK.md` in the same directory, not under
 * `files/`. Writing back to `files/handler.js` would change the runtime
 * layout (the JUE-302 honest-preservation principle forbids silently
 * reshaping the target), so hand-write the mapping.
 *
 * Canonical shape: each hook entry has a Canonical `script` field
 * (OpenClaw's `metadata.openclaw.events` flattened as the record key, and
 * the union of all events' `script` values as the script). The
 * OpenClaw-specific `metadata` block is preserved as a passthrough
 * field (Claude's `mergeStrategy` / Codex's `appMetadata` follow the
 * same pattern).
 */
function parseFrontmatter(text: string): { body: string; data: Record<string, unknown> } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { body: text, data: {} };
  // Use the real YAML parser (js-yaml is already an ai-jue-core
  // dependency) so nested structures like `metadata.openclaw.events`
  // round-trip correctly. A hand-rolled top-level-only parser would lose
  // them. Strip the leading whitespace that the regex captures from
  // after the closing `---` so the body round-trips symmetrically
  // with how the write side renders it (no leading newline).
  const parsed = yaml.load(match[1]) as Record<string, unknown> | null | undefined;
  return {
    body: match[2].replace(/^\r?\n/, ""),
    data: parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {},
  };
}

function renderFrontmatter(data: Record<string, unknown>): string {
  // Use the real YAML serializer to round-trip nested structures
  // (metadata.openclaw.events) verbatim. yaml.dump with noRefs gives us
  // plain block-style output, which is what OpenClaw's HOOK.md convention
  // uses.
  return `---\n${yaml.dump(data, { lineWidth: -1, noRefs: true }).trimEnd()}\n---\n`;
}

export function hooks(): CapabilityMapping<Record<string, unknown>> {
  return {
    read(root) {
      const dir = path.join(root, "hooks");
      if (!fs.existsSync(dir)) return undefined;
      const result: Record<string, unknown> = {};
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const name = entry.name;
        assertSafeName(name);
        const hookDir = path.join(dir, name);
        const mdPath = path.join(hookDir, "HOOK.md");
        if (!fs.existsSync(mdPath)) continue;
        const { body, data } = parseFrontmatter(fs.readFileSync(mdPath, "utf8"));
        const meta = (data.metadata as Record<string, unknown> | undefined) ?? {};
        const openclawMeta = (meta.openclaw as Record<string, unknown> | undefined) ?? {};
        const events = Array.isArray(openclawMeta.events)
          ? (openclawMeta.events as unknown[]).map(String)
          : [];
        const handlerPath = path.join(hookDir, "handler.js");
        const handlerSource = fs.existsSync(handlerPath)
          ? fs.readFileSync(handlerPath, "utf8")
          : "";
        for (const event of events) {
          result[event] = {
            matcher: "*",
            type: "command",
            script: handlerSource,
            // OpenClaw-specific passthrough: name, description, emoji,
            // hookKey — Jue does not own these, so keep them on the
            // Canonical entry as opaque passthrough (an Adapter must
            // never invent target-only semantics).
            name,
            description: typeof data.description === "string" ? data.description : undefined,
            openclaw: openclawMeta,
            // Body of HOOK.md is preserved verbatim (per unmanaged-content
            // preservation principle; the Jue Adapter never modifies
            // target-private prose).
            body,
          };
        }
        // No `events` declared in HOOK.md — the hook is not invocable
        // from a Canonical standpoint. Surface it under a synthetic
        // event key so the entry still survives a round-trip (otherwise
        // we'd silently lose hooks without `metadata.openclaw.events`,
        // which would be a real data loss).
        if (events.length === 0) {
          result[`${name}::__no-events`] = {
            matcher: "*",
            type: "command",
            script: handlerSource,
            name,
            description: typeof data.description === "string" ? data.description : undefined,
            openclaw: openclawMeta,
            body,
          };
        }
      }
      return Object.keys(result).length > 0 ? result : undefined;
    },
    write(root, value, target): ArtifactChange[] {
      const hooks = (value ?? {}) as Record<string, unknown>;
      const dir = path.join(root, "hooks");
      const changes: ArtifactChange[] = [];
      // Group Canonical entries by hook name (so all events of one hook
      // become one directory with one HOOK.md + one handler.js).
      const byHook = new Map<string, Array<{ event: string; entry: Record<string, unknown> }>>();
      for (const [event, rawEntry] of Object.entries(hooks)) {
        const entry = (rawEntry ?? {}) as Record<string, unknown>;
        const name = (typeof entry.name === "string" && entry.name) || `${event.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        if (!byHook.has(name)) byHook.set(name, []);
        byHook.get(name)!.push({ event, entry });
      }
      for (const [name, group] of byHook) {
        assertSafeName(name);
        const hookDir = path.join(dir, name);
        const first = group[0].entry;
        const body = typeof first.body === "string" ? first.body : "";
        const openclawMeta =
          (first.openclaw as Record<string, unknown> | undefined) ?? {};
        const events = group.map((g) => g.event);
        const data: Record<string, unknown> = {
          name,
          description: typeof first.description === "string" ? first.description : `Hook: ${name}`,
          metadata: { openclaw: { ...openclawMeta, events } },
        };
        // The HOOK.md file's body (Markdown after the closing `---`)
        // MUST be preserved verbatim on round-trip. Normalize trailing
        // whitespace (strip a single trailing newline if present, since
        // the renderFrontmatter output already ends with one) so the
        // round-trip is idempotent — reading back produces the same
        // body the writer started with, not "one extra newline".
        const normalizedBody = body.replace(/\r?\n$/, "");
        const mdRaw = normalizedBody
          ? `${renderFrontmatter(data)}${normalizedBody}\n`
          : renderFrontmatter(data);
        const mdPath = path.join(hookDir, "HOOK.md");
        const handlerPath = path.join(hookDir, "handler.js");
        const handlerRaw = typeof first.script === "string" ? first.script : "";

        // Emit HOOK.md change.
        const mdExisting = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : undefined;
        if (mdExisting !== mdRaw) {
          changes.push({
            target,
            kind: mdExisting === undefined ? "create" : "update",
            ownership: "full",
            scope: "project",
            path: path.relative(root, mdPath).split(path.sep).join("/"),
            beforeHash: mdExisting === undefined ? null : sha256(mdExisting),
            afterHash: sha256(mdRaw),
            content: mdRaw,
            risk: "low",
            requiresApproval: false,
            atomicState: "planned",
          });
        }
        // Emit handler.js change.
        const handlerExisting = fs.existsSync(handlerPath)
          ? fs.readFileSync(handlerPath, "utf8")
          : undefined;
        if (handlerExisting !== handlerRaw) {
          changes.push({
            target,
            kind: handlerExisting === undefined ? "create" : "update",
            ownership: "full",
            scope: "project",
            path: path.relative(root, handlerPath).split(path.sep).join("/"),
            beforeHash: handlerExisting === undefined ? null : sha256(handlerExisting),
            afterHash: sha256(handlerRaw),
            content: handlerRaw,
            risk: "low",
            requiresApproval: false,
            atomicState: "planned",
          });
        }
      }
      return changes;
    },
  };
}
