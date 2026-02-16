import { loadConfig } from "./src/config";
import { resolveFinalConfig } from "./src/resolver";
import { initI18n } from "./src/i18n";
import path from "path";

async function verify() {
  // Force English language
  process.env.AI_JUE_LANG = "en";
  await initI18n();

  const { loadAssetsFromDir } = require("./src/preset");

  const presetBaseDir = path.resolve(__dirname, "../jue-preset-base");
  console.log(`Loading assets from: ${presetBaseDir}`);
  const configBase = await loadAssetsFromDir(presetBaseDir, "en");

  // Check specific prompts for base
  const checkPrompt = (config, category, name, expectedSnippet) => {
    const item = config[category]?.[name];
    if (!item) {
      console.error(`❌ Missing ${category}/${name}`);
      return;
    }
    if (item.content.includes(expectedSnippet)) {
      console.log(`✅ ${category}/${name} loaded English content.`);
    } else {
      console.error(
        `❌ ${category}/${name} content mismatch. Got:\n${item.content.substring(0, 50)}...`,
      );
    }
  };

  checkPrompt(
    configBase,
    "prompts",
    "default",
    "As a top-tier software architect",
  );
  checkPrompt(
    configBase,
    "skills",
    "explain-code",
    'As a "Code Explanation Expert"',
  );
}

verify().catch(console.error);
