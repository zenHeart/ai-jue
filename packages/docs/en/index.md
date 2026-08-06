---
layout: home

title: Jue — Define once, adapt everywhere
titleTemplate: false
---

<HomeHero locale="en" />

<div class="jue-home">

<section class="signal-strip" aria-label="Jue MVP status">
  <span><strong>6</strong> atomic capabilities</span>
  <span><strong>5</strong> production adapters</span>
  <span><strong>1</strong> source of truth</span>
</section>

<section class="home-section">
  <p class="eyebrow">ONE STANDARD, MANY AGENTS</p>
  <h2>Your capabilities belong to you—not to one tool.</h2>
  <p class="section-lead">
    Jue sits between capability assets and concrete Agents. Maintain one reviewable
    capability set; Jue loads, merges, validates, and adapts it.
  </p>
  <div class="flow-grid" aria-label="Jue capability flow">
    <article><span class="flow-index">SOURCE</span><h3>Preset / .ai</h3><p>skills · agents · commands · rules · hooks · MCP</p></article>
    <div class="flow-arrow" aria-hidden="true">→</div>
    <article class="flow-core"><span class="flow-index">STANDARD</span><h3>Jue Canonical Model</h3><p>load · merge · validate · normalize</p></article>
    <div class="flow-arrow" aria-hidden="true">→</div>
    <article><span class="flow-index">NATIVE</span><h3>Agent Adapters</h3><p>Claude · Codex · Cursor · OpenClaw · Hermes</p></article>
  </div>
</section>

<section class="home-section split-section">
  <div>
    <p class="eyebrow">CAPABILITY SET</p>
    <h2>A Preset is not a template—it is a runnable capability set.</h2>
    <p class="section-lead">
      Target Agents may call it a plugin, extension, or skills pack. Jue unifies
      them one layer up: Presets hold content; Adapters absorb format differences.
    </p>
    <a class="text-link" href="/en/guide/creating-a-preset">Create your Preset →</a>
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
  <h2>One input, without sacrificing each Agent's native experience.</h2>
  <div class="adapter-grid">
    <article><span class="adapter-mark">C</span><h3>Claude</h3><p>Skills, Agents, Rules, Hooks, and MCP</p></article>
    <article><span class="adapter-mark">X</span><h3>Codex</h3><p>AGENTS.md, Skills, Agents, Hooks, and MCP</p></article>
    <article><span class="adapter-mark">Cu</span><h3>Cursor</h3><p>AGENTS.md, Rules, Skills, Subagents, Commands, Hooks, and MCP</p></article>
    <article><span class="adapter-mark">O</span><h3>OpenClaw</h3><p>AGENTS.md, Skills, Hooks, and MCP (workspace / compatible-bundle)</p></article>
    <article><span class="adapter-mark">H</span><h3>Hermes</h3><p>MEMORY.md, Skills, and MCP (workspace / skill-plugin)</p></article>
  </div>
</section>

<section class="home-section quickstart">
  <div><p class="eyebrow">START SMALL</p><h2>Run your first capability loop in three steps.</h2></div>
  <ol>
    <li><span>01</span><div><strong>Initialize</strong><code>npx jue init</code></div></li>
    <li><span>02</span><div><strong>Compose Presets</strong><code>presets: ['base', 'my-team']</code></div></li>
    <li><span>03</span><div><strong>Generate native outputs</strong><code>npx jue apply --all</code></div></li>
  </ol>
  <a class="cta-button" href="/en/guide/getting-started">Start with Jue</a>
</section>

</div>
