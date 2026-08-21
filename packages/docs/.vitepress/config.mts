import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const zhGuideSidebar = [
  {
    text: "开始使用",
    items: [
      { text: "什么是 ai-jue?", link: "/guide/what-is-ai-jue" },
      { text: "快速上手", link: "/guide/getting-started" },
      { text: "配置指南", link: "/guide/configuration-guide" },
      { text: "官方预设", link: "/guide/presets" },
      { text: "跨 Agent 迁移", link: "/guide/migration" },
    ],
  },
  {
    text: "创建与集成",
    items: [
      { text: "创建预设", link: "/guide/creating-a-preset" },
      { text: "本地开发 Preset", link: "/guide/local-preset-development" },
      { text: "扩展 Jue", link: "/guide/extensions" },
      { text: "与脚手架集成", link: "/guide/integration" },
    ],
  },
];

const zhArchitectureSidebar = [
  {
    text: "架构",
    items: [
      { text: "架构总览", link: "/architecture/" },
      {
        text: "适配器标准化",
        link: "/architecture/adapter-standardization",
      },
    ],
  },
  {
    text: "规范",
    items: [
      { text: "规范总览", link: "/specs/" },
      { text: "Jue MVP", link: "/specs/jue-mvp" },
      { text: "Canonical Model", link: "/specs/canonical-model" },
      { text: "Capability Source", link: "/specs/capability-source" },
      {
        text: "Codex / Claude Code Adapter",
        link: "/specs/codex-claude-code-adapters",
      },
    ],
  },
  {
    text: "Agent 支持",
    items: [
      { text: "支持画像", link: "/agents/" },
      { text: "Claude Code", link: "/agents/claude-code" },
      { text: "Codex", link: "/agents/codex" },
      { text: "Cursor", link: "/agents/cursor" },
      { text: "OpenClaw", link: "/agents/openclaw" },
      { text: "Hermes", link: "/agents/hermes" },
    ],
  },
];

const zhReferenceSidebar = [
  {
    text: "CLI",
    items: [
      { text: "命令总览", link: "/reference/cli/" },
      { text: "核心工作流", link: "/reference/cli/workflow" },
      { text: "Capability", link: "/reference/cli/capability" },
      { text: "Preset", link: "/reference/cli/preset" },
      { text: "Extension", link: "/reference/cli/extension" },
    ],
  },
  {
    text: "配置与 API",
    items: [
      { text: "参考总览", link: "/reference/" },
      { text: "项目配置", link: "/reference/project-config" },
      { text: "Preset Manifest", link: "/reference/preset-manifest" },
      { text: "Extension API", link: "/reference/extension-api" },
      { text: "术语表", link: "/reference/glossary" },
    ],
  },
];

const zhDeveloperSidebar = [
  {
    text: "Developer",
    items: [
      { text: "总览", link: "/developer/" },
      { text: "文档事实源", link: "/developer/documentation-contract" },
      { text: "实现状态", link: "/developer/implementation-status" },
      { text: "Roadmap", link: "/developer/roadmap" },
      { text: "Delivery Plan", link: "/developer/delivery-plan" },
    ],
  },
  {
    text: "RFCs",
    items: [
      { text: "RFC 清单", link: "/developer/rfcs/" },
      {
        text: "RFC-0001 最小转换模型",
        link: "/developer/rfcs/0001-minimal-conversion-model",
      },
      {
        text: "RFC-0002 Plugin / Bundle Artifact 的 apply 合同",
        link: "/developer/rfcs/0002-plugin-artifact-apply",
      },
      {
        text: "RFC-0003 apply 作用域与目标根",
        link: "/developer/rfcs/0003-apply-scope-target-root",
      },
    ],
  },
];

const enGuideSidebar = [
  {
    text: "Get Started",
    items: [
      { text: "What is ai-jue?", link: "/en/guide/what-is-ai-jue" },
      { text: "Getting Started", link: "/en/guide/getting-started" },
      {
        text: "Configuration Guide",
        link: "/en/guide/configuration-guide",
      },
      { text: "Official Presets", link: "/en/guide/presets" },
      { text: "Cross-Agent Migration", link: "/en/guide/migration" },
    ],
  },
  {
    text: "Create and Integrate",
    items: [
      { text: "Creating a Preset", link: "/en/guide/creating-a-preset" },
      {
        text: "Developing a Preset Locally",
        link: "/en/guide/local-preset-development",
      },
      { text: "Extending Jue", link: "/en/guide/extensions" },
      { text: "Integration Guide", link: "/en/guide/integration" },
    ],
  },
];

const enArchitectureSidebar = [
  {
    text: "Architecture",
    items: [
      { text: "Overview", link: "/en/architecture/" },
      {
        text: "Adapter Standardization",
        link: "/en/architecture/adapter-standardization",
      },
    ],
  },
  {
    text: "Specifications",
    items: [
      { text: "Specification Index", link: "/en/specs/" },
      { text: "Jue MVP", link: "/en/specs/jue-mvp" },
      { text: "Canonical Model", link: "/en/specs/canonical-model" },
      { text: "Capability Source", link: "/en/specs/capability-source" },
      {
        text: "Codex / Claude Code Adapter",
        link: "/en/specs/codex-claude-code-adapters",
      },
    ],
  },
  {
    text: "Agent Support",
    items: [
      { text: "Support Profiles", link: "/en/agents/" },
      { text: "Claude Code", link: "/en/agents/claude-code" },
      { text: "Codex", link: "/en/agents/codex" },
      { text: "Cursor", link: "/en/agents/cursor" },
      { text: "OpenClaw", link: "/en/agents/openclaw" },
      { text: "Hermes", link: "/en/agents/hermes" },
    ],
  },
];

