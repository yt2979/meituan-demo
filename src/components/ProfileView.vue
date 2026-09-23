<script setup>
import { ref, computed } from "vue";
import {
  Download,
  Bell,
  Heart,
  ShieldCheck,
  ChevronDown,
  Check,
  Pencil,
} from "lucide-vue-next";
import Illustration from "./Illustration.vue";
import { localDay } from "../data";
const props = defineProps({ settings: Object, records: Array, error: String });
const emit = defineEmits(["update", "export"]);
const editing = ref(false),
  name = ref(props.settings.name),
  privacy = ref(false);
const days = computed(
  () => new Set(props.records.map((r) => localDay(r.createdAt))).size,
);
function saveName() {
  if (name.value.trim()) {
    emit("update", { name: name.value.trim().slice(0, 20) });
    editing.value = false;
  }
}
</script>
<template>
  <div class="inner-page profile-view page-enter">
    <header class="page-title-row">
      <div>
        <p class="eyebrow">留一个位置，给自己</p>
        <h1>我的小小空间</h1>
        <p class="muted">让这里，成为你觉得舒服的样子。</p>
      </div>
    </header>
    <section class="profile-intro">
      <div class="profile-avatar"><Illustration kind="brand" /></div>
      <div class="profile-name">
        <form v-if="editing" @submit.prevent="saveName">
          <label class="sr-only" for="profile-name">怎么称呼你</label
          ><input
            id="profile-name"
            v-model="name"
            maxlength="20"
            placeholder="怎么称呼你"
            autofocus
          /><button
            class="icon-button"
            aria-label="保存称呼"
            :disabled="!name.trim()"
            type="submit"
          >
            <Check :size="18" />
          </button>
        </form>
        <h2 v-else>
          {{ settings.name
          }}<button
            class="icon-button"
            aria-label="修改称呼"
            @click="
              editing = true;
              name = settings.name;
            "
          >
            <Pencil :size="14" />
          </button>
        </h2>
        <p>
          已经陪伴自己记录了 <strong>{{ days }}</strong> 天 <span>·</span> 留下
          {{ records.length }} 份感受
        </p>
      </div>
      <Illustration kind="cat" />
    </section>
    <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
    <section class="settings-section">
      <h3>按自己的节奏</h3>
      <div class="setting-row">
        <Bell :size="19" :stroke-width="1.5" />
        <div class="setting-copy">
          <h4>每日关怀提醒</h4>
          <p>在打开息月时，温柔地提醒你记录。</p>
          <label v-if="settings.reminder" class="reminder-time"
            >提醒时间
            <input
              type="time"
              aria-label="每日提醒时间"
              :value="settings.reminderTime"
              @change="$emit('update', { reminderTime: $event.target.value })"
          /></label>
        </div>
        <button
          class="switch"
          role="switch"
          aria-label="每日关怀提醒"
          :aria-checked="settings.reminder"
          :class="{ on: settings.reminder }"
          @click="$emit('update', { reminder: !settings.reminder })"
        >
          <span></span>
        </button>
      </div>
      <div class="setting-row">
        <Heart :size="19" :stroke-width="1.5" />
        <div class="setting-copy">
          <h4>理解语气偏好</h4>
          <p>用让你舒服的方式，陪你理解自己。</p>
        </div>
        <label class="sr-only" for="tone">理解语气偏好</label
        ><select
          id="tone"
          :value="settings.tone"
          @change="$emit('update', { tone: $event.target.value })"
        >
          <option>温柔陪伴</option>
          <option>简洁客观</option>
        </select>
      </div>
    </section>
    <section class="settings-section">
      <h3>安心地，做自己</h3>
      <div class="setting-row">
        <Download :size="19" :stroke-width="1.5" />
        <div class="setting-copy">
          <h4>导出我的记录</h4>
          <p>把你的情绪日记，备份到自己手里。</p>
        </div>
        <button
          class="button secondary small"
          :disabled="!records.length"
          @click="$emit('export')"
        >
          导出数据 <Download :size="13" />
        </button>
      </div>
      <div class="setting-row privacy-row">
        <ShieldCheck :size="19" :stroke-width="1.5" />
        <div class="setting-copy">
          <h4>隐私与数据</h4>
          <p>你的记录保存在当前浏览器中。</p>
        </div>
        <button
          class="icon-button"
          aria-label="查看隐私设置"
          :aria-expanded="privacy"
          @click="privacy = !privacy"
        >
          <ChevronDown
            :size="18"
            :style="{ transform: privacy ? 'rotate(180deg)' : '' }"
          />
        </button>
      </div>
      <div v-if="privacy" class="privacy-detail">
        <p>
          日记和偏好仅保存在这台设备的当前浏览器中，不会上传。清理浏览器数据会移除记录，建议定期导出备份。
        </p>
        <p>
          此处没有账户同步或加密存储。共享设备上，其他使用同一浏览器的人可能看到记录。
        </p>
        <div class="privacy-option">
          <span
            >隐藏日记文字预览<small>首页与记录列表不显示日记正文</small></span
          ><button
            class="switch"
            role="switch"
            aria-label="隐藏日记文字预览"
            :aria-checked="settings.hideNotes"
            :class="{ on: settings.hideNotes }"
            @click="$emit('update', { hideNotes: !settings.hideNotes })"
          >
            <span></span>
          </button>
        </div>
        <div class="privacy-option">
          <span
            >没有记录时展示示例<small
              >示例不会混入你的记录或导出文件</small
            ></span
          ><button
            class="switch"
            role="switch"
            aria-label="没有记录时展示示例"
            :aria-checked="settings.showExamples"
            :class="{ on: settings.showExamples }"
            @click="$emit('update', { showExamples: !settings.showExamples })"
          >
            <span></span>
          </button>
        </div>
      </div>
    </section>
    <div class="profile-closing">
      <Illustration kind="plant" />
      <p>慢一点，也没关系。<br /><span>你已经在认真生活了。</span></p>
      <Heart :size="15" />
    </div>
  </div>
</template>
