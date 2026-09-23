<script setup>
import {
  ArrowRight,
  ChevronRight,
  Check,
  Heart,
  LockKeyhole,
} from "lucide-vue-next";
import Illustration from "./Illustration.vue";
import MoodFace from "./MoodFace.vue";
import { moods, emotions, findPattern, localDay } from "../data";
defineProps({
  records: Array,
  examples: Boolean,
  hideNotes: Boolean,
  name: String,
});
defineEmits(["record", "care", "navigate", "detail"]);
const date = new Date().toLocaleDateString("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "long",
});
function time(r) {
  return `${localDay(r.createdAt) === localDay(new Date()) ? "今天" : new Date(r.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} ${new Date(r.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
}
</script>
<template>
  <div class="home-view page-enter">
    <div class="date-line">
      <span>{{ date }}</span
      ><span class="little-sun">☀</span>
    </div>
    <header class="home-greeting">
      <div class="greeting-copy">
        <p class="eyebrow">留一点时间，给自己</p>
        <h2>
          {{ name && name !== "亲爱的你" ? name + "，" : "你好，"
          }}<br />今天也辛苦了<span class="greeting-flower">✳</span>
        </h2>
        <p class="muted">无论此刻发生了什么，这都是一个可以停下来的地方。</p>
      </div>
      <div class="greeting-art">
        <Illustration kind="plant" />
        <div class="paper-note">
          <Heart :size="13" />
          <p>照顾好自己的情绪，<br />也是一种进步。</p>
          <span>慢慢来，就很好</span>
        </div>
      </div>
    </header>
    <section class="mood-panel" aria-labelledby="mood-title">
      <div class="section-heading">
        <div>
          <h1 id="mood-title">你现在感觉怎么样？</h1>
          <p class="muted">不需要想得太多，选一个最接近的感受就好。</p>
        </div>
        <span class="small-note">每一种感受，都值得被看见</span>
      </div>
      <div class="mood-options">
        <button
          v-for="mood in moods"
          :key="mood.value"
          class="mood-choice"
          @click="$emit('record', mood.value)"
        >
          <MoodFace :tone="mood.value" /><span>{{ mood.name }}</span>
        </button>
      </div>
      <div class="mood-panel-foot">
        <LockKeyhole :size="12" /><span>这是只属于你的情绪空间</span>
      </div>
    </section>
    <div class="home-support-grid">
      <section class="care-home">
        <h3>给自己一点时间 <span class="tiny-leaf">⌁</span></h3>
        <div class="care-home-inner">
          <div class="care-art"><Illustration kind="leaf" /></div>
          <div class="care-home-copy">
            <span class="small-note">一个小小的停顿</span>
            <h4>2 分钟 · 节律呼吸</h4>
            <p>让身体慢下来，感受当下。</p>
          </div>
          <button class="button primary small" @click="$emit('care')">
            开始 <ArrowRight :size="15" />
          </button>
        </div>
      </section>
      <section class="discovery-home">
        <div class="section-heading">
          <h3>最近的一个发现</h3>
          <span v-if="examples" class="example-label">示例</span>
        </div>
        <button class="discovery-link" @click="$emit('navigate', 'insights')">
          <div class="sun-art"><Illustration kind="sun" /></div>
          <p>{{ findPattern(records) }}</p>
          <ChevronRight :size="18" />
        </button>
      </section>
    </div>
    <section class="recent-section">
      <div class="section-heading">
        <h3>
          最近的记录 <span v-if="examples" class="example-label">示例记录</span>
        </h3>
        <button class="text-button" @click="$emit('navigate', 'journal')">
          查看全部 <ArrowRight :size="14" />
        </button>
      </div>
      <button
        v-for="record in records.slice(0, 2)"
        :key="record.id"
        class="recent-row"
        @click="$emit('detail', record)"
      >
        <MoodFace
          :tone="emotions.find((e) => e.name === record.primaryMood)?.tone"
          small
        />
        <div class="recent-copy">
          <div class="recent-meta">
            <span>{{ record.primaryMood }}</span
            ><span class="record-date">{{ time(record) }}</span
            ><span class="recent-factors">{{
              record.factors.join(" · ")
            }}</span>
          </div>
          <p>
            {{
              hideNotes
                ? "日记内容已隐藏"
                : record.note || "今天也有认真听见自己的感受。"
            }}
          </p>
        </div>
        <span v-if="record.actionCompleted" class="care-done"
          ><Check :size="13" /> 已照顾自己</span
        ><ChevronRight :size="16" class="muted" />
      </button>
      <div v-if="!records.length" class="empty-home">
        <Illustration kind="leaf" />
        <p>
          你的第一篇情绪日记，从此刻开始。<br /><span class="muted"
            >点一点上面的感受，给自己一个温柔的回应。</span
          >
        </p>
      </div>
    </section>
    <footer class="home-footer">
      <span class="fine-line"></span>
      <p>慢一点，也没关系。你已经在认真生活了 <Heart :size="12" /></p>
      <span class="fine-line"></span>
    </footer>
  </div>
</template>
