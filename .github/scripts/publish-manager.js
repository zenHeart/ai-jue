const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES_DIR = 'packages';

function getPackagePath(packageName) {
  if (!fs.existsSync(PACKAGES_DIR)) return null;
  const entries = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pkgJsonPath = path.join(PACKAGES_DIR, entry.name, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          if (pkg.name === packageName) {
            return path.join(PACKAGES_DIR, entry.name);
          }
        } catch (e) {
          // ignore invalid json
        }
      }
    }
  }
  return null;
}

function main() {
  try {
    // 1. Parse Tag from Environment
    const ref = process.env.GITHUB_REF; // e.g., refs/tags/ai-jue@v1.0.0
    if (!ref || !ref.startsWith('refs/tags/')) {
      console.log('Not triggered by a tag. Skipping publish.');
      return;
    }
    
    const tag = ref.replace('refs/tags/', '');
    console.log(`Detected Tag: ${tag}`);

    // Tag format: name@version (e.g. @scope/pkg@1.0.0 or pkg@1.0.0)
    // We look for the *last* '@' to separate version
    const lastAtIndex = tag.lastIndexOf('@');
    if (lastAtIndex === -1 || lastAtIndex === 0) {
      throw new Error(`Invalid tag format: ${tag}. Expected <package>@<version>`);
    }

    const packageName = tag.substring(0, lastAtIndex);
    const version = tag.substring(lastAtIndex + 1).replace(/^v/, ''); // remove 'v' prefix if present in version part

    console.log(`Target Package: ${packageName}`);
    console.log(`Target Version: ${version}`);

    // 2. Locate Package
    const pkgDir = getPackagePath(packageName);
    if (!pkgDir) {
      throw new Error(`Could not find package directory for: ${packageName}`);
    }
    console.log(`Package Directory: ${pkgDir}`);

    // 3. Verify Version in package.json
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (pkgJson.version !== version) {
      throw new Error(`Version mismatch! Tag version: ${version}, package.json version: ${pkgJson.version}`);
    }

    // 4. Publish
    // Note: --provenance is key for Trusted Publishing, but requires PUBLIC repo.
    // Since ai-jue is PRIVATE, we must disable provenance to avoid 422 errors.
    console.log('Executing npm publish...');
    // Add --verbose for better debugging in CI
    const cmd = 'npm publish --access public --verbose';
    console.log(`> ${cmd}`);
    
    execSync(cmd, { 
      cwd: pkgDir, 
      stdio: 'inherit',
      env: { ...process.env } // Pass environment variables (OIDC tokens)
    });

    console.log('✅ Publish successful!');

  } catch (err) {
    console.error(`❌ Publish failed: ${err.message}`);
    process.exit(1);
  }
}

main();
