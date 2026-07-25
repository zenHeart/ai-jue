<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";

const agents = ["Agent", "Agent", "Agent", "Agent"];

const flowRef = ref<HTMLElement | null>(null);
const sourceRef = ref<HTMLElement | null>(null);
const agentCardRefs: (HTMLElement | null)[] = [];

const ready = ref(false);
const viewBox = reactive({ width: 920, height: 760 });
const sourcePoint = reactive({ x: 0, y: 0 });
const targetPoints = reactive(
  agents.map(() => ({ x: 0, y: 0 })),
);

function setAgentCardRef(el: Element | null, index: number) {
  agentCardRefs[index] = (el as HTMLElement) ?? null;
}

// Elbow routing (horizontal -> diagonal -> horizontal) derived from the
// live source/target points, so the connectors always land exactly on the
// dots regardless of container size. Hardcoding pixel coordinates here
// previously assumed a fixed 920x760 layout, which drifted out of sync
// with the agent cards' fixed-px grid whenever the container was taller
// or shorter than that assumption (see the misaligned lines this replaces).
function buildPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = tx - sx;
  const bendX = sx + Math.max(24, dx * 0.34);
  const stub = Math.min(70, Math.max(24, dx * 0.16));
  const approachX = tx - stub;
  return `M${sx} ${sy} H${bendX} L${approachX} ${ty} H${tx}`;
}

function measure() {
  const container = flowRef.value;
  const source = sourceRef.value;
  if (!container || !source) return;

  const containerRect = container.getBoundingClientRect();
  if (containerRect.width === 0 || containerRect.height === 0) return;

  viewBox.width = containerRect.width;
  viewBox.height = containerRect.height;

  const sourceRect = source.getBoundingClientRect();
  sourcePoint.x = sourceRect.right - containerRect.left;
  sourcePoint.y = sourceRect.top + sourceRect.height / 2 - containerRect.top;

  agentCardRefs.forEach((el, index) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    targetPoints[index].x = rect.left - containerRect.left;
    targetPoints[index].y = rect.top + rect.height / 2 - containerRect.top;
  });

  ready.value = true;
}

let observer: ResizeObserver | undefined;

onMounted(() => {
  measure();
  observer = new ResizeObserver(() => measure());
  if (flowRef.value) observer.observe(flowRef.value);
  window.addEventListener("resize", measure);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener("resize", measure);
});
</script>

<template>
  <div
    ref="flowRef"
    class="capability-flow"
    role="img"
    aria-label="One Jue capability set branches into four Agent adapters"
  >
    <svg
      class="connector-map"
      :class="{ 'connector-map-ready': ready }"
      :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        v-for="(point, index) in targetPoints"
        :key="`path-${index}`"
        :d="buildPath(sourcePoint.x, sourcePoint.y, point.x, point.y)"
      />
      <rect
        :x="sourcePoint.x - 8"
        :y="sourcePoint.y - 8"
        width="16"
        height="16"
      />
      <rect
        v-for="(point, index) in targetPoints"
        :key="`dot-${index}`"
        :x="point.x - 8"
        :y="point.y - 8"
        width="16"
        height="16"
      />
    </svg>

    <div class="canonical-stack" aria-hidden="true">
      <span class="stack-plane stack-plane-back"></span>
      <span class="stack-plane stack-plane-middle"></span>
      <span ref="sourceRef" class="stack-plane stack-plane-front">
        <span class="focus-mark"><i></i></span>
      </span>
    </div>

    <ol class="agent-list" aria-hidden="true">
      <li
        v-for="(agent, index) in agents"
        :key="index"
        class="agent-card"
        :ref="(el) => setAgentCardRef(el as Element | null, index)"
      >
        <span class="agent-mark"><i></i></span>
        <strong>{{ agent }}</strong>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.capability-flow {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 660px;
}

.connector-map {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: visible;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.connector-map-ready {
  opacity: 1;
}

.connector-map path {
  fill: none;
  stroke: #c5df3d;
  stroke-width: 1.35;
  vector-effect: non-scaling-stroke;
}

.connector-map rect {
  fill: #c5df3d;
}

.canonical-stack {
  position: absolute;
  z-index: 1;
  top: 20%;
  left: 0;
  width: 42%;
  height: 55%;
}

.stack-plane {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(221, 229, 219, 0.27);
  background:
    linear-gradient(rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0.018)),
    rgba(15, 19, 20, 0.58);
  clip-path: polygon(13% 0, 100% 0, 100% 80%, 87% 100%, 0 100%, 0 13%);
}

