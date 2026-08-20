import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const CODEX_ADAPTER_DIR = path.join(REPO_ROOT, "packages", "ai-jue-adapter-codex");
const TOML_DIR = path.join(REPO_ROOT, "node_modules", "@iarna", "toml");
const CHILD_TIMEOUT_MS = 10_000;

interface CommandOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
}

function run(command: string, args: string[], { cwd, env }: CommandOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, CHILD_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut || code !== 0) {
        const displayCommand = command === process.execPath ? "node" : command;
        reject(
          new Error(
            `${displayCommand} ${args.join(" ")} ${timedOut ? "timed out" : `failed (code=${code}, signal=${signal ?? "none"})`}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
          ),
        );
        return;
      }
      resolve(stdout);
    });
  });
}

function npmInvocation(
  args: string[],
  npmExecPath = process.env.npm_execpath,
  platform = process.platform,
): [command: string, args: string[]] {
  if (npmExecPath) {
    return [process.execPath, [npmExecPath, ...args]];
  }
  return [platform === "win32" ? "npm.cmd" : "npm", args];
}

function runNpm(args: string[], options: CommandOptions): Promise<string> {
  const [command, commandArgs] = npmInvocation(args);
  return run(command, commandArgs, options);
}

async function pack(outputDir: string, env: NodeJS.ProcessEnv): Promise<string> {
  const output = await runNpm(
    ["pack", "--json", "--offline", "--ignore-scripts", "--pack-destination", outputDir],
    { cwd: CODEX_ADAPTER_DIR, env },
  );
  const [entry] = JSON.parse(output) as Array<{ filename: string }>;
  if (!entry?.filename) throw new Error("npm pack did not return an archive filename");
  return path.join(outputDir, entry.filename);
}

it("launches npm without a shell on every supported platform", () => {
  expect(npmInvocation(["--version"], "C:\\npm\\npm-cli.js", "win32")).toEqual([
    process.execPath,
    ["C:\\npm\\npm-cli.js", "--version"],
  ]);
  expect(npmInvocation(["--version"], "", "win32")).toEqual(["npm.cmd", ["--version"]]);
  expect(npmInvocation(["--version"], "", "darwin")).toEqual(["npm", ["--version"]]);
});

it("loads the packed Adapter from a fully offline isolated consumer", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jue-codex-package-runtime-"));
  try {
    const offlineEnv = {
      ...process.env,
      npm_config_offline: "true",
      npm_config_cache: path.join(tempRoot, "npm-cache"),
      npm_config_ignore_scripts: "true",
      npm_config_audit: "false",
      npm_config_fund: "false",
    };
    // Published packages contain only dist/, so build before the local pack.
    await runNpm(["run", "build", "--workspace", "ai-jue-core"], { cwd: REPO_ROOT, env: offlineEnv });
    await runNpm(["run", "build", "--workspace", "ai-jue-adapter-codex"], { cwd: REPO_ROOT, env: offlineEnv });

    const packageDir = path.join(tempRoot, "package");
    fs.mkdirSync(packageDir);
    const archive = await pack(packageDir, offlineEnv);
    const unpackedDir = path.join(tempRoot, "unpacked");
    fs.mkdirSync(unpackedDir);
    await run("tar", ["-xzf", archive, "-C", unpackedDir], { cwd: tempRoot, env: offlineEnv });

    const packedAdapterDir = path.join(unpackedDir, "package");
    const packedManifest = JSON.parse(fs.readFileSync(path.join(packedAdapterDir, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(packedManifest.dependencies?.["@iarna/toml"]).toBe("^2.2.5");
    expect(packedManifest.devDependencies?.["@iarna/toml"]).toBeUndefined();

    const consumerDir = path.join(tempRoot, "consumer");
    const nodeModules = path.join(consumerDir, "node_modules");
    fs.mkdirSync(consumerDir);
    fs.writeFileSync(path.join(consumerDir, "package.json"), JSON.stringify({ private: true }));
    fs.mkdirSync(path.join(nodeModules, "@iarna"), { recursive: true });
    fs.renameSync(packedAdapterDir, path.join(nodeModules, "ai-jue-adapter-codex"));
    fs.cpSync(TOML_DIR, path.join(nodeModules, "@iarna", "toml"), { recursive: true });
    fs.mkdirSync(path.join(nodeModules, "ai-jue-core"));
    fs.writeFileSync(
      path.join(nodeModules, "ai-jue-core", "package.json"),
      JSON.stringify({ name: "ai-jue-core", main: "index.js" }),
    );
    // Loading the Adapter only needs defineExtension; the rest of Core is not
    // exercised here because this is a package-resolution regression test.
    fs.writeFileSync(
      path.join(nodeModules, "ai-jue-core", "index.js"),
      "exports.defineExtension = (extension) => extension;\n",
    );

    const childOutput = await run(
      process.execPath,
      [
        "-e",
        `const fs=require("fs");const path=require("path");const {createRequire}=require("module");const root=fs.realpathSync(process.env.PACKED_CONSUMER_ROOT);const isolatedRequire=createRequire(path.join(root,"package.json"));const inside=(file)=>{const relative=path.relative(root,file);return Boolean(relative)&&!relative.startsWith("..")&&!path.isAbsolute(relative)};const adapter=isolatedRequire.resolve("ai-jue-adapter-codex");const toml=isolatedRequire.resolve("@iarna/toml");isolatedRequire("ai-jue-adapter-codex");isolatedRequire("@iarna/toml");process.stdout.write(JSON.stringify({adapter:path.relative(root,adapter),toml:path.relative(root,toml),adapterInside:inside(adapter),tomlInside:inside(toml)}));`,
      ],
      {
        cwd: consumerDir,
        env: { ...offlineEnv, NODE_PATH: "", PACKED_CONSUMER_ROOT: consumerDir },
      },
    );
    const resolved = JSON.parse(childOutput) as {
      adapter: string;
      toml: string;
      adapterInside: boolean;
      tomlInside: boolean;
    };
    expect(resolved.adapterInside).toBe(true);
    expect(resolved.tomlInside).toBe(true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}, 30_000);
