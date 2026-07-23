<script setup lang="ts">
import { computed } from "vue";
import CapabilityFlow from "./CapabilityFlow.vue";

interface Props {
  locale?: "zh" | "en";
}

const props = withDefaults(defineProps<Props>(), {
  locale: "zh",
});

const copy = computed(() =>
  props.locale === "en"
    ? { lead: "Define once.", accent: "Adapt", tail: " everywhere." }
    : { lead: "定义一次。", accent: "适配", tail: "所有 Agent。" },
);
</script>

<template>
  <section
    class="reference-hero"
    :class="`locale-${props.locale}`"
    aria-labelledby="jue-home-title"
  >
    <span class="frame-corner frame-corner-tl" aria-hidden="true"></span>
    <span class="frame-corner frame-corner-tr" aria-hidden="true"></span>
    <span class="frame-corner frame-corner-bl" aria-hidden="true"></span>
    <span class="frame-corner frame-corner-br" aria-hidden="true"></span>

    <div class="reference-grid" aria-hidden="true"></div>

    <div class="reference-copy">
      <p class="reference-wordmark" translate="no">JUE</p>
      <span class="wordmark-rule" aria-hidden="true"></span>
      <h1 id="jue-home-title" class="reference-title">
        <span>{{ copy.lead }}</span>
        <span><em>{{ copy.accent }}</em><span class="reference-title-tail">{{ copy.tail }}</span></span>
      </h1>
    </div>

    <CapabilityFlow class="reference-flow" />
  </section>
</template>

<style scoped>
.reference-hero {
  position: relative;
  display: grid;
  width: 100%;
  height: clamp(720px, 52.36vw, calc(100svh - var(--vp-nav-height)));
  grid-template-columns: 46% 54%;
  overflow: hidden;
  isolation: isolate;
  color: #f5f1e8;
  background:
    radial-gradient(circle at 20% 42%, rgba(33, 42, 43, 0.22), transparent 34%),
    radial-gradient(circle at 70% 44%, rgba(31, 50, 49, 0.13), transparent 38%),
    #101417;
  border: 1px solid rgba(227, 233, 229, 0.16);
}

.reference-hero::before {
  position: absolute;
  z-index: 4;
  inset: 28px;
  content: "";
  border: 1px solid rgba(227, 233, 229, 0.14);
  pointer-events: none;
}

.reference-grid {
  position: absolute;
  z-index: -1;
  top: 0;
  right: 0;
  bottom: 0;
  left: 46%;
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(222, 230, 226, 0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgba(222, 230, 226, 0.55) 1px, transparent 1px);
  background-size: 112px 112px;
  mask-image: linear-gradient(90deg, transparent 0, #000 14%, #000 100%);
}

.reference-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: flex-start;
  padding: clamp(90px, 7vw, 130px) clamp(48px, 5.2vw, 90px);
}

.reference-wordmark {
  margin: 0;
  color: #f5f1e8;
  font-size: clamp(146px, 18vw, 292px);
  font-weight: 760;
  line-height: 0.78;
  letter-spacing: -0.085em;
}

.wordmark-rule {
  width: 155px;
  height: 6px;
  margin: 38px 0 44px;
  background: #c5df3d;
}

.reference-title {
  display: grid;
  gap: 4px;
  margin: 0;
  color: #f5f1e8;
  font-size: clamp(46px, 4.7vw, 82px);
  font-weight: 390;
  line-height: 1.04;
  letter-spacing: -0.052em;
  text-wrap: balance;
}

.reference-title em {
  color: #c5df3d;
  font-style: normal;
}

.reference-title-tail {
  display: inline;
}

.reference-flow {
  min-width: 0;
}

.frame-corner {
  position: absolute;
  z-index: 5;
  width: 22px;
  height: 22px;
  pointer-events: none;
}

.frame-corner::before,
.frame-corner::after {
  position: absolute;
  content: "";
  background: rgba(230, 235, 231, 0.46);
}

.frame-corner::before {
  top: 10px;
  left: 0;
  width: 22px;
  height: 1px;
}

.frame-corner::after {
  top: 0;
  left: 10px;
  width: 1px;
  height: 22px;
}

.frame-corner-tl { top: 16px; left: 16px; }
.frame-corner-tr { top: 16px; right: 16px; }
.frame-corner-bl { bottom: 16px; left: 16px; }
.frame-corner-br { right: 16px; bottom: 16px; }

@media (max-width: 1100px) {
  .reference-hero {
    height: auto;
    min-height: 1120px;
    grid-template-columns: 1fr;
  }

  .reference-grid {
    top: 48%;
    left: 0;
    mask-image: linear-gradient(180deg, transparent 0, #000 16%, #000 100%);
  }

  .reference-copy {
    padding-bottom: 18px;
  }

  .reference-wordmark {
    font-size: clamp(150px, 28vw, 260px);
  }

  .reference-flow {
    height: 590px;
  }
}

@media (max-width: 720px) {
  .reference-hero {
    height: max(680px, calc(100svh - var(--vp-nav-height)));
    min-height: 680px;
    grid-template-columns: 1fr;
  }

  .reference-grid {
    inset: 0;
    opacity: 0.08;
    mask-image: none;
  }

  .reference-copy {
    z-index: 1;
    justify-content: center;
    padding: 56px 32px;
  }

  .reference-wordmark {
    font-size: clamp(112px, 39vw, 180px);
  }

  .wordmark-rule {
    width: 100px;
    height: 4px;
    margin: 44px 0 32px;
  }

  .reference-title {
    font-size: clamp(38px, 10.5vw, 54px);
  }

  .locale-en .reference-title-tail {
    display: block;
  }

  .reference-flow {
    position: absolute;
    z-index: 0;
    inset: 0;
    height: 100%;
    min-height: 0;
    opacity: 0.24;
    pointer-events: none;
  }

  .reference-flow :deep(.connector-map),
  .reference-flow :deep(.agent-list) {
    display: none;
  }

  .reference-flow :deep(.canonical-stack) {
    top: 42%;
    left: 25%;
    width: 70%;
    height: 46%;
    transform: rotate(-4deg);
  }
}

@media (max-width: 420px) {
  .reference-copy {
    padding-inline: 28px;
  }
}
</style>
