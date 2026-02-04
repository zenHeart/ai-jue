"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
// Helper function to read asset content with i18n logic
function loadAssetContent(assetPath, fileNameWithoutExt, userLanguage) {
    const baseFilePath = path_1.default.join(assetPath, fileNameWithoutExt);
    let content = null;
    // 1. Exact Language Match (if userLanguage is set)
    if (userLanguage) {
        const langFile = `${baseFilePath}.${userLanguage}.md`;
        if (fs_1.default.existsSync(langFile)) {
            console.log(`[Preset Loader] Found lang-specific file: ${langFile}`);
            return fs_1.default.readFileSync(langFile, 'utf8');
        }
        console.log(`[Preset Loader] No lang-specific file found for ${userLanguage}: ${langFile}`);
    }
    // 2. Generic Default
    const genericFile = `${baseFilePath}.md`;
    if (fs_1.default.existsSync(genericFile)) {
        console.log(`[Preset Loader] Found generic default file: ${genericFile}`);
        return fs_1.default.readFileSync(genericFile, 'utf8');
    }
    console.log(`[Preset Loader] No generic default file found: ${genericFile}`);
    // 3. Fallback to any language-suffixed file (deterministic)
    // Need to correctly get files from the current assetPath
    const allLangFiles = (0, glob_1.globSync)(`${fileNameWithoutExt}.*.md`, { cwd: assetPath }).sort();
    if (allLangFiles.length > 0) {
        const chosenFile = path_1.default.join(assetPath, allLangFiles[0]);
        console.log(`[Preset Loader] Fallback: found multiple lang files, choosing: ${chosenFile}`);
        return fs_1.default.readFileSync(chosenFile, 'utf8');
    }
    console.log(`[Preset Loader] No fallback lang file found in ${assetPath}`);
    return null;
}
module.exports = function (options = {}) {
    const userLanguage = options.language || null;
    const config = {};
    const baseDir = path_1.default.join(__dirname, 'src'); // Corrected path to where assets are copied
    console.log(`[Preset Loader] Base directory for preset: ${baseDir}`);
    // Load Prompts
    const promptsDir = path_1.default.join(baseDir, 'prompts');
    console.log(`[Preset Loader] Checking prompts directory: ${promptsDir}`);
    if (fs_1.default.existsSync(promptsDir)) {
        console.log(`[Preset Loader] Prompts directory exists.`);
        const promptFolders = fs_1.default.readdirSync(promptsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        config.prompts = {};
        for (const folderName of promptFolders) {
            const promptPath = path_1.default.join(promptsDir, folderName);
            const indexJsonPath = path_1.default.join(promptPath, 'index.json');
            console.log(`[Preset Loader] Loading prompt: ${folderName} from ${promptPath}`);
            const promptContent = loadAssetContent(promptPath, 'prompt', userLanguage);
            if (promptContent) {
                let metadata = {};
                if (fs_1.default.existsSync(indexJsonPath)) {
                    console.log(`[Preset Loader] Found index.json for ${folderName}: ${indexJsonPath}`);
                    try {
                        metadata = JSON.parse(fs_1.default.readFileSync(indexJsonPath, 'utf8'));
                    }
                    catch (e) {
                        console.error(`[Preset Loader] Error parsing index.json for ${folderName}:`, e);
                    }
                }
                config.prompts[folderName] = { ...metadata, prompt: promptContent };
            }
            else {
                console.log(`[Preset Loader] No prompt content found for ${folderName}`);
            }
        }
    }
    else {
        console.log(`[Preset Loader] Prompts directory does NOT exist: ${promptsDir}`);
    }
    // Load Skills
    const skillsDir = path_1.default.join(baseDir, 'skills');
    console.log(`[Preset Loader] Checking skills directory: ${skillsDir}`);
    if (fs_1.default.existsSync(skillsDir)) {
        console.log(`[Preset Loader] Skills directory exists.`);
        const skillFolders = fs_1.default.readdirSync(skillsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        config.skills = {};
        for (const folderName of skillFolders) {
            const skillPath = path_1.default.join(skillsDir, folderName);
            const indexJsonPath = path_1.default.join(skillPath, 'index.json');
            console.log(`[Preset Loader] Loading skill: ${folderName} from ${skillPath}`);
            const promptContent = loadAssetContent(skillPath, 'prompt', userLanguage);
            if (promptContent) {
                let metadata = {};
                if (fs_1.default.existsSync(indexJsonPath)) {
                    console.log(`[Preset Loader] Found index.json for ${folderName}: ${indexJsonPath}`);
                    try {
                        metadata = JSON.parse(fs_1.default.readFileSync(indexJsonPath, 'utf8'));
                    }
                    catch (e) {
                        console.error(`[Preset Loader] Error parsing index.json for ${folderName}:`, e);
                    }
                }
                config.skills[folderName] = { ...metadata, prompt: promptContent };
            }
            else {
                console.log(`[Preset Loader] No prompt content found for ${folderName}`);
            }
        }
    }
    else {
        console.log(`[Preset Loader] Skills directory does NOT exist: ${skillsDir}`);
    }
    return config;
};
//# sourceMappingURL=index.js.map