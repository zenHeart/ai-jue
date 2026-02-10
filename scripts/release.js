const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { prompt } = require('enquirer');
const semver = require('semver');
const pc = require('picocolors');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');
const ARGS = process.argv.slice(2);
const IS_DRY_RUN = ARGS.includes('--dry-run');
const IS_YES = ARGS.includes('--yes');
const SKIP_TEST = ARGS.includes('--skip-test');
const SKIP_LINT = ARGS.includes('--skip-lint');
const IS_VERBOSE = ARGS.includes('--verbose');
const BATCH_TAG_PREFIX = 'release-batch@v';

// --- Utils ---

const log = {
  info: (msg) => console.log(pc.cyan(`ℹ️  ${msg}`)),
  success: (msg) => console.log(pc.green(`✅ ${msg}`)),
  warn: (msg) => console.log(pc.yellow(`⚠️  ${msg}`)),
  error: (msg) => console.log(pc.red(`❌ ${msg}`)),
  step: (msg) => console.log(pc.blue(`\n🚀 ${msg}`)),
};

const run = (cmd, opts = {}) => {
  const options = { stdio: 'pipe', encoding: 'utf8', ...opts };
  try {
    if (IS_DRY_RUN && !opts.force) {
      log.info(`[Dry Run] ${cmd}`);
      return '';
    }
    log.info(`Running: ${cmd}`);
    const out = execSync(cmd, options).trim();
    if (IS_VERBOSE && out) console.log(out);
    return out;
  } catch (e) {
    if (opts.ignoreError) return null;
    log.error(`Command failed: ${cmd}`);
    if (e.stdout) console.log(e.stdout);
    if (e.stderr) console.error(e.stderr);
    throw e;
  }
};

// Map package name to directory name
const PKG_MAP = new Map();

const loadPackageMap = () => {
  const dirs = fs.readdirSync(PACKAGES_DIR).filter(f => fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory());
  dirs.forEach(dir => {
    const pkgPath = path.join(PACKAGES_DIR, dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        PKG_MAP.set(pkg.name, dir);
      } catch (e) {
        log.warn(`Failed to parse package.json in ${dir}`);
      }
    }
  });
};

const getPackageDir = (pkgName) => {
  if (PKG_MAP.size === 0) loadPackageMap();
  const dir = PKG_MAP.get(pkgName);
  if (!dir) throw new Error(`Directory for package ${pkgName} not found`);
  return dir;
};

const getPackageJson = (pkgName) => {
  const dir = getPackageDir(pkgName);
  const p = path.join(PACKAGES_DIR, dir, 'package.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const writePackageJson = (pkgName, data) => {
  if (IS_DRY_RUN) {
    log.info(`[Dry Run] Write package.json for ${pkgName} version ${data.version}`);
    return;
  }
  const dir = getPackageDir(pkgName);
  const p = path.join(PACKAGES_DIR, dir, 'package.json');
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
};

// --- Core Logic ---

// 1. Check Git
const checkGitClean = () => {
  if (IS_DRY_RUN) return;
  const status = run('git status --porcelain', { force: true });
  if (status && status.length > 0) {
    log.error('Git working directory is dirty. Please commit or stash changes.');
    process.exit(1);
  }
};

// 2. Detect Changed (git-based, no lerna dependency)
const EXCLUDED_DIRS = new Set(['docs', 'vscode-extension', 'jue-preset-internal']);
const IGNORE_PATTERNS = ['*.md', 'CHANGELOG.md', 'LICENSE'];

const getLatestTag = (pkgName) => {
  // Find the latest tag matching <pkgName>@v*
  const tagPrefix = `${pkgName}@v`;
  try {
    const tags = run(`git tag -l "${tagPrefix}*" --sort=-v:refname`, { force: true });
    if (!tags) return null;
    return tags.split('\n')[0].trim() || null;
  } catch (e) {
    return null;
  }
};

const hasChanges = (pkgName) => {
  const dir = getPackageDir(pkgName);
  const pkgPath = `packages/${dir}/`;
  const latestTag = getLatestTag(pkgName);

  if (!latestTag) {
    log.info(`No previous tag for ${pkgName}, marking as changed.`);
    return true;
  }

  try {
    // Get changed files in this package since the latest tag
    const diffOutput = run(`git diff --name-only ${latestTag}..HEAD -- ${pkgPath}`, { force: true });
    if (!diffOutput) return false;

    // Filter out ignored files (*.md, CHANGELOG.md, etc.)
    const changedFiles = diffOutput.split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)
      .filter(f => {
        const basename = path.basename(f);
        return !IGNORE_PATTERNS.some(pattern => {
          if (pattern.startsWith('*')) {
            return basename.endsWith(pattern.slice(1));
          }
          return basename === pattern;
        });
      });

    if (changedFiles.length > 0 && IS_VERBOSE) {
      log.info(`Changed files in ${pkgName}:`);
      changedFiles.forEach(f => console.log(`  - ${f}`));
    }

    return changedFiles.length > 0;
  } catch (e) {
    log.warn(`Failed to detect changes for ${pkgName}, marking as changed.`);
    return true;
  }
};

