const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES_DIR = 'packages';
const EXCLUDED_DIRS = new Set(['docs', 'vscode-extension', 'jue-preset-internal']);

function step(msg) {
  process.stdout.write(`\n${msg}\n`);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
  } catch (e) {
    const stdout = e.stdout ? String(e.stdout) : '';
    const stderr = e.stderr ? String(e.stderr) : '';
    process.stderr.write(`\n❌ Command failed: ${cmd}\n`);
    if (stdout) process.stderr.write(`\n--- stdout ---\n${stdout}\n`);
    if (stderr) process.stderr.write(`\n--- stderr ---\n${stderr}\n`);
    throw e;
  }
}

function listPackageDirs() {
  if (!fs.existsSync(PACKAGES_DIR)) return [];
  return fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((d) => !EXCLUDED_DIRS.has(d))
    .filter((d) => fs.existsSync(path.join(PACKAGES_DIR, d, 'package.json')));
}

function loadPkgMap() {
  const map = new Map();
  for (const dir of listPackageDirs()) {
    const pkgJsonPath = path.join(PACKAGES_DIR, dir, 'package.json');
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      map.set(pkg.name, { dir, pkg });
    } catch {
      // ignore
    }
  }
  return map;
}

function parseBatchTagFromEnv() {
  const ref = process.env.GITHUB_REF;
  if (!ref || !ref.startsWith('refs/tags/')) return null;
  return ref.replace('refs/tags/', '');
}

function readReleaseNoteAtTag(tagName) {
  const ref = `refs/tags/${tagName}`;
  const content = run(`git show ${ref}:release-note.md`);
  return content;
}

function parseReleaseNote(noteContent) {
  const lines = noteContent.split('\n').map((l) => l.trim());
  const items = [];
  for (const line of lines) {
    if (!line.startsWith('- ')) continue;
    const raw = line.slice(2).trim();
    const lastAt = raw.lastIndexOf('@');
    if (lastAt <= 0) continue;
    const name = raw.slice(0, lastAt);
    const versionRaw = raw.slice(lastAt + 1);
    const version = versionRaw.replace(/^v/, '');
    if (!name || !version) continue;
    items.push({ name, version, tag: `${name}@v${version}` });
  }
  return items;
}

function npmVersionExists(pkg, version) {
  const res = run(`npm view ${pkg}@${version} version --json`, { stdio: 'pipe' });
  if (!res) return false;
  try {
    const parsed = JSON.parse(res);
    if (typeof parsed === 'string') return parsed === version;
    if (Array.isArray(parsed)) return parsed.includes(version);
    return false;
  } catch {
    return String(res).trim() === version;
  }
}

function main() {
  const batchTag = parseBatchTagFromEnv();
  if (!batchTag) {
    process.stdout.write('Not triggered by a tag. Skipping.\n');
    return;
  }

  step(`Detected Batch Tag: ${batchTag}`);
  const note = readReleaseNoteAtTag(batchTag);
  const items = parseReleaseNote(note);
  if (items.length === 0) {
    throw new Error('release-note.md contains no publish items.');
  }

  const pkgMap = loadPkgMap();
  step(`Packages to process: ${items.length}`);

  for (const item of items) {
    const found = pkgMap.get(item.name);
    if (!found) {
      throw new Error(`Could not find package directory for: ${item.name}`);
    }
    const pkgDir = path.join(PACKAGES_DIR, found.dir);

    step(`\n📦 ${item.name}@${item.version}`);
    const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    if (pkgJson.version !== item.version) {
      throw new Error(
        `Version mismatch for ${item.name}. release-note: ${item.version}, package.json: ${pkgJson.version}`
      );
    }

    if (pkgJson.private) {
      process.stdout.write(`Skipping private package: ${item.name}\n`);
      continue;
    }

    let exists = false;
    try {
      exists = npmVersionExists(item.name, item.version);
    } catch {
      exists = false;
    }

    if (exists) {
      process.stdout.write(`✅ Already published, skipping: ${item.name}@${item.version}\n`);
      continue;
    }

    process.stdout.write(`Publishing: ${item.name}@${item.version}\n`);
    run('npm publish --access public --verbose', { cwd: pkgDir, stdio: 'inherit', env: { ...process.env } });
    process.stdout.write(`✅ Published: ${item.name}@${item.version}\n`);
  }
}

main();

