const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { prompt } = require('enquirer');
const semver = require('semver');
const pc = require('picocolors');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

// Utils
const run = (bin, args, opts = {}) =>
  execSync(`${bin} ${args.join(' ')}`, { stdio: 'inherit', ...opts });

const step = (msg) => console.log(pc.cyan(`\n${msg}`));

const getPackages = () => {
  return fs.readdirSync(PACKAGES_DIR).filter((f) => {
    return fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory() &&
           fs.existsSync(path.join(PACKAGES_DIR, f, 'package.json'));
  });
};

const getPackageVersion = (pkg) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg, 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
};

const updatePackageVersion = (pkg, version) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkgJson.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
};

const checkGitClean = () => {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim().length > 0) {
      console.error(pc.red('❌ Git working directory is dirty. Please commit or stash changes before releasing.'));
      process.exit(1);
    }
  } catch (e) {
    console.error(pc.red('❌ Failed to check git status.'));
    process.exit(1);
  }
};

const checkChanges = (pkg) => {
  // Try to find the latest tag for this package to see if there are commits since then
  try {
    // List tags matching pattern pkg@* sorted by creatordate desc
    const tags = execSync(`git tag --list "${pkg}@*" --sort=-creatordate`, { encoding: 'utf8' }).trim().split('\n');
    const latestTag = tags[0];

    if (!latestTag) {
      // No tag found, treat as changed (new package)
      return true;
    }

    // Check if there are commits between latestTag and HEAD affecting the package directory
    const diff = execSync(`git log ${latestTag}..HEAD -- packages/${pkg}`, { encoding: 'utf8' }).trim();
    return diff.length > 0;
  } catch (e) {
    // If anything fails, assume changed to be safe, or fallback
    return true; 
  }
};

async function main() {
  // 0. Ensure git is clean
  checkGitClean();

  // 0.1 Parse args for scope
  const args = process.argv.slice(2);
  const scopeIndex = args.indexOf('--scope');
  let scope = null;
  if (scopeIndex !== -1 && args[scopeIndex + 1]) {
      scope = args[scopeIndex + 1];
      console.log(pc.blue(`ℹ️  Filtering packages by scope: ${scope}`));
  }

  // 1. Scan packages
  let packages = getPackages();
  
  if (scope) {
      if (!packages.includes(scope)) {
          console.error(pc.red(`❌ Package '${scope}' not found.`));
          process.exit(1);
      }
      packages = [scope];
  }
  
  const changedPackages = packages.filter(checkChanges);
  
  const choices = packages.map(pkg => {
    const isChanged = changedPackages.includes(pkg);
    return {
      name: pkg,
      message: `${pkg} ${pc.dim(`(v${getPackageVersion(pkg)})`)}${isChanged ? pc.yellow(' [Changed]') : ''}`,
      value: pkg
    };
  });

  // 2. Interactive selection
  const { targetPackage } = await prompt({
    type: 'select',
    name: 'targetPackage',
    message: 'Select package to release:',
    choices: choices
  });

  const currentVersion = getPackageVersion(targetPackage);

  // 3. Select version increment
  const versionIncrements = ['patch', 'minor', 'major'];
  const { releaseType } = await prompt({
    type: 'select',
    name: 'releaseType',
    message: `Select release type for ${pc.bold(targetPackage)} (current: ${currentVersion}):`,
    choices: versionIncrements.map(t => {
        const v = semver.inc(currentVersion, t);
        return { name: t, message: `${t} (${v})`, value: t }
    }).concat([{ name: 'custom', message: 'Custom...', value: 'custom' }])
  });

  let targetVersion;
  if (releaseType === 'custom') {
    const { version } = await prompt({
      type: 'input',
      name: 'version',
      message: 'Enter custom version:',
      initial: currentVersion,
      validate: v => !!semver.valid(v) || 'Invalid semantic version'
    });
    targetVersion = version;
  } else {
    targetVersion = semver.inc(currentVersion, releaseType);
  }

  // Confirm
  const { confirm } = await prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Release ${pc.bold(targetPackage)} v${targetVersion}?`
  });

  if (!confirm) return;

  step(`Releasing ${targetPackage} v${targetVersion}...`);

  // 4. Update version
  updatePackageVersion(targetPackage, targetVersion);

  try {
    // 5. Build
    step('Building...');
    run('npm', ['run', 'build', '-w', `packages/${targetPackage}`]);

    // 6. Test & Lint
    step('Testing & Linting...');
    // Check if test script exists before running
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PACKAGES_DIR, targetPackage, 'package.json'), 'utf8'));
    if (pkgJson.scripts && pkgJson.scripts.test) {
        run('npm', ['test', '-w', `packages/${targetPackage}`]);
    } else {
        console.log(pc.yellow('No test script found, skipping tests.'));
    }
    
    // 7. Changelog
    step('Generating Changelog...');
    // conventional-changelog-cli
    // Note: We assume standard conventional commits
    // Using --commit-path to filter commits for this package
    const changelogArgs = [
      '-p', 'angular',
      '-i', path.join(PACKAGES_DIR, targetPackage, 'CHANGELOG.md'),
      '-s',
      '--commit-path', path.join(PACKAGES_DIR, targetPackage),
      '--lerna-package', targetPackage, // Use lerna-package to handle monorepo tag filtering properly
    ];
    
    // We try to use a tag prefix matching our monorepo convention: package-name@
    run('npx', ['conventional-changelog', ...changelogArgs, '--tag-prefix', `${targetPackage}@`, '--pkg', path.join(PACKAGES_DIR, targetPackage, 'package.json')]);

    // 8. Git Commit & Tag
    step('Committing & Tagging...');
    const tagName = `${targetPackage}@v${targetVersion}`;
    run('git', ['add', '.']);
    
    // Fix: Wrap commit message in quotes to handle special characters properly
    // And execSync via run() splits args by space which breaks message with spaces/parens if not handled carefully
    // We should pass args as array to spawn/execFile, but execSync takes string.
    // Let's manually construct the command string with proper quoting
    
    // Actually run helper does: execSync(`${bin} ${args.join(' ')}`
    // So ['commit', '-m', 'msg'] becomes "git commit -m msg" -> broken if msg has spaces/parens
    
    // Fix: Use quoted string for message
    run('git', ['commit', '-m', `"${`chore(release): ${tagName}`}"`]);
    
    run('git', ['tag', tagName]);

    step(`Release ${tagName} successful!`);
    
    // 9. Push
    const { push } = await prompt({
      type: 'confirm',
      name: 'push',
      message: 'Push changes and tags to remote?'
    });

    if (push) {
      step('Pushing...');
      // Explicitly push tags to ensure GitHub Actions triggers Release workflow
      run('git', ['push', 'origin', tagName]); // Push specific tag first
      run('git', ['push']); // Push commits
      console.log(pc.green(`\nVersion ${tagName} pushed! CI should trigger now.`));
    } else {
      console.log(pc.green(`\nRun 'git push --follow-tags' manually to trigger release.`));
    }

  } catch (e) {
    step(pc.red('Release failed, rolling back...'));
    // Rollback package.json
    updatePackageVersion(targetPackage, currentVersion);
    console.error(e);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
