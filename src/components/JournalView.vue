<script setup>
import { ref, computed } from "vue";
import {
  Plus,
  Search,
  Check,
  ChevronRight,
  NotebookPen,
} from "lucide-vue-next";
import MoodFace from "./MoodFace.vue";
import Illustration from "./Illustration.vue";
import { emotions, groupRecords, careRecommendations } from "../data";
const props = defineProps({
  records: Array,
  examples: Boolean,
  hideNotes: Boolean,
});
defineEmits(["record", "detail"]);
const filter = ref("全部"),
  query = ref("");
const groups = computed(() =>
  groupRecords(
    props.records.filter(
      (r) =>
        (filter.value === "全部" || r.primaryMood === filter.value) &&
        (!query.value ||
          [props.hideNotes ? "" : r.note, r.primaryMood, ...r.factors]
            .join(" ")
            .includes(query.value)),
    ),
  ),
);
</script>
<template>
  <div class="inner-page journal-view page-enter">
    <header class="page-title-row">
      <div>
        <p class="eyebrow">把感受，轻轻收好</p>
        <h1>我的情绪日记</h1>
        <p class="muted">温和地回顾，每一个认真生活的自己。</p>
      </div>
      <button class="button primary" @click="$emit('record')">
        <Plus :size="16" />记录此刻
      </button>
    </header>
    <div v-if="examples" class="example-notice">
      <NotebookPen :size="15" />
      <p>这是几篇示例日记。记下你的第一份感受后，这里就会成为你的日记本。</p>
    </div>
    <div class="journal-toolbar">
      <div class="journal-filters" aria-label="按情绪筛选">
        <button
          v-for="f in ['全部', ...emotions.map((e) => e.name)]"
          :key="f"
          :class="['filter-button', { active: filter === f }]"
          :aria-pressed="filter === f"
          @click="filter = f"
        >
          {{ f }}
        </button>
      </div>
      <label class="journal-search"
        ><Search :size="15" /><input
          v-model="query"
          aria-label="搜索日记"
          placeholder="找一找记下的感受"
          type="search"
      /></label>
    </div>
    <div v-if="groups.length" class="timeline">
      <section
        v-for="group in groups"
        :key="group.title"
        class="timeline-group"
      >
        <h2>{{ group.title }}</h2>
        <div class="timeline-items">
          <button
            v-for="record in group.items"
            :key="record.id"
            class="timeline-entry"
            @click="$emit('detail', record)"
          >
            <span class="timeline-dot"></span>
            <div class="timeline-time">
              <span>{{
                new Date(record.createdAt).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}</span
              ><span v-if="!['今天', '昨天'].includes(group.title)">{{
                new Date(record.createdAt).toLocaleDateString("zh-CN", {
                  month: "long",
                  day: "numeric",
                })
              }}</span>
            </div>
            <div class="timeline-entry-main">
              <div class="timeline-entry-heading">
                <MoodFace
                  :tone="
                    emotions.find((e) => e.name === record.primaryMood)?.tone
                  "
                  small
                />
                <h3>{{ record.primaryMood }}</h3>
                <span class="intensity-caption"
                  >强度 {{ record.intensity }} / 10</span
                ><ChevronRight :size="17" />
              </div>
              <p class="diary-excerpt">
                {{
                  hideNotes
                    ? "日记内容已隐藏"
                    : record.note || "不用说很多，今天也有听见自己的感受。"
                }}
              </p>
              <div class="timeline-entry-footer">
                <div class="factor-list">
                  <span
                    v-for="f in record.factors"
                    :key="f"
                    class="diary-tag"
                    >{{ f }}</span
                  >
                </div>
                <span v-if="record.actionCompleted" class="completed-action"
                  ><Check :size="13" />{{
                    careRecommendations.find((a) => a.id === record.actionId)
                      ?.title
                  }}</span
                ><span v-else class="small-note">给感受留了一个位置</span>
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>
    <div v-else class="empty-state">
      <Illustration kind="cat" />
      <h3>
        {{
          records.length ? "这里还没有这样的记录" : "一页空白，也是一种开始。"
        }}
      </h3>
      <p>
        {{
          records.length
            ? "换一个感受或关键词，再找找看。"
            : "不用等到想好怎么说，几个词也可以。"
        }}
      </p>
      <button
        v-if="records.length"
        class="button secondary"
        @click="
          filter = '全部';
          query = '';
        "
      >
        查看全部记录</button
      ><button v-else class="button primary" @click="$emit('record')">
        写下第一份感受 <Plus :size="15" />
      </button>
    </div>
    <p class="page-end-note">不论哪种心情，都在成为你的一部分。</p>
  </div>
</template>
