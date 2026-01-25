# 快速上手

## 安装

安装 `ai-jue` 和你需要的适配器：

```bash
npm install -g ai-jue-cli
npm install -g ai-jue-adapter-gemini ai-jue-adapter-claude
```

## 初始化

在你的项目根目录运行：

```bash
npx jue init
```

## 配置

这会在你的项目中创建一个 `ai.config.js` 文件。

```js
export default {
  preset: 'base', // 使用基础预设
  // ... 其他配置
}
```

## 应用

运行 apply 命令来生成 AI 配置文件：

```bash
npx jue apply
```
