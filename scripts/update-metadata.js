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
  'jue-preset-react',
  'jue-preset-typescript'
];

const repoUrl = 'git+https://github.com/zenHeart/ai-jue.git';
const repoHttpUrl = 'https://github.com/zenHeart/ai-jue';

packages.forEach(pkgName => {
  const pkgPath = path.join(packagesDir, pkgName, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`Package ${pkgName} not found at ${pkgPath}`);
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // Update metadata
  pkg.repository = {
    type: 'git',
    url: repoUrl,
    directory: `packages/${pkgName}`
  };
  pkg.homepage = `${repoHttpUrl}/tree/main/packages/${pkgName}#readme`;
  pkg.bugs = {
    url: `${repoHttpUrl}/issues`
  };
  pkg.publishConfig = {
    access: 'public'
  };

  // Write package.json
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated package.json for ${pkgName}`);

  // Create README.md
  const readmePath = path.join(packagesDir, pkgName, 'README.md');
  // Only overwrite if it doesn't exist or is empty? User said "Create or Update", so overwrite is safer for consistency.
  // But maybe I should read description from package.json
  
  const readmeContent = `# ${pkgName}

> ${pkg.description || 'Part of the ai-jue monorepo.'}

Part of the [ai-jue](${repoHttpUrl}) monorepo.

## Installation

\`\`\`bash
npm install ${pkgName}
\`\`\`

## License

MIT
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Updated README.md for ${pkgName}`);
});
