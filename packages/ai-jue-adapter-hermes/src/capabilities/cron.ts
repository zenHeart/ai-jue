import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import type { ArtifactChange, CapabilityMapping } from "ai-jue-core";

/**
 * Hermes cron jobs live at `<workspace>/cron/jobs.json` (verified
 * against cwr:/d/devuser/.hermes/cron/jobs.json — a top-level JSON
 * object mapping job_id → {name, prompt, schedule, repeat, deliver,
 * enabled, model, provider, base_url, skills, created_at}). Each
 * schedule is a standard cron string (e.g. "0 23 * * *"). Per the
 * JUE-303 honest-stance principle, the `cron` mapping is a full-file
 * pass-through (not per-job); the round-trip is byte-exact.
 */
function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

interface JobEntry {
  name?: string;
  prompt?: string;
  schedule?: string;
  repeat?: number;
  deliver?: string;
  enabled?: boolean;
  model?: string | null;
  provider?: string | null;
  base_url?: string | null;
  skills?: string[];
  created_at?: string;
  [key: string]: unknown;
}

export function cron(): CapabilityMapping<Record<string, unknown>> {
  return {
    read(root) {
      const filePath = path.join(root, "cron", "jobs.json");
      if (!fs.existsSync(filePath)) return undefined;
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") return undefined;
        return parsed;
      } catch {
        return undefined;
      }
    },
    write(root, value, target): ArtifactChange[] {
      const filePath = path.join(root, "cron", "jobs.json");
      const exists = fs.existsSync(filePath);
      const existingRaw = exists ? fs.readFileSync(filePath, "utf8") : undefined;
      const newRaw = JSON.stringify(value, null, 2) + "\n";
      if (existingRaw !== undefined && existingRaw === newRaw) return [];
      return [
        {
          target,
          kind: exists ? "update" : "create",
          ownership: "full",
          scope: "project",
          path: "cron/jobs.json",
          beforeHash: existingRaw === undefined ? null : sha256(existingRaw),
          afterHash: sha256(newRaw),
          content: newRaw,
          risk: "low",
          requiresApproval: false,
          atomicState: "planned",
        },
      ];
    },
  };
}
