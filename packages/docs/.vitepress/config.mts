import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ai-jue",
  description: "AI 配置的终极解决方案",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' }
    ],

    sidebar: [
      {
        text: '介绍',
        items: [
          { text: '什么是 ai-jue?', link: '/guide/what-is-ai-jue' },
          { text: '快速上手', link: '/guide/getting-started' },
          { text: '配置指南', link: '/guide/configuration-guide' }
        ]
      },
      {
        text: '开发',
        items: [
          { text: '创建预设', link: '/guide/creating-a-preset' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/ai-jue' }
    ]
  }
})
