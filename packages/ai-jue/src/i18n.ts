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
          no_config_detected:
            "No ai/jue config file detected in current project.",
          ask_init_before_apply:
            "Run interactive initialization now? (Y/n)",
          no_config_non_interactive:
            "Non-interactive mode cannot run initialization. Please run `jue init` first or create ai.config.js.",
          init_declined:
            "Initialization skipped. Apply is not executed.",
          init_not_completed:
            "Initialization did not produce a valid config. Apply is not executed.",
          init_completed_continue:
            "Initialization completed. Continuing apply...",
          finding_adapters: "Finding adapters...",
          no_adapters: "No adapters found. No files will be generated.",
          no_adapter_detected:
            "No adapter footprint detected in current project.",
          no_adapter_selected:
            "No adapters selected. Use --adapter to choose adapters, or --all/-a to run all.",
          auto_detected_adapters:
            "No explicit adapter selected. Auto-detected {{count}} adapter(s): {{names}}",
          manual_selected_adapters:
            "Manually selected {{count}} adapter(s): {{names}}",
          manual_selection_intro:
            "No local tool footprint found. Please select adapters to run:",
          manual_selection_hint:
            "Multiple selection supported. Enter numbers or adapter names separated by commas/spaces (for example: 1,3 or cursor gemini). Enter \"all\" to select all.",
          manual_selection_hint_inquirer:
            "Use ↑/↓ to navigate, <space> to select, <enter> to confirm.",
          manual_selection_prompt: "Adapter selection>",
          manual_selection_unavailable:
            "Interactive adapter selection is unavailable in non-interactive mode.",
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
          ask_create_dir: "Create .ai directory structure? (y/N) ",
          created_dir:
            "Created .ai directory with AGENTS.md, rules/, commands/, skills/, agents/, hooks/, tools/ subdirectories.",
          skip_create_dir:
            "Skipped creating .ai directory. You can add it later when needed.",
          skip_create_dir_auto:
            "Skipped .ai scaffold in guided apply flow (progressive enhancement only).",
          ask_install_preset:
            "Preset package {{packageName}} is not installed. Install now? (Y/n) ",
          installing_preset:
            "Installing preset {{packageName}} via: {{command}}",
          installed_preset:
            "Installed preset package: {{packageName}}",
          install_preset_failed:
            "Failed to install preset package {{packageName}}. Please install it manually and rerun apply.",
          skip_install_preset:
            "Skipped installing preset package {{packageName}}. Apply may not load preset assets.",
          preset_already_installed:
            "Preset package already installed: {{packageName}}",
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
          no_config_detected:
            "当前项目未检测到 ai/jue 配置文件。",
          ask_init_before_apply:
            "是否现在执行交互式初始化？(Y/n)",
          no_config_non_interactive:
            "当前为非交互模式，无法自动初始化。请先执行 `jue init` 或创建 ai.config.js。",
          init_declined:
            "已跳过初始化，本次不会执行 apply。",
          init_not_completed:
            "初始化后仍未生成有效配置，本次不会执行 apply。",
          init_completed_continue:
            "初始化完成，继续执行 apply...",
          finding_adapters: "正在查找适配器...",
          no_adapters: "未找到适配器。将不会生成任何文件。",
          no_adapter_detected:
            "当前项目未检测到适配器环境痕迹。",
          no_adapter_selected:
            "未选择适配器。请使用 --adapter 指定，或使用 --all/-a 执行全部。",
          auto_detected_adapters:
            "未显式指定适配器，已自动识别 {{count}} 个适配器: {{names}}",
          manual_selected_adapters:
            "已手动选择 {{count}} 个适配器: {{names}}",
          manual_selection_intro:
            "未发现本地工具环境痕迹，请手动选择要执行的适配器：",
          manual_selection_hint:
            "支持多选。请输入编号或适配器名称，多个可用逗号或空格分隔（例如：1,3 或 cursor gemini）。输入 all 表示全部。",
          manual_selection_hint_inquirer:
            "使用 ↑/↓ 移动，空格选择，回车确认。",
          manual_selection_prompt: "适配器选择>",
          manual_selection_unavailable:
            "当前为非交互模式，无法手动选择适配器。",
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
          ask_create_dir: "是否创建 .ai 目录结构？(y/N) ",
          created_dir:
            "已创建 .ai 目录及 AGENTS.md、rules/、commands/、skills/、agents/、hooks/、tools/ 子目录。",
          skip_create_dir:
            "已跳过创建 .ai 目录。后续需要时可再添加。",
          skip_create_dir_auto:
            "在 apply 引导流程中已跳过 .ai 脚手架（仅作为渐进增强目录）。",
          ask_install_preset:
            "检测到预设包 {{packageName}} 未安装，是否现在安装？(Y/n) ",
          installing_preset:
            "正在安装预设 {{packageName}}，命令: {{command}}",
          installed_preset:
            "预设安装完成：{{packageName}}",
          install_preset_failed:
            "预设 {{packageName}} 安装失败，请手动安装后重新执行 apply。",
          skip_install_preset:
            "已跳过安装预设 {{packageName}}，apply 可能无法加载预设资产。",
          preset_already_installed:
            "预设已安装：{{packageName}}",
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
