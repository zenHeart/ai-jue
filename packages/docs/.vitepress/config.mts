import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "ai-jue",
    description: "AI 配置的终极解决方案",
    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
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
            { text: "适配器标准化", link: "/guide/adapter-standardization" },
            { text: "与脚手架集成", link: "/guide/integration" },
          ],
        },
      ],

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
