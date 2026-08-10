# 本地开发一个 Preset

Preset 是普通 npm 包（见 [Preset npm 包约定](../reference/preset-manifest.md)）。
本地开发时把它指向源码目录，不需要先发布到 registry。

## 1. 用本地路径依赖代替发布

在消费项目里直接装本地目录：

```bash
npm install --save-dev /path/to/jue-preset-team
```

`npm` 会把它写成 `package.json` 里的一条 `file:` 依赖：

```json
{
  "devDependencies": {
    "jue-preset-team": "file:../jue-preset-team"
  }
}
```

`node_modules/jue-preset-team` 是指向源目录的符号链接，不是拷贝——改动
Preset 源文件立刻对消费项目生效，重跑 `jue apply` 就能看到最新内容，不需要
重新执行 `npm install`。

安装、升级、版本比较、发布和移除都是 npm/pnpm/yarn 的职责，Jue 不重复
这层能力；`ai.presets` 里写的名字最终解析到哪个来源，完全由消费方
`package.json` 的依赖声明决定。

## 2. 验证

`ai.config.js`：

```js
export default {
  presets: ["team"]
};
```

```bash
npx jue validate
npx jue apply --adapter claude --dry-run
```

`validate` 确认 Preset 能被解析；`apply --dry-run` 展示会写入的 Artifact
差异，不落盘。确认无误后去掉 `--dry-run` 正式写入。

## 3. Monorepo 内的多个本地 Preset

如果消费项目和多个 Preset 在同一个 npm workspaces monorepo 里
（`package.json` 声明 `"workspaces": ["presets/*"]`），跑一次
`npm install` 即可让所有 workspace 内的 Preset 自动以符号链接形式出现在
`node_modules` 里，不需要逐个 `npm install --save-dev`。

## 4. 本地覆盖远程

同一个 Preset 名字对应哪个来源，只由它在 `package.json` 依赖里写的
specifier 决定：

```json
{
  "devDependencies": {
    "jue-preset-team": "file:../jue-preset-team"
  }
}
```

把 specifier 换成已发布的版本号（如 `"^2.1.0"`）或 Git 引用，就切换成
远程来源。这是 npm 依赖解析的单一事实源语义，Jue 不做二次合并决策——不存在
"本地和远程同时生效、按规则择一"的情况。

## 5. 目前的限制

在 Preset 自己的目录里、没有一个引用它的消费项目时，还不能直接自检。
`jue validate` 今天验证的是消费项目的 `ai.config.js`，不是 Preset 本身；
搭一个上述最小消费项目是当前唯一路径。跳过这一步的
`jue preset validate <path-or-package>` 在 [Preset 作者命令](../reference/cli/preset.md)
里是规划中的目标形态，尚未实现。
