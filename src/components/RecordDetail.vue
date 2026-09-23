<script setup>
import { ref, onMounted } from "vue";
import { X, Check } from "lucide-vue-next";
import MoodFace from "./MoodFace.vue";
import Illustration from "./Illustration.vue";
import { emotions, moods, careRecommendations, feedbackOptions } from "../data";
defineProps({ record: Object });
defineEmits(["close"]);
const dialog = ref(null);
onMounted(() => dialog.value.showModal());
</script>
<template>
  <dialog
    ref="dialog"
    class="detail-dialog"
    aria-labelledby="detail-title"
    @cancel.prevent="$emit('close')"
  >
    <header class="flow-header">
      <h2 id="detail-title">
        那一刻的自己
        <span v-if="record.example" class="example-label">示例记录</span>
      </h2>
      <button
        class="icon-button"
        aria-label="关闭记录详情"
        @click="$emit('close')"
      >
        <X :size="18" />
      </button>
    </header>
    <div class="detail-body">
      <p class="small-note">
        {{
          new Date(record.createdAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }}
      </p>
      <div class="detail-mood">
        <MoodFace
          :tone="emotions.find((e) => e.name === record.primaryMood)?.tone"
        />
        <div>
          <h3>{{ record.primaryMood }}</h3>
          <p>
            情绪强度 {{ record.intensity }} / 10
            <span v-if="record.overall"
              >· 整体状态：{{
                moods.find((m) => m.value === record.overall)?.name
              }}</span
            >
          </p>
        </div>
      </div>
      <div class="factor-list">
        <span v-for="f in record.factors" :key="f" class="factor-chip static">{{
          f
        }}</span>
      </div>
      <p class="detail-note">
        {{ record.note || "没有留下文字，也没关系。感受已经被记住了。" }}
      </p>
      <section v-if="record.actionCompleted" class="detail-action">
        <Illustration
          :kind="
            careRecommendations.find((a) => a.id === record.actionId)?.kind
          "
        />
        <div>
          <h4>
            <Check :size="14" />{{
              careRecommendations.find((a) => a.id === record.actionId)?.title
            }}
          </h4>
          <p>
            练习了 {{ Math.floor((record.elapsedSeconds || 0) / 60) }} 分
            {{ (record.elapsedSeconds || 0) % 60 }} 秒
          </p>
          <p>
            之后的感受：{{
              feedbackOptions.find((f) => f.value === record.feedback)?.label ||
              "未记录"
            }}
          </p>
        </div>
      </section>
      <p v-else class="muted">这一次，先听听自己的感受。</p>
      <section v-if="record.postState" class="detail-post">
        <h4>重新记录的状态</h4>
        <p>
          {{ record.postState.primaryMood }} · 强度
          {{ record.postState.intensity }} / 10
        </p>
        <span class="small-note">前后的感受都被保留下来，不需要比较好坏。</span>
      </section>
    </div>
    <footer class="detail-footer">
      <button class="button secondary" @click="$emit('close')">轻轻合上</button>
    </footer>
  </dialog>
</template>
