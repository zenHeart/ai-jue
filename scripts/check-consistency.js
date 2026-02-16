const fs = require('fs');
const path = require('path');

const packagesDir = path.resolve(__dirname, '../packages');
const packages = [
  'ai-jue',
  'ai-jue-core',
  'ai-jue-adapter-claude',
  'ai-jue-adapter-copilot',
  'ai-jue-adapter-cursor',
  'ai-jue-adapter-gemini',
  'jue-preset-base',
  'jue-preset-internal'
];

const repoUrl = 'git+https://github.com/zenHeart/ai-jue.git';
const repoHttpUrl = 'https://github.com/zenHeart/ai-jue';

let hasError = false;

console.log('Checking package consistency...');

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

  // Check README exists
  const readmePath = path.join(packagesDir, pkgName, 'README.md');
  if (!fs.existsSync(readmePath)) {
    errors.push('Missing README.md');
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
