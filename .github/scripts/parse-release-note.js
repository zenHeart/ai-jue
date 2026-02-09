const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.resolve(process.cwd(), 'packages');
const EXCLUDED_DIRS = new Set(['docs', 'vscode-extension', 'jue-preset-internal']);

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

function parseReleaseNote(content) {
  const lines = content.split('\n').map((l) => l.trim());
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
    items.push({ name, version });
  }
  return items;
}

function main() {
  const args = process.argv.slice(2);
  const file = args.find(arg => !arg.startsWith('--')) || 'release-note.md';
  const tagIndex = args.indexOf('--tag');
  const tag = tagIndex !== -1 ? args[tagIndex + 1] : null;

  if (!fs.existsSync(file)) {
    process.stderr.write(`release note not found: ${file}\n`);
    process.exit(1);
  }

  const content = fs.readFileSync(file, 'utf8');
  const noteItems = parseReleaseNote(content);
  if (noteItems.length === 0) {
    process.stderr.write('release-note.md contains no publish items.\n');
    process.exit(1);
  }

  const pkgMap = loadPkgMap();
  const items = noteItems.map(({ name, version }) => {
    const found = pkgMap.get(name);
    if (!found) {
      process.stderr.write(`package not found in repo: ${name}\n`);
      process.exit(1);
    }

    const pkgJsonPath = path.join(PACKAGES_DIR, found.dir, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (pkgJson.version !== version) {
      process.stderr.write(`version mismatch for ${name}: note=${version}, package.json=${pkgJson.version}\n`);
      process.exit(1);
    }

    const safeName = name.replace(/^@/, '').replace(/\//g, '-');
    const tgz = `${safeName}-${version}.tgz`;
    return { name, version, dir: found.dir, tgz };
  });

  if (tag) {
    const filtered = items.filter(item => `${item.name}@v${item.version}` === tag);
    if (filtered.length > 0) {
      items = filtered;
    }
  }

  process.stdout.write(JSON.stringify(items));
}

main();