const getChangedPackages = () => {
  const allPackages = [];
  const dirs = fs.readdirSync(PACKAGES_DIR)
    .filter(f => fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory())
    .filter(f => !EXCLUDED_DIRS.has(f));

  dirs.forEach(dir => {
    const p = path.join(PACKAGES_DIR, dir, 'package.json');
    if (fs.existsSync(p)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (!pkg.private) {
          allPackages.push(pkg.name);
        }
      } catch (e) { /* skip */ }
    }
  });

  const changed = allPackages.filter(name => {
    const changed = hasChanges(name);
    const tag = getLatestTag(name);
    if (changed) {
      log.success(`${name} has changes since ${tag || '(no tag)'}`);
    } else {
      log.info(`${name} unchanged since ${tag}`);
    }
    return changed;
  });

  return changed;
};

// 3. Topology Sort
const getTopologicalOrder = (pkgNames) => {
  // Build graph
  const graph = new Map();
  pkgNames.forEach(name => {
    const pkg = getPackageJson(name);
    const deps = { ...pkg.dependencies, ...pkg.peerDependencies };
    const internalDeps = Object.keys(deps).filter(d => pkgNames.includes(d));
    graph.set(name, internalDeps);
  });

  const visited = new Set();
  const sorted = [];

  const visit = (node, ancestors = []) => {
    if (ancestors.includes(node)) {
      throw new Error(`Circular dependency detected: ${[...ancestors, node].join(' -> ')}`);
    }
    if (visited.has(node)) return;

    visited.add(node);
    const deps = graph.get(node) || [];
    deps.forEach(dep => visit(dep, [...ancestors, node]));
    sorted.push(node);
  };

  pkgNames.forEach(node => visit(node));
  return sorted;
};

