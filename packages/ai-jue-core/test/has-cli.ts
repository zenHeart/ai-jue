import { spawnSync } from "child_process";

/**
 * True when Node can actually start `command` (optional native CLI confirm tests).
 * A Windows `where` hit is insufficient because it may only find a `.cmd` shim
 * that `execFileSync(command, args)` cannot launch in the current process.
 */
export function hasCli(command: string): boolean {
  const probe = spawnSync(command, ["--version"], {
    encoding: "utf8",
    stdio: "ignore",
  });
  return !probe.error && probe.status !== null;
}
