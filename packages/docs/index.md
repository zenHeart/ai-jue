---
layout: home

title: Jue — 定义一次，适配所有 Agent
titleTemplate: false
---

<HomeHero locale="zh" />

<div class="jue-home">

<section class="signal-strip" aria-label="Jue MVP 状态">
  <span><strong>6</strong> 个原子能力</span>
  <span><strong>5</strong> 个生产级 Adapter</span>
  <span><strong>1</strong> 份唯一事实源</span>
</section>

<section class="home-section">
  <p class="eyebrow">一个标准，所有 Agent</p>
  <h2>能力属于你，不属于某个工具。</h2>
  <p class="section-lead">
    Jue 位于能力资产和具体 Agent 之间。你维护一份可审查的能力集，
    Jue 负责加载、合并、校验和适配。
  </p>

  <div class="flow-grid" aria-label="Jue capability flow">
    <article>
      <span class="flow-index">来源</span>
      <h3>Preset / .ai</h3>
      <p>skills · agents · commands · rules · hooks · MCP</p>
    </article>
    <div class="flow-arrow" aria-hidden="true">→</div>
    <article class="flow-core">
      <span class="flow-index">标准</span>
      <h3>Jue Canonical Model</h3>
      <p>加载 · 合并 · 校验 · 规范化</p>
    </article>
    <div class="flow-arrow" aria-hidden="true">→</div>
    <article>
      <span class="flow-index">原生</span>
      <h3>Agent Adapters</h3>
      <p>Claude · Codex · Cursor · OpenClaw · Hermes</p>
    </article>
  </div>
</section>

<section class="home-section split-section">
  <div>
    <p class="eyebrow">能力集</p>
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
  <p class="eyebrow">原生产物</p>
  <h2>统一输入，不牺牲目标 Agent 的原生体验。</h2>
  <div class="adapter-grid">
    <article><span class="adapter-mark brand"><img src="/brands/claude.svg" alt="Claude" /></span><h3>Claude</h3><p>Skills、Agents、Rules、Hooks 与 MCP</p></article>
    <article><span class="adapter-mark brand"><img src="/brands/openai.svg" alt="Codex" /></span><h3>Codex</h3><p>AGENTS.md、Skills、Agents、Hooks 与 MCP</p></article>
    <article><span class="adapter-mark brand"><img src="/brands/cursor.svg" alt="Cursor" /></span><h3>Cursor</h3><p>AGENTS.md、Rules、Skills、Subagents、Commands、Hooks 与 MCP</p></article>
    <article><span class="adapter-mark">O</span><h3>OpenClaw</h3><p>AGENTS.md、Skills、Hooks 与 MCP（workspace / compatible-bundle）</p></article>
    <article><span class="adapter-mark">H</span><h3>Hermes</h3><p>MEMORY.md、Skills 与 MCP（workspace / skill-plugin）</p></article>
  </div>
</section>

<section class="home-section quickstart">
  <div>
    <p class="eyebrow">从小处开始</p>
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
