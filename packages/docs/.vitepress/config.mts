import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    locales: {
      root: {
        label: "简体中文",
        lang: "zh",
        description: "AI 配置的终极解决方案",
        themeConfig: {
          nav: [
            { text: "首页", link: "/" },
            { text: "指南", link: "/guide/getting-started" },
          ],
          sidebar: [
            {
              text: "介绍",
              items: [
                { text: "什么是 ai-jue?", link: "/guide/what-is-ai-jue" },
                { text: "快速上手", link: "/guide/getting-started" },
                { text: "配置指南", link: "/guide/configuration-guide" },
                { text: "官方预设", link: "/guide/presets" },
              ],
            },
            {
              text: "开发",
              items: [
                { text: "架构", link: "/guide/architecture" },
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
        description: "The Ultimate AI Configuration Solution",
        link: "/en/",
        themeConfig: {
          nav: [
            { text: "Home", link: "/en/" },
            { text: "Guide", link: "/en/guide/getting-started" },
          ],
          sidebar: [
            {
              text: "Introduction",
              items: [
                { text: "What is ai-jue?", link: "/en/guide/what-is-ai-jue" },
                { text: "Getting Started", link: "/en/guide/getting-started" },
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
      // Shared theme config
      socialLinks: [
        { icon: "github", link: "https://github.com/your-username/ai-jue" },
      ],
    },
    mermaid: {
      // 参考 https://mermaid.js.org/config/getting-started.html#mermaidapi-configuration-defaults
      // scale: 1, // 控制图表缩放，可以调整以适应页面
      // 其他任何 Mermaid 配置
    },
  }),
);
