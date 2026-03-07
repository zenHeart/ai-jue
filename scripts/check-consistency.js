const fs = require('fs');
const path = require('path');

const packagesDir = path.resolve(__dirname, '../packages');
const repoUrl = 'git+https://github.com/zenHeart/ai-jue.git';
const repoHttpUrl = 'https://github.com/zenHeart/ai-jue';
const expectedLicense = 'MIT';
const disallowedLockfiles = ['pnpm-lock.yaml', 'yarn.lock'];

let hasError = false;

console.log('Checking package consistency...');

const packages = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((pkgName) => fs.existsSync(path.join(packagesDir, pkgName, 'package.json')));

packages.forEach(pkgName => {
  const pkgPath = path.join(packagesDir, pkgName, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Package ${pkgName} not found at ${pkgPath}`);
    hasError = true;
    return;
  }

  const pkg = require(pkgPath);
  const errors = [];

  // Check repository
  if (!pkg.repository || pkg.repository.url !== repoUrl) {
    errors.push(`Invalid repository.url: expected ${repoUrl}`);
  }
  if (!pkg.repository || pkg.repository.directory !== `packages/${pkgName}`) {
    errors.push(`Invalid repository.directory: expected packages/${pkgName}`);
  }

  // Check homepage
  const expectedHomepage = `${repoHttpUrl}/tree/main/packages/${pkgName}#readme`;
  if (pkg.homepage !== expectedHomepage) {
    errors.push(`Invalid homepage: expected ${expectedHomepage}`);
  }

  // Check bugs
  const expectedBugs = `${repoHttpUrl}/issues`;
  if (!pkg.bugs || pkg.bugs.url !== expectedBugs) {
    errors.push(`Invalid bugs.url: expected ${expectedBugs}`);
  }

  // Check license
  if (pkg.license !== expectedLicense) {
    errors.push(`Invalid license: expected ${expectedLicense}`);
  }

  // Check README exists
  const readmePath = path.join(packagesDir, pkgName, 'README.md');
  if (!fs.existsSync(readmePath)) {
    errors.push('Missing README.md');
  }

  for (const lockfileName of disallowedLockfiles) {
    if (fs.existsSync(path.join(packagesDir, pkgName, lockfileName))) {
      errors.push(`Unexpected nested lockfile: ${lockfileName}`);
    }
  }

  if (pkg.private && pkg.publishConfig && pkg.publishConfig.access === 'public') {
    errors.push('Private package must not declare publishConfig.access=public');
  }

  if (errors.length > 0) {
    console.error(`❌ ${pkgName}:`);
    errors.forEach(e => console.error(`  - ${e}`));
    hasError = true;
  } else {
    console.log(`✅ ${pkgName}`);
  }
});

if (hasError) {
  console.error('\nConsistency check failed!');
  process.exit(1);
} else {
  console.log('\nAll packages are consistent.');
}
