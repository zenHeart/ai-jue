import i18next from "i18next";

const resources = {
  en: {
    translation: {
      common: {
        error: "Error: {{message}}",
        warning: "Warning: {{message}}",
        success: "Success: {{message}}",
        verbose_describe: "Run with verbose logging",
        demand_command: "You need at least one command before moving on",
      },
      commands: {
        apply: {
          describe: "Apply AI configurations based on ai.config.js",
          watch_describe: "Watch for changes and re-apply automatically",
          adapter_describe:
            "Specify adapters to run (repeatable or comma-separated), e.g. --adapter cursor --adapter gemini",
          all_describe: "Run all discovered adapters (-a)",
          running: "\n🚀 Running apply command...",
          finding_adapters: "Finding adapters...",
          no_adapters: "No adapters found. No files will be generated.",
          no_adapter_selected:
            "No adapters selected and no adapter footprint detected. Use --adapter to choose adapters, or --all/-a to run all.",
          auto_detected_adapters:
            "No explicit adapter selected. Auto-detected {{count}} adapter(s): {{names}}",
          found_adapters: "Found {{count}} adapter(s): {{names}}",
          unknown_adapters:
            "Unknown adapter(s): {{unknown}}. Available adapters: {{available}}",
          running_adapter: "Running adapter: {{name}}",
          adapter_success: "Adapter {{name}} finished successfully",
          adapter_no_generate:
            'Adapter {{name}} does not export a "generate" function.',
          adapter_failed: "Error running adapter {{name}}: {{message}}",
          loaded_config: "Loaded user config.",
          finished: "✨ Apply command finished.",
          failed: "Failed to apply configuration: {{message}}",
          watch_start:
            "\n[WATCH] Watching config files (ai/jue), AGENTS.md, and asset directories (.ai/.jue)...",
          watch_update: "\n[UPDATE] File change detected. Re-applying...",
          watch_stop: "\nStopping watch mode...",
        },
        init: {
          describe: "Initialize AI configuration in your project",
          running: "Initializing ai-jue...",
          already_exists: "ai.config.js already exists.",
          ask_create_config: "Create ai.config.js? (Y/n) ",
          ask_preset: "Enter preset name (default: base): ",
          created_config: "Created ai.config.js",
          ask_create_dir: "Create .ai directory structure? (Y/n) ",
          created_dir:
            "Created .ai directory with AGENTS.md, rules/, commands/, skills/, agents/, hooks/, tools/ subdirectories.",
          dir_exists: ".ai directory already exists.",
        },
        check: {
          describe: "Check for updates of presets and core",
          checking: "Checking for updates...",
          up_to_date: "Everything is up to date.",
          updates_available: "Updates available for: {{packages}}",
          failed: "Failed to check for updates: {{message}}",
        },
        list: {
          describe: "List all active presets and assets",
          active_presets: "Active Presets:",
          assets_found: "Assets found in current configuration:",
          no_presets: "No presets active.",
        },
        validate: {
          describe: "Validate ai.config.js and assets",
          validating: "Validating configuration and assets...",
          valid: "✨ Configuration and assets are valid.",
          invalid: "❌ Validation failed:",
        },
        "create-preset": {
          describe: "Create a new AI-Jue preset project structure",
          running: "Creating new preset: {{name}}...",
          success: "✨ Preset {{name}} created successfully at {{path}}",
          failed: "Failed to create preset: {{message}}",
          ask_name: "Enter preset name: ",
        },
      },
    },
  },
  zh: {
    translation: {
      common: {
        error: "错误: {{message}}",
        warning: "警告: {{message}}",
        success: "成功: {{message}}",
      },
      commands: {
        apply: {
          describe: "基于 ai.config.js 应用 AI 配置",
          watch_describe: "监听文件变化并自动重新应用",
          adapter_describe:
            "指定要执行的适配器（可重复或逗号分隔），例如 --adapter cursor --adapter gemini",
          all_describe: "执行全部已发现的适配器（-a）",
          running: "\n🚀 正在运行 apply 命令...",
          finding_adapters: "正在查找适配器...",
          no_adapters: "未找到适配器。将不会生成任何文件。",
          no_adapter_selected:
            "未选择适配器且未检测到适配器痕迹。请使用 --adapter 指定，或使用 --all/-a 执行全部。",
          auto_detected_adapters:
            "未显式指定适配器，已自动识别 {{count}} 个适配器: {{names}}",
          found_adapters: "找到 {{count}} 个适配器: {{names}}",
          unknown_adapters:
            "存在未知适配器: {{unknown}}。可用适配器: {{available}}",
          running_adapter: "正在运行适配器: {{name}}",
          adapter_success: "适配器 {{name}} 成功完成",
          adapter_no_generate: '适配器 {{name}} 未导出 "generate" 函数。',
          adapter_failed: "运行适配器 {{name}} 出错: {{message}}",
          loaded_config: "已加载用户配置。",
          finished: "✨ Apply 命令执行完毕。",
          failed: "应用配置失败: {{message}}",
          watch_start: "\n[WATCH] 正在监听配置文件（ai/jue）、AGENTS.md 与资产目录（.ai/.jue）变化...",
          watch_update: "\n[UPDATE] 检测到文件变化。正在重新应用...",
          watch_stop: "\n正在停止监听模式...",
        },
        init: {
          describe: "初始化项目 AI 配置",
          running: "正在初始化 ai-jue...",
          already_exists: "ai.config.js 已存在。",
          ask_create_config: "是否创建 ai.config.js？(Y/n) ",
          ask_preset: "请输入预设名称（默认: base）: ",
          created_config: "已创建 ai.config.js",
          ask_create_dir: "是否创建 .ai 目录结构？(Y/n) ",
          created_dir:
            "已创建 .ai 目录及 AGENTS.md、rules/、commands/、skills/、agents/、hooks/、tools/ 子目录。",
          dir_exists: ".ai 目录已存在。",
        },
        check: {
          describe: "检查预设和核心包的更新",
          checking: "正在检查更新...",
          up_to_date: "所有包均已是最新版本。",
          updates_available: "以下包有可用更新: {{packages}}",
          failed: "检查更新失败: {{message}}",
        },
        list: {
          describe: "列出所有活跃的预设和资产",
          active_presets: "当前活跃预设:",
          assets_found: "当前配置中找到的资产:",
          no_presets: "当前无活跃预设。",
        },
        validate: {
          describe: "校验 ai.config.js 和资产的合法性",
          validating: "正在校验配置和资产...",
          valid: "✨ 配置和资产有效。",
          invalid: "❌ 校验失败:",
        },
        "create-preset": {
          describe: "创建一个新的 AI-Jue 预设项目结构",
          running: "正在创建新预设: {{name}}...",
          success: "✨ 预设 {{name}} 已成功创建于 {{path}}",
          failed: "创建预设失败: {{message}}",
          ask_name: "请输入预设名称: ",
        },
      },
    },
  },
};

export async function initI18n(lang?: string) {
  // Detector logic
  const detectLang = () => {
    if (lang) return lang;
    if (process.env.AI_JUE_LANG) return process.env.AI_JUE_LANG;

    const envLang = process.env.LANG || process.env.LANGUAGE || "";
    if (envLang.startsWith("zh")) return "zh";

    return "en";
  };

  await i18next.init({
    lng: detectLang(),
    fallbackLng: "en",
    resources,
    interpolation: {
      escapeValue: false,
    },
  });
}

export const t = i18next.t.bind(i18next);
export default i18next;
