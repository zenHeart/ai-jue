---
layout: home

title: Jue — 定义一次，适配所有 Agent
titleTemplate: false

hero:
  name: "JUE"
  text: "定义一次，适配所有 Agent"
  tagline: 把 skills、agents、hooks、MCP、rules 与 commands 组织成通用能力集，再由 Adapter 转换为每个 Agent 的原生体验。
  actions:
    - theme: brand
      text: 3 分钟接入
      link: /guide/getting-started
    - theme: alt
      text: 理解 Jue
      link: /guide/what-is-ai-jue
    - theme: alt
      text: GitHub
      link: https://github.com/zenHeart/ai-jue

features:
  - icon: "01"
    title: 通用能力标准
    details: 用一套稳定的 canonical model 描述上下文、技能、智能体、命令、规则、钩子与 MCP。
  - icon: "02"
    title: Preset 能力集
    details: 把个人或团队最佳实践封装成可版本化、可组合、可分发的能力集，而不是复制散落配置。
  - icon: "03"
    title: Adapter 原生适配
    details: 同一份能力转换为 Claude、Cursor、Gemini 与 Copilot 的原生产物，差异和降级保持显式。
---

<div class="jue-home">

<section class="signal-strip" aria-label="Jue MVP status">
  <span><strong>8</strong> canonical capabilities</span>
  <span><strong>4</strong> production adapters</span>
  <span><strong>1</strong> source of truth</span>
</section>

<section class="home-section">
  <p class="eyebrow">ONE STANDARD, MANY AGENTS</p>
  <h2>能力属于你，不属于某个工具。</h2>
  <p class="section-lead">
    Jue 位于能力资产和具体 Agent 之间。你维护一份可审查的能力集，
    Jue 负责加载、合并、校验和适配。
  </p>

  <div class="flow-grid" aria-label="Jue capability flow">
    <article>
      <span class="flow-index">SOURCE</span>
      <h3>Preset / .ai</h3>
      <p>skills · agents · commands · rules · hooks · MCP</p>
    </article>
    <div class="flow-arrow" aria-hidden="true">→</div>
    <article class="flow-core">
      <span class="flow-index">STANDARD</span>
      <h3>Jue Canonical Model</h3>
      <p>load · merge · validate · normalize</p>
    </article>
    <div class="flow-arrow" aria-hidden="true">→</div>
    <article>
      <span class="flow-index">NATIVE</span>
      <h3>Agent Adapters</h3>
      <p>Claude · Cursor · Gemini · Copilot</p>
    </article>
  </div>
</section>

<section class="home-section split-section">
  <div>
    <p class="eyebrow">CAPABILITY SET</p>
    <h2>Preset 不是模板，是可运行的能力集合。</h2>
    <p class="section-lead">
      目标 Agent 可以把它叫做插件、扩展或 skills pack。Jue 在更高一层统一它们：
      内容由 Preset 持有，格式差异由 Adapter 吸收。
    </p>
    <a class="text-link" href="/guide/creating-a-preset">创建你的 Preset →</a>
  </div>
  <div class="code-window" aria-label="Preset directory example">
    <div class="code-window-bar"><span></span><span></span><span></span></div>
    <pre><code>jue-preset-team/
├── AGENTS.md
├── skills/
├── agents/
├── commands/
├── rules/
├── hooks/
└── tools/</code></pre>
  </div>
</section>

<section class="home-section">
  <p class="eyebrow">NATIVE OUTPUTS</p>
  <h2>统一输入，不牺牲目标 Agent 的原生体验。</h2>
  <div class="adapter-grid">
    <article><span class="adapter-mark">C</span><h3>Claude</h3><p>Skills、Agents、Rules、Hooks 与 MCP</p></article>
    <article><span class="adapter-mark">↗</span><h3>Cursor</h3><p>Rules、Commands、Skills、Agents 与 MCP</p></article>
    <article><span class="adapter-mark">G</span><h3>Gemini</h3><p>GEMINI.md、Commands、Skills 与 Settings</p></article>
    <article><span class="adapter-mark">∞</span><h3>Copilot</h3><p>Instructions、Prompts 与工具配置</p></article>
  </div>
</section>

<section class="home-section quickstart">
  <div>
    <p class="eyebrow">START SMALL</p>
    <h2>三步跑通你的第一个能力闭环。</h2>
  </div>
  <ol>
    <li><span>01</span><div><strong>初始化</strong><code>npx jue init</code></div></li>
    <li><span>02</span><div><strong>组合 Preset</strong><code>presets: ['base', 'my-team']</code></div></li>
    <li><span>03</span><div><strong>生成原生配置</strong><code>npx jue apply --all</code></div></li>
  </ol>
  <a class="cta-button" href="/guide/getting-started">开始使用 Jue</a>
</section>

</div>