// 4. Main
async function main() {
  console.log(pc.bold('📦 AI-Jue Batch Release Script'));

  loadPackageMap();
  checkGitClean();

  // Detect
  log.step('Detecting changes since last tag...');
  let changedPackages = getChangedPackages();

  if (changedPackages.length === 0) {
    log.success('No packages have changed since their last release. Nothing to do.');
    process.exit(0);
  }

  log.info(`${changedPackages.length} package(s) with changes detected.`);

  // Interactive Selection
  let plan = []; // { name, currentVersion, nextVersion, releaseType }

  if (IS_YES) {
    plan = changedPackages.map(name => {
      const current = getPackageJson(name).version;
      return {
        name,
        currentVersion: current,
        nextVersion: semver.inc(current, 'patch'),
        releaseType: 'patch'
      };
    });
  } else {
    // 1. Select packages
    const { selected } = await prompt({
      type: 'multiselect',
      name: 'selected',
      message: 'Select packages to release:',
      choices: changedPackages,
      initial: changedPackages
    });

    if (selected.length === 0) process.exit(0);

    // 2. Select Strategy
    const { strategy } = await prompt({
      type: 'select',
      name: 'strategy',
      message: 'Select versioning strategy:',
      choices: [
        { name: 'patch', message: 'Patch All (Recommended)' },
        { name: 'minor', message: 'Minor All' },
        { name: 'independent', message: 'Independent (Customize each)' }
      ]
    });

    if (strategy === 'independent') {
      for (const pkg of selected) {
        const current = getPackageJson(pkg).version;
        const { type } = await prompt({
          type: 'select',
          name: 'type',
          message: `Release type for ${pc.bold(pkg)} (current: ${current}):`,
          choices: ['patch', 'minor', 'major'].map(t => ({ name: t, message: `${t} (${semver.inc(current, t)})` }))
        });
        plan.push({
          name: pkg,
          currentVersion: current,
          nextVersion: semver.inc(current, type),
          releaseType: type
        });
      }
    } else {
      plan = selected.map(pkg => {
        const current = getPackageJson(pkg).version;
        return {
          name: pkg,
          currentVersion: current,
          nextVersion: semver.inc(current, strategy),
          releaseType: strategy
        };
      });
    }
  }

  // Sort Plan
  log.step('Calculating build order...');
  const sortedNames = getTopologicalOrder(plan.map(p => p.name));
  const sortedPlan = sortedNames.map(name => plan.find(p => p.name === name));

  // Preview
  console.table(sortedPlan.map(p => ({ Package: p.name, Current: p.currentVersion, Next: p.nextVersion })));

  if (!IS_YES) {
    const { confirm } = await prompt({ type: 'confirm', name: 'confirm', message: 'Confirm release plan?' });
    if (!confirm) process.exit(0);
  }

  // Execute
  const published = [];
  const tagNames = [];

  try {
    for (const item of sortedPlan) {
      log.step(`Processing ${item.name}...`);
      const dir = getPackageDir(item.name);

      // 1. Update Version
      const pkgJson = getPackageJson(item.name);
      pkgJson.version = item.nextVersion;
      writePackageJson(item.name, pkgJson);

      // 2. Build
      // Note: npm run build -w uses workspace NAME (item.name) usually, but to be safe with name mismatch
      // we can use workspace directory if we pass path relative to root?
      // Actually `npm run build -w <workspace-name>` is standard. 
      // If `ai-jue-vscode` is the workspace name defined in package.json, then `-w ai-jue-vscode` works.
      if (pkgJson.scripts && pkgJson.scripts.build) {
        run(`npm run build -w ${item.name}`);
      } else {
        log.warn(`No build script for ${item.name}, skipping build.`);
      }

      // 3. Lint
      if (!SKIP_LINT) {
        if (pkgJson.scripts && pkgJson.scripts.lint) {
          log.info(`Linting ${item.name}...`);
          run(`npm run lint -w ${item.name} --if-present`);
        }
      }

      // 4. Test
      if (!SKIP_TEST) {
        if (pkgJson.scripts && pkgJson.scripts.test) {
          log.info(`Testing ${item.name}...`);
          try {
            run(`npm run test -w ${item.name} --if-present`);
          } catch (e) {
            // If test fails, check if it's the default "Error: no test specified"
            // But run() throws, so we catch it.
            // Ideally we should check if script content is "echo ... exit 1" but that's hard.
            // If user wants to skip tests, they should use --skip-test.
            // However, user specifically asked: "if pkg has no test script, skip or warn, don't exit"
            // But here pkgJson.scripts.test EXISTS, it just fails.
            // We can try to grep the error? Or just fix the package.json test script to exit 0?
            // Best practice: fix package.json.
            throw e;
          }
        } else {
          log.warn(`No test script for ${item.name}, skipping.`);
        }
      }

      // 4. Changelog
      // We use conventional-changelog directly
      if (!IS_DRY_RUN) {
        const changelogArgs = [
          '-p', 'angular',
          '-i', path.join(PACKAGES_DIR, dir, 'CHANGELOG.md'),
          '-s',
          '--commit-path', path.join(PACKAGES_DIR, dir),
          '--lerna-package', item.name,
          '--tag-prefix', `${item.name}@` // Ensure prefix matches
        ];
        // Ensure CHANGELOG exists
        if (!fs.existsSync(path.join(PACKAGES_DIR, dir, 'CHANGELOG.md'))) {
          fs.writeFileSync(path.join(PACKAGES_DIR, dir, 'CHANGELOG.md'), '');
        }
        run(`npx conventional-changelog ${changelogArgs.join(' ')}`);
      }

      // 5. Publish
      // Moved to CI
      if (!pkgJson.private) {
        log.info(`Ready to publish ${item.name} (CI will handle this)...`);
      } else {
        log.info(`Skipping private package ${item.name}`);
      }
    }

    // All successful. Now Git Commit & Tag.
    log.step('Finalizing Git...');

    const releaseNoteLines = [
      `# Release ${new Date().toISOString()}`,
      '',
      ...sortedPlan.map(p => `- ${p.name}@v${p.nextVersion}`)
    ];

    if (!IS_DRY_RUN) {
      fs.writeFileSync(path.resolve(__dirname, '../release-note.md'), releaseNoteLines.join('\n') + '\n');
    }

    run('git add .');

    const commitTitle = 'chore(release): publish';
    const commitBody = sortedPlan.map(p => `- ${p.name}@v${p.nextVersion}`).join('\n');
    const commitMsgPath = path.resolve(__dirname, '../.release-commit-message.txt');
    if (!IS_DRY_RUN) {
      fs.writeFileSync(commitMsgPath, `${commitTitle}\n\n${commitBody}\n`);
    }
    run(`git commit -F ${commitMsgPath}`);
    if (!IS_DRY_RUN) {
      fs.unlinkSync(commitMsgPath);
    }

    // Create Tags
    for (const item of sortedPlan) {
      const tagName = `${item.name}@v${item.nextVersion}`;
      run(`git tag ${tagName}`);
      log.success(`Tagged ${tagName}`);
      tagNames.push(tagName);
    }

    // Push
    if (!IS_DRY_RUN) {
      log.info('Pushing to remote...');
      try {
        // Push current branch
        run('git push origin HEAD');

        // Push tags
        if (tagNames.length > 0) {
          log.info(`Pushing ${tagNames.length} tags...`);
          // Try pushing specific tags first
          try {
            run(`git push origin ${tagNames.join(' ')}`);
          } catch (e) {
            log.warn('Failed to push specific tags, trying --tags...');
            run('git push origin --tags');
          }
        }
      } catch (e) {
        log.error('Failed to push to remote. Please push manually.');
        throw e;
      }
    }

    // Summary
    log.step('Release Summary');
    console.table(sortedPlan.map(p => ({ Package: p.name, Version: `v${p.nextVersion}`, Tag: `${p.name}@v${p.nextVersion}` })));
    if (!IS_DRY_RUN) log.success('release-note.md committed and tags pushed.');

  } catch (e) {
    log.error('Release process failed!');
    // Rollback logic is limited for remote CI flow
    if (published.length > 0) {
      // ...
    }
    // Revert files
    run('git checkout .');
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
