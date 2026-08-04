import { spawnSync } from "child_process";

/** True when `command` is resolvable on PATH (optional native CLI confirm tests). */
export function hasCli(command: string): boolean {
  const probe =
    process.platform === "win32"
      ? spawnSync("where", [command], { encoding: "utf8" })
      : spawnSync("sh", ["-c", `command -v ${JSON.stringify(command)}`], {
          encoding: "utf8",
        });
  return probe.status === 0;
}
