import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

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
            { text: "架构", link: "/guide/architecture" },
          ],
          sidebar: [
            {
              text: "介绍",
              items: [
                { text: "什么是 ai-jue?", link: "/guide/what-is-ai-jue" },
                { text: "快速上手", link: "/guide/getting-started" },
                { text: "配置规整", link: "/guide/format" },
                { text: "配置指南", link: "/guide/configuration-guide" },
                { text: "官方预设", link: "/guide/presets" },
              ],
            },
            {
              text: "开发",
              items: [
                { text: "架构", link: "/guide/architecture" },
                { text: "MVP 规范", link: "/specs/jue-mvp" },
                { text: "创建预设", link: "/guide/creating-a-preset" },
                {
                  text: "适配器标准化",
                  link: "/guide/adapter-standardization",
                },
                { text: "与脚手架集成", link: "/guide/integration" },
              ],
            },
          ],
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
            { text: "Architecture", link: "/en/guide/architecture" },
          ],
          sidebar: [
            {
              text: "Introduction",
              items: [
                { text: "What is ai-jue?", link: "/en/guide/what-is-ai-jue" },
                { text: "Getting Started", link: "/en/guide/getting-started" },
                { text: "Configuration Normalization", link: "/en/guide/format" },
                {
                  text: "Configuration Guide",
                  link: "/en/guide/configuration-guide",
                },
                { text: "Official Presets", link: "/en/guide/presets" },
              ],
            },
            {
              text: "Development",
              items: [
                { text: "Architecture", link: "/en/guide/architecture" },
                {
                  text: "Creating a Preset",
                  link: "/en/guide/creating-a-preset",
                },
                {
                  text: "Adapter Standardization",
                  link: "/en/guide/adapter-standardization",
                },
                { text: "Integration Guide", link: "/en/guide/integration" },
              ],
            },
          ],
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
