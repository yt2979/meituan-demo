<script setup>
import {
  ref,
  computed,
  reactive,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import {
  House,
  NotebookPen,
  ChartNoAxesCombined,
  UserRound,
  Plus,
  Heart,
  Leaf,
  Check,
  X,
} from "lucide-vue-next";
import Illustration from "./components/Illustration.vue";
import HomeView from "./components/HomeView.vue";
import RecordFlow from "./components/RecordFlow.vue";
import JournalView from "./components/JournalView.vue";
import InsightsView from "./components/InsightsView.vue";
import ProfileView from "./components/ProfileView.vue";
import RecordDetail from "./components/RecordDetail.vue";
import {
  makeExamples,
  recordKey,
  settingsKey,
  defaultSettings,
  validateRecords,
  toCSV,
  localDay,
} from "./data";
const navigation = [
  { id: "home", name: "首页", icon: House },
  { id: "journal", name: "记录", icon: NotebookPen },
  { id: "insights", name: "洞察", icon: ChartNoAxesCombined },
  { id: "profile", name: "我的", icon: UserRound },
];
const initialTab = location.hash.slice(1);
const tab = ref(
  navigation.some((n) => n.id === initialTab) ? initialTab : "home",
);
const ownRecords = ref([]),
  settings = ref({ ...defaultSettings }),
  storageError = ref(""),
  settingsError = ref(""),
  saveError = ref(""),
  saving = ref(false),
  flowOpen = ref(false),
  draft = ref(null),
  detail = ref(null),
  toast = ref(""),
  reminder = ref(false);
const sampleRecords = makeExamples();
const examples = computed(
  () => !ownRecords.value.length && settings.value.showExamples,
);
const records = computed(() =>
  examples.value ? sampleRecords : ownRecords.value,
);
let toastTimer,
  reminderInterval,
  remindedDay = "";
let restoreFocus = null;
function loadRecords() {
  try {
    const stored = localStorage.getItem(recordKey);
    ownRecords.value = stored ? validateRecords(JSON.parse(stored)) : [];
    storageError.value = "";
  } catch {
    storageError.value =
      "暂时无法读取已有记录，原始内容仍保留在浏览器中。为避免覆盖，请先检查浏览器的存储权限或备份原始记录。";
  }
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(settingsKey) || "null");
    if (!s) return;
    settings.value = {
      ...defaultSettings,
      name:
        typeof s.name === "string" && s.name.trim()
          ? s.name.slice(0, 20)
          : defaultSettings.name,
      reminder: s.reminder === true,
      reminderTime:
        typeof s.reminderTime === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.reminderTime)
          ? s.reminderTime
          : "21:00",
      tone: ["温柔陪伴", "简洁客观"].includes(s.tone)
        ? s.tone
        : defaultSettings.tone,
      showExamples: s.showExamples !== false,
      hideNotes: s.hideNotes === true,
    };
  } catch {
    settingsError.value = "暂时无法读取偏好，已使用默认设置。";
  }
}
loadRecords();
loadSettings();
function notify(message) {
  clearTimeout(toastTimer);
  toast.value = message;
  toastTimer = setTimeout(() => (toast.value = ""), 4200);
}
function navigate(id) {
  tab.value = id;
  history.replaceState(null, "", `#${id}`);
  document.title = `${navigation.find((n) => n.id === id)?.name} · 息月`;
  window.scrollTo({ top: 0, behavior: "instant" });
}
function newDraft() {
  return reactive({
    step: "record",
    overall: null,
    primaryMood: "",
    intensity: 5,
    factors: [],
    text: "",
    confirmed: false,
    actionId: null,
    actionCompleted: false,
    feedback: null,
    elapsedSeconds: 0,
    postState: null,
  });
}
function openRecord(overall = null) {
  restoreFocus = document.activeElement;
  if (!draft.value) draft.value = newDraft();
  if (typeof overall === "number") {
    draft.value.overall = overall;
    draft.value.step = "record";
    draft.value.confirmed = false;
  }
  saveError.value = "";
  flowOpen.value = true;
}
function openCare() {
  restoreFocus = document.activeElement;
  if (!draft.value) draft.value = newDraft();
  draft.value.actionId = "breath";
  draft.value.step = "practice";
  saveError.value = "";
  flowOpen.value = true;
}
async function closeFlow() {
  flowOpen.value = false;
  await nextTick();
  restoreFocus?.focus?.();
}
async function openDetail(record) {
  restoreFocus = document.activeElement;
  detail.value = record;
}
async function closeDetail() {
  detail.value = null;
  await nextTick();
  restoreFocus?.focus?.();
}
async function saveRecord() {
  if (saving.value) return;
  const f = draft.value;
  if (!f?.primaryMood || (f.actionCompleted && !f.feedback)) return;
  saving.value = true;
  saveError.value = "";
  await nextTick();
  try {
    // Read before merging so a second tab cannot silently overwrite another saved entry.
    const stored = localStorage.getItem(recordKey);
    const existing = stored ? validateRecords(JSON.parse(stored)) : [];
    const entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      primaryMood: f.primaryMood,
      overall: f.overall,
      intensity: f.intensity,
      factors: [...f.factors],
      note: f.text.trim(),
      actionId: f.actionCompleted ? f.actionId : null,
      actionCompleted: f.actionCompleted,
      feedback: f.actionCompleted ? f.feedback : null,
      elapsedSeconds: f.actionCompleted ? f.elapsedSeconds : 0,
      postState: f.postState ? { ...f.postState } : null,
    };
    const updated = [entry, ...existing].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    validateRecords(updated);
    localStorage.setItem(recordKey, JSON.stringify(updated));
    ownRecords.value = updated;
    storageError.value = "";
    flowOpen.value = false;
    draft.value = null;
    reminder.value = false;
    navigate("journal");
    notify("这份感受，已经为你轻轻收好了。");
  } catch {
    saveError.value =
      "这次还没能保存。请检查浏览器存储空间与权限，再试一次；你的文字仍保留在这里。";
  } finally {
    saving.value = false;
  }
}
function updateSettings(patch) {
  try {
    const updated = { ...settings.value, ...patch };
    localStorage.setItem(settingsKey, JSON.stringify(updated));
    settings.value = updated;
    settingsError.value = "";
    notify("已经记住你的偏好。");
    checkReminder();
  } catch {
    settingsError.value = "偏好暂时未能保存，请检查浏览器存储权限。";
  }
}
function exportRecords() {
  if (!ownRecords.value.length) return;
  const blob = new Blob([toCSV(ownRecords.value)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `息月情绪日记-${localDay(new Date())}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  notify("已生成导出文件，请在浏览器下载中保存。");
}
function checkReminder() {
  const now = new Date();
  const today = localDay(now);
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (!settings.value.reminder) {
    reminder.value = false;
    return;
  }
  if (
    time >= settings.value.reminderTime &&
    today !== remindedDay &&
    !ownRecords.value.some((r) => localDay(r.createdAt) === today)
  ) {
    reminder.value = true;
    remindedDay = today;
  }
}
function syncStorage(event) {
  if (event.key === recordKey) loadRecords();
  if (event.key === settingsKey) loadSettings();
}
function onHash() {
  const next = location.hash.slice(1);
  if (navigation.some((n) => n.id === next)) tab.value = next;
}
onMounted(() => {
  checkReminder();
  reminderInterval = setInterval(checkReminder, 30000);
  window.addEventListener("storage", syncStorage);
  window.addEventListener("hashchange", onHash);
});
onBeforeUnmount(() => {
  clearTimeout(toastTimer);
  clearInterval(reminderInterval);
  window.removeEventListener("storage", syncStorage);
  window.removeEventListener("hashchange", onHash);
});
</script>
<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="app-layout">
    <aside class="sidebar">
      <a class="brand" href="#home" @click.prevent="navigate('home')"
        ><Illustration kind="brand" />
        <div>
          <span>息月</span>
          <p>和自己的情绪，好好相处</p>
        </div></a
      >
      <nav aria-label="主导航">
        <button
          v-for="item in navigation"
          :key="item.id"
          :class="['nav-item', { active: tab === item.id }]"
          :aria-current="tab === item.id ? 'page' : undefined"
          @click="navigate(item.id)"
        >
          <component :is="item.icon" :size="19" :stroke-width="1.6" /><span>{{
            item.name
          }}</span
          ><span v-if="tab === item.id" class="nav-dot"></span>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-note">
          <Illustration kind="plant" />
          <p>温柔地，<br />陪伴每一个情绪的你。</p>
          <Heart :size="13" />
        </div>
        <button class="button primary new-record" @click="openRecord()">
          <Plus :size="16" />{{ draft ? "继续记录" : "记录此刻" }}
        </button>
        <p class="sidebar-private"><Leaf :size="12" /> 你的小小安心角落</p>
      </div>
    </aside>
    <div class="mobile-brand">
      <Illustration kind="brand" /><span>息月</span
      ><span>和自己的情绪，好好相处</span>
    </div>
    <main id="main-content" class="main-content" tabindex="-1">
      <div v-if="storageError" class="storage-warning" role="alert">
        {{ storageError }}
      </div>
      <div v-if="reminder" class="reminder-banner">
        <p>到了留一点时间给自己的时候。今天感觉怎么样？</p>
        <button class="text-button" @click="openRecord()">记录一下</button
        ><button
          class="icon-button"
          aria-label="今天不再提醒"
          @click="reminder = false"
        >
          <X :size="15" />
        </button>
      </div>
      <HomeView
        v-if="tab === 'home'"
        :records="records"
        :examples="examples"
        :hide-notes="settings.hideNotes"
        :name="settings.name"
        @record="openRecord"
        @care="openCare"
        @navigate="navigate"
        @detail="openDetail"
      />
      <JournalView
        v-else-if="tab === 'journal'"
        :records="records"
        :examples="examples"
        :hide-notes="settings.hideNotes"
        @record="openRecord()"
        @detail="openDetail"
      />
      <InsightsView
        v-else-if="tab === 'insights'"
        :records="records"
        :examples="examples"
        @record="openRecord()"
      />
      <ProfileView
        v-else
        :settings="settings"
        :records="ownRecords"
        :error="settingsError"
        @update="updateSettings"
        @export="exportRecords"
      />
    </main>
  </div>
  <RecordFlow
    v-if="flowOpen"
    :draft="draft"
    :saving="saving"
    :error="saveError"
    :tone="settings.tone"
    @close="closeFlow"
    @save="saveRecord"
  />
  <RecordDetail v-if="detail" :record="detail" @close="closeDetail" />
  <div v-if="toast" class="toast" role="status">
    <Check :size="15" />{{ toast }}
  </div>
</template>
