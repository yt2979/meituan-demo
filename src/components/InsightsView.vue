<script setup>
import { ref, computed } from "vue";
import { Info, ArrowRight } from "lucide-vue-next";
import Illustration from "./Illustration.vue";
import { aggregateInsights, findPattern } from "../data";
const props = defineProps({ records: Array, examples: Boolean });
defineEmits(["record"]);
const days = ref(7),
  point = ref(null);
const insights = computed(() => aggregateInsights(props.records, days.value));
const coords = computed(() =>
  insights.value.trend.map((p, i) => ({
    ...p,
    x: 78 + (i / (days.value - 1)) * 694,
    y: p.value === null ? null : 190 - (p.value - 1) * 38,
  })),
);
const segments = computed(() => {
  const all = [];
  let run = [];
  for (const p of coords.value) {
    if (p.value === null) {
      if (run.length) all.push(run);
      run = [];
    } else run.push(p);
  }
  if (run.length) all.push(run);
  return all;
});
function path(segment) {
  return segment.map((p) => `${p.x},${p.y}`).join(" ");
}
const overallCount = computed(
  () => insights.value.selected.filter((r) => r.overall !== null).length,
);
const periodPattern = computed(() => findPattern(insights.value.selected));
</script>
<template>
  <div class="inner-page insights-view page-enter">
    <header class="page-title-row">
      <div>
        <p class="eyebrow">慢慢发现，关于自己的小线索</p>
        <h1>我的情绪洞察</h1>
        <p class="muted">不是评判自己，而是多一点理解。</p>
      </div>
      <Illustration kind="plant" />
    </header>
    <div v-if="examples" class="example-notice">
      <Info :size="15" />
      <p>正在展示示例记录的变化。你的发现，会从每一次真实记录中慢慢生长。</p>
    </div>
    <section class="insight-pattern">
      <div class="insight-pattern-art"><Illustration kind="plant" /></div>
      <div>
        <span class="small-note">最近发现的一个规律</span>
        <h3>{{ periodPattern }}</h3>
        <p>
          {{
            insights.selected.length >= 3
              ? "只是一个值得留意的线索，不代表因果关系。"
              : "不着急，了解自己也需要一点时间。"
          }}
        </p>
      </div>
    </section>
    <section class="trend-section">
      <div class="section-heading">
        <div>
          <h2>最近的状态变化</h2>
          <p class="muted">每个点，是当天整体状态的平均值。</p>
        </div>
        <div class="segmented" aria-label="洞察时间范围">
          <button
            v-for="n in [7, 30]"
            :key="n"
            :class="{ active: days === n }"
            :aria-pressed="days === n"
            @click="
              days = n;
              point = null;
            "
          >
            最近 {{ n }} 天
          </button>
        </div>
      </div>
      <div v-if="overallCount" class="trend-chart">
        <svg
          viewBox="0 0 820 238"
          role="img"
          aria-labelledby="chart-title chart-desc"
        >
          <title id="chart-title">最近{{ days }}天整体状态趋势</title>
          <desc id="chart-desc">
            整体状态由用户独立选择，从很糟糕到很好；不使用情绪强度。没有记录的日期保留空白。{{
              coords
                .filter((p) => p.value !== null)
                .map((p) => `${p.label}：${p.emotions.join("、")}`)
                .join("；")
            }}
          </desc>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop stop-color="#b6c7a4" stop-opacity=".24" />
              <stop offset="1" stop-color="#b6c7a4" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g
            v-for="(label, i) in ['状态较好', '平稳', '状态较低']"
            :key="label"
          >
            <text x="0" :y="44 + i * 76" class="chart-axis">{{ label }}</text>
            <line
              x1="78"
              x2="786"
              :y1="38 + i * 76"
              :y2="38 + i * 76"
              stroke="#e9e9de"
              stroke-dasharray="3 5"
            />
          </g>
          <g v-for="(p, i) in coords" :key="p.date">
            <line
              v-if="days === 7 || i % 5 === 0"
              :x1="p.x"
              :x2="p.x"
              y1="32"
              y2="198"
              stroke="#f1efe7"
            />
            <text
              v-if="days === 7 || i % 5 === 0 || i === days - 1"
              :x="p.x"
              y="225"
              text-anchor="middle"
              class="chart-axis"
            >
              {{ i === days - 1 ? "今天" : p.label }}
            </text>
          </g>
          <g v-for="(segment, i) in segments" :key="i">
            <polygon
              v-if="segment.length > 1"
              :points="`${segment[0].x},198 ${path(segment)} ${segment.at(-1).x},198`"
              fill="url(#trend-fill)"
            />
            <polyline
              :points="path(segment)"
              fill="none"
              stroke="#90aa83"
              stroke-width="2.4"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </g>
          <g v-for="p in coords.filter((p) => p.value !== null)" :key="p.date">
            <circle
              :cx="p.x"
              :cy="p.y"
              r="6"
              fill="#8ca67d"
              stroke="#fffdf7"
              stroke-width="2"
            />
            <circle
              :cx="p.x"
              :cy="p.y"
              r="14"
              fill="transparent"
              tabindex="0"
              role="button"
              :aria-label="`${p.label}，${p.emotions.join('、')}，整体状态${p.value.toFixed(1)}`"
              @mouseenter="point = p"
              @mouseleave="point = null"
              @focus="point = p"
              @blur="point = null"
              @click="point = point?.date === p.date ? null : p"
              @keydown.enter.prevent="point = p"
              @keydown.space.prevent="point = p"
            />
          </g>
        </svg>
        <div class="chart-legend" aria-live="polite">
          <span v-if="point"
            >{{ point.label }} · {{ point.emotions.join("、") }}
            <span>整体状态 {{ point.value.toFixed(1) }} / 5</span></span
          ><span v-else
            ><span class="legend-dot"></span> 整体状态
            <span>留白的日子没有记录，也没关系。</span></span
          >
        </div>
      </div>
      <div v-else class="chart-empty">
        <Illustration kind="leaf" />
        <p>
          还没有记录整体状态。<br /><span
            >下次记录时，选一选“你现在感觉怎么样”。</span
          >
        </p>
        <button class="text-button" @click="$emit('record')">
          记录此刻 <ArrowRight :size="13" />
        </button>
      </div>
      <p class="chart-note">
        <Info :size="12" /> 情绪强度只表示感受的强烈程度，不用于判断状态好坏。
      </p>
    </section>
    <div class="insight-columns">
      <section class="factor-insight">
        <h2>最近常影响你的事情</h2>
        <p class="muted">看看感受，常常和什么一起出现。</p>
        <div v-if="insights.topFactors.length" class="factor-bars">
          <div
            v-for="f in insights.topFactors.slice(0, 5)"
            :key="f.name"
            class="factor-bar-row"
          >
            <span>{{ f.name }}</span>
            <div class="bar-track">
              <span :style="{ width: f.percentage + '%' }"></span>
            </div>
            <span>{{ f.percentage }}%</span>
          </div>
        </div>
        <p v-else class="small-empty">下一次记录时，可以选一选影响你的事情。</p>
        <p v-if="insights.topFactors.length" class="small-note">
          占这段时间记录的比例，一次可以有多个因素。
        </p>
      </section>
      <section class="action-insight">
        <h2>什么对你比较有帮助</h2>
        <p class="muted">听听行动后，你自己的感受。</p>
        <div v-if="insights.actions.length" class="helpful-actions">
          <div v-for="a in insights.actions" :key="a.id" class="helpful-action">
            <div :class="['helpful-action-art', a.kind]">
              <Illustration :kind="a.kind" />
            </div>
            <div>
              <h4>{{ a.title }}</h4>
              <p>
                进行 {{ a.count }} 次
                <span v-if="a.feedbackCount"
                  >· {{ a.helped }} 次轻松了一些</span
                >
              </p>
            </div>
            <span class="helpfulness">{{ a.label }}</span>
          </div>
        </div>
        <p v-else class="small-empty">
          试过一个小行动后，你的反馈就会出现在这里。
        </p>
      </section>
    </div>
    <p class="page-end-note">不需要每天都很好，每一天的你都值得被照顾。</p>
  </div>
</template>