const enReferenceSidebar = [
  {
    text: "CLI",
    items: [
      { text: "Command Overview", link: "/en/reference/cli/" },
      { text: "Core Workflow", link: "/en/reference/cli/workflow" },
      { text: "Capability", link: "/en/reference/cli/capability" },
      { text: "Preset", link: "/en/reference/cli/preset" },
      { text: "Extension", link: "/en/reference/cli/extension" },
    ],
  },
  {
    text: "Configuration and API",
    items: [
      { text: "Overview", link: "/en/reference/" },
      {
        text: "Project Configuration",
        link: "/en/reference/project-config",
      },
      { text: "Preset Manifest", link: "/en/reference/preset-manifest" },
      { text: "Extension API", link: "/en/reference/extension-api" },
      { text: "Glossary", link: "/en/reference/glossary" },
    ],
  },
];

const enDeveloperSidebar = [
  {
    text: "Developer",
    items: [
      { text: "Overview", link: "/en/developer/" },
      {
        text: "Documentation Contract",
        link: "/en/developer/documentation-contract",
      },
      {
        text: "Implementation Status",
        link: "/en/developer/implementation-status",
      },
      { text: "Roadmap", link: "/en/developer/roadmap" },
      { text: "Delivery Plan", link: "/en/developer/delivery-plan" },
    ],
  },
  {
    text: "RFCs",
    items: [
      { text: "RFC Index", link: "/en/developer/rfcs/" },
      {
        text: "RFC-0001 Minimal Conversion Model",
        link: "/en/developer/rfcs/0001-minimal-conversion-model",
      },
      {
        text: "RFC-0002 Plugin Artifact apply",
        link: "/en/developer/rfcs/0002-plugin-artifact-apply",
      },
      {
        text: "RFC-0003 Apply Scope and Target Root",
        link: "/en/developer/rfcs/0003-apply-scope-target-root",
      },
    ],
  },
];

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "Jue",
    titleTemplate: ":title · Jue",
    description: "AI capability standardization and Agent adapter platform",
    lang: "zh-CN",
    sitemap: {
      hostname: "https://jue.zenheart.site",
    },
    head: [
      ["link", { rel: "icon", href: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23111411%22/><path d=%22M16 16h12v6h-6v6h-6V16zm20 0h12v12h-6v-6h-6v-6zM16 36h6v6h6v6H16V36zm26 0h6v12H36v-6h6v-6z%22 fill=%22%23c0db42%22/></svg>" }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: "Jue" }],
      ["meta", { property: "og:title", content: "Jue — Define once. Adapt everywhere." }],
      ["meta", { property: "og:description", content: "Standardize AI capabilities and adapt them to every Agent." }],
      ["meta", { property: "og:image", content: "https://jue.zenheart.site/og.png" }],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:image", content: "https://jue.zenheart.site/og.png" }],
    ],
    locales: {
      root: {
        label: "简体中文",
        lang: "zh",
        description: "AI 能力标准化与 Agent 适配层",
        themeConfig: {
          nav: [
            { text: "首页", link: "/" },
            { text: "指南", link: "/guide/getting-started" },
            { text: "架构", link: "/architecture/" },
            { text: "参考", link: "/reference/" },
            { text: "开发者", link: "/developer/" },
          ],
          sidebar: {
            "/guide/": zhGuideSidebar,
            "/architecture/": zhArchitectureSidebar,
            "/specs/": zhArchitectureSidebar,
            "/agents/": zhArchitectureSidebar,
            "/reference/": zhReferenceSidebar,
            "/developer/": zhDeveloperSidebar,
          },
        },
      },
      en: {
        label: "English",
        lang: "en",
        description: "AI capability standardization and Agent adaptation",
        link: "/en/",
        themeConfig: {
          nav: [
            { text: "Home", link: "/en/" },
            { text: "Guide", link: "/en/guide/getting-started" },
            { text: "Architecture", link: "/en/architecture/" },
            { text: "Reference", link: "/en/reference/" },
            { text: "Developer", link: "/en/developer/" },
          ],
          sidebar: {
            "/en/guide/": enGuideSidebar,
            "/en/architecture/": enArchitectureSidebar,
            "/en/specs/": enArchitectureSidebar,
            "/en/agents/": enArchitectureSidebar,
            "/en/reference/": enReferenceSidebar,
            "/en/developer/": enDeveloperSidebar,
          },
        },
      },
    },
    themeConfig: {
      logo: {
        src: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect width=%2240%22 height=%2240%22 rx=%229%22 fill=%22%23111411%22/><path d=%22M9 9h9v4h-5v5H9V9zm13 0h9v9h-4v-5h-5V9zM9 22h4v5h5v4H9v-9zm18 0h4v9h-9v-4h5v-5z%22 fill=%22%23c0db42%22/></svg>",
        alt: "Jue",
      },
      search: {
        provider: "local",
      },
      socialLinks: [
        { icon: "github", link: "https://github.com/zenHeart/ai-jue" },
      ],
      footer: {
        message: "Define once. Adapt everywhere.",
        copyright: "Released under the MIT License.",
      },
    },
    mermaid: {
      // 参考 https://mermaid.js.org/config/getting-started.html#mermaidapi-configuration-defaults
      // scale: 1, // 控制图表缩放，可以调整以适应页面
      // 其他任何 Mermaid 配置
    },
  }),
);