.stack-plane::after,
.agent-card::after {
  position: absolute;
  inset: 0;
  content: "";
  opacity: 0.13;
  background-image: radial-gradient(rgba(224, 233, 228, 0.6) 0.7px, transparent 0.7px);
  background-size: 5px 5px;
  pointer-events: none;
}

.stack-plane-back {
  transform: translate(9%, -10%);
  opacity: 0.46;
}

.stack-plane-middle {
  transform: translate(4.5%, -5%);
  opacity: 0.68;
}

.stack-plane-front {
  display: grid;
  width: 66%;
  height: 43%;
  place-items: center;
  inset: 28% auto auto 10%;
  background: #111617;
  border-color: rgba(220, 230, 223, 0.5);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.34);
}

.focus-mark,
.agent-mark {
  position: relative;
  display: block;
  width: 104px;
  height: 104px;
  color: #c5df3d;
  background:
    linear-gradient(currentColor, currentColor) 0 0 / 34% 4px no-repeat,
    linear-gradient(currentColor, currentColor) 0 0 / 4px 34% no-repeat,
    linear-gradient(currentColor, currentColor) 100% 0 / 34% 4px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 0 / 4px 34% no-repeat,
    linear-gradient(currentColor, currentColor) 0 100% / 34% 4px no-repeat,
    linear-gradient(currentColor, currentColor) 0 100% / 4px 34% no-repeat,
    linear-gradient(currentColor, currentColor) 100% 100% / 34% 4px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 100% / 4px 34% no-repeat;
}

.focus-mark i,
.agent-mark i {
  position: absolute;
  inset: 37%;
  display: block;
  background: currentColor;
  box-shadow: 0 0 24px rgba(197, 223, 61, 0.24);
}

.agent-list {
  position: absolute;
  z-index: 3;
  top: 4%;
  right: 4%;
  display: grid;
  width: 28.5%;
  gap: 42px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.agent-card {
  position: relative;
  display: grid;
  height: 118px;
  grid-template-columns: 72px 1fr;
  align-items: center;
  padding: 0 28px;
  overflow: hidden;
  color: #f5f2e9;
  background: rgba(15, 21, 23, 0.9);
  border: 1px solid #4bb8df;
  clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px);
}

.agent-card strong {
  position: relative;
  z-index: 1;
  font-size: clamp(22px, 2vw, 34px);
  font-weight: 440;
  letter-spacing: -0.03em;
}

.agent-mark {
  z-index: 1;
  width: 48px;
  height: 48px;
  color: #4bb8df;
  background:
    linear-gradient(currentColor, currentColor) 0 0 / 34% 2px no-repeat,
    linear-gradient(currentColor, currentColor) 0 0 / 2px 34% no-repeat,
    linear-gradient(currentColor, currentColor) 100% 0 / 34% 2px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 0 / 2px 34% no-repeat,
    linear-gradient(currentColor, currentColor) 0 100% / 34% 2px no-repeat,
    linear-gradient(currentColor, currentColor) 0 100% / 2px 34% no-repeat,
    linear-gradient(currentColor, currentColor) 100% 100% / 34% 2px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 100% / 2px 34% no-repeat;
}

.agent-mark i {
  display: none;
}

@media (max-width: 1100px) {
  .capability-flow {
    min-height: 560px;
  }

  .agent-list {
    gap: 24px;
  }

  .agent-card {
    height: 88px;
    grid-template-columns: 52px 1fr;
    padding: 0 18px;
  }

  .agent-mark {
    width: 38px;
    height: 38px;
  }
}

@media (max-width: 720px) {
  .capability-flow {
    min-height: 510px;
  }

  .canonical-stack {
    top: 10%;
    left: 25%;
    width: 50%;
    height: 45%;
  }

  .connector-map {
    display: none;
  }

  .agent-list {
    top: auto;
    right: 5%;
    bottom: 0;
    width: 90%;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .agent-card {
    height: 72px;
  }
}
</style>
