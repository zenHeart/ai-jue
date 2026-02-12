const fs = require('fs');
const path = require('path');

const commonMetadata = {
    author: "AI-Jue Team <contact@ai-jue.dev>",
    license: "MIT",
    repository: {
        type: "git",
        url: "git+https://github.com/ai-jue/ai-jue.git"
    },
    bugs: {
        url: "https://github.com/ai-jue/ai-jue/issues"
    },
    homepage: "https://github.com/ai-jue/ai-jue#readme",
    publishConfig: {
        access: "public"
    }
};

const codePackages = [
    'packages/ai-jue',
    'packages/ai-jue-core',
    'packages/ai-jue-adapter-claude',
    'packages/ai-jue-adapter-copilot',
    'packages/ai-jue-adapter-cursor',
    'packages/ai-jue-adapter-gemini'
];

const presetPackages = [
    'packages/jue-preset-base',
    'packages/jue-preset-react',
    'packages/jue-preset-typescript'
];

const privatePackages = [
    'packages/jue-preset-internal',
    'packages/docs',
    'packages/vscode-extension'
];

function updatePackageJson(pkgPath, type) {
    const fullPath = path.resolve(process.cwd(), pkgPath, 'package.json');
    if (!fs.existsSync(fullPath)) {
        console.warn(`Skipping ${pkgPath}: package.json not found`);
        return;
    }

    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    if (type === 'private') {
        pkg.private = true;
        delete pkg.publishConfig;
    } else {
        Object.assign(pkg, commonMetadata);
        delete pkg.private;

        if (type === 'code') {
            pkg.files = ['dist'];
            // Ensure main points to dist/index.js (except CLI which has bin)
            if (pkg.name !== 'ai-jue') {
                pkg.main = 'dist/index.js';
                pkg.types = 'dist/index.d.ts';
            }
        } else if (type === 'preset') {
            const presetRoot = path.resolve(process.cwd(), pkgPath);
            const candidateFiles = [
                'AGENTS.md',
                'AGENTS.en.md',
                'commands',
                'rules',
                'skills',
                'agents',
                'hooks',
                'tools',
                'prompts',
                'index.js',
                'README.md',
                'README.en.md',
                'CHANGELOG.md',
            ];
            pkg.files = candidateFiles.filter((entry) =>
                fs.existsSync(path.join(presetRoot, entry))
            );
            pkg.main = 'index.js';
            
            // Create dummy index.js if not exists
            const indexJsPath = path.resolve(process.cwd(), pkgPath, 'index.js');
            if (!fs.existsSync(indexJsPath)) {
                fs.writeFileSync(indexJsPath, 'module.exports = {};\n');
                console.log(`Created dummy index.js for ${pkgPath}`);
            }
        }
    }

    fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${pkgPath}`);
}

codePackages.forEach(p => updatePackageJson(p, 'code'));
presetPackages.forEach(p => updatePackageJson(p, 'preset'));
privatePackages.forEach(p => updatePackageJson(p, 'private'));
