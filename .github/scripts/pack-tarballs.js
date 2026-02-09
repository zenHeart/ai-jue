const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function main() {
  const itemsJson = process.env.RELEASE_ITEMS;
  if (!itemsJson) {
    process.stderr.write('RELEASE_ITEMS is required\n');
    process.exit(1);
  }

  const outDir = process.env.OUTPUT_DIR || path.resolve(process.cwd(), 'artifacts', 'tarballs');
  fs.mkdirSync(outDir, { recursive: true });

  const items = JSON.parse(itemsJson);
  if (!Array.isArray(items) || items.length === 0) {
    process.stderr.write('No release items\n');
    process.exit(1);
  }

  const checksums = [];

  for (const item of items) {
    const pkgDir = path.resolve(process.cwd(), 'packages', item.dir);
    if (!fs.existsSync(pkgDir)) {
      throw new Error(`Package dir not found: ${pkgDir}`);
    }

    process.stdout.write(`Packing ${item.name}@${item.version}...\n`);
    const packedName = run('npm pack --silent', { cwd: pkgDir });
    const from = path.join(pkgDir, packedName);
    const to = path.join(outDir, item.tgz);
    fs.renameSync(from, to);

    const sum = sha256(to);
    checksums.push(`${sum}  ${item.tgz}`);
  }

  const checksumsPath = path.join(outDir, 'checksums.sha256');
  fs.writeFileSync(checksumsPath, checksums.join('\n') + '\n');
  process.stdout.write(`Wrote ${checksumsPath}\n`);
}

main();

