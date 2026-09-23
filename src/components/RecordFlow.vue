<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Pause,
  Play,
  LockKeyhole,
  Heart,
} from "lucide-vue-next";
import Illustration from "./Illustration.vue";
import MoodFace from "./MoodFace.vue";
import {
  moods,
  emotions,
  factors,
  careRecommendations,
  feedbackOptions,
} from "../data";

const props = defineProps({
  draft: Object,
  saving: Boolean,
  error: String,
  tone: String,
});
const emit = defineEmits(["close", "save"]);
// The draft lives in the app so closing the dialog preserves unfinished writing.
const form = props.draft;
const dialog = ref(null),
  scrollArea = ref(null),
  loading = ref(false),
  paused = ref(false),
  remaining = ref(0),
  showPost = ref(!!form.postState);
let interval,
  analysisTimeout,
  resumeAt = 0,
  remainingAtResume = 0;
const titles = {
  record: "记录情绪",
  understand: "情绪理解",
  care: "为你推荐的自我关怀行动",
  practice: "给自己一点时间",
  feedback: "照顾自己之后",
};
const currentIndex = computed(
  () =>
    ({ record: 0, understand: 1, care: 2, practice: 2, feedback: 3 })[
      form.step
    ],
);
const care = computed(() =>
  careRecommendations.find((a) => a.id === form.actionId),
);
const seconds = computed(() => Math.max(0, Math.ceil(remaining.value / 1000)));
const elapsed = computed(() =>
  care.value ? care.value.duration * 1000 - remaining.value : 0,
);
const phase = computed(() => {
  const cycle = Math.floor(elapsed.value / 1000) % 14;
  if (cycle < 4)
    return { name: "慢慢吸气", seconds: 4 - cycle, stage: "inhale" };
  if (cycle < 8) return { name: "轻轻停留", seconds: 8 - cycle, stage: "hold" };
  return { name: "缓缓呼气", seconds: 14 - cycle, stage: "exhale" };
});
const observation = computed(() => {
  const gentle = props.tone === "温柔陪伴";
  if (["开心", "满足", "平静"].includes(form.primaryMood))
    return gentle
      ? "这一刻的感受，也值得好好收藏。不急着做更多，先陪自己停留一会儿。"
      : "你记录了较舒展的感受。可以留意这次经历中，哪些部分值得再次尝试。";
  if (form.factors.includes("睡眠"))
    return gentle
      ? "你提到了睡眠，也许身体正在提醒你休息一下。不必立刻解决所有事情，先照顾此刻的自己。"
      : "你选择了睡眠作为影响因素。可以先关注休息需求，再看看感受是否有变化。";
  if (form.factors.includes("自我压力"))
    return "你提到了对自己的压力。感受不需要被评判，允许自己先停一下，再决定下一步。";
  return gentle
    ? "听起来，此刻的你承载了一些不容易的感受。暂时不必找到答案，愿意听见自己，就已经很好。"
    : "这是根据你刚才的选择整理出的感受。可以先尝试一个小行动，再观察自己的体验。";
});
const groundPrompt = computed(() => {
  const i = Math.min(4, Math.floor(elapsed.value / 60000));
  return [
    "看看周围，找到五样你能看见的东西。",
    "轻轻触碰四样物品，感受不同的质地。",
    "停一停，听见身边的三种声音。",
    "留意两种气味，或想起你喜欢的气息。",
    "感受一种味道，或喝一口温水。",
  ][i];
});
function toggleFactor(f) {
  const i = form.factors.indexOf(f);
  i < 0 ? form.factors.push(f) : form.factors.splice(i, 1);
}
function analyze() {
  if (!form.primaryMood || form.overall === null) return;
  form.confirmed = false;
  form.step = "understand";
  loading.value = true;
  analysisTimeout = setTimeout(() => (loading.value = false), 550);
}
function startCare(item) {
  clearInterval(interval);
  form.actionId = item.id;
  form.actionCompleted = false;
  form.feedback = null;
  form.postState = null;
  showPost.value = false;
  form.elapsedSeconds = 0;
  remaining.value = item.duration * 1000;
  paused.value = false;
  form.step = "practice";
  resume();
}
function tick() {
  if (paused.value) return;
  remaining.value = Math.max(0, remainingAtResume - (Date.now() - resumeAt));
  if (remaining.value === 0) finish();
}
function resume() {
  resumeAt = Date.now();
  remainingAtResume = remaining.value;
  paused.value = false;
  clearInterval(interval);
  interval = setInterval(tick, 100);
}
function togglePause() {
  if (paused.value) resume();
  else {
    tick();
    paused.value = true;
    clearInterval(interval);
  }
}
function finish() {
  clearInterval(interval);
  form.elapsedSeconds = Math.round(elapsed.value / 1000);
  form.actionCompleted = true;
  form.step = "feedback";
  paused.value = false;
}
function skip() {
  form.actionId = null;
  form.actionCompleted = false;
  form.feedback = null;
  form.postState = null;
  showPost.value = false;
  form.step = "feedback";
}
function close() {
  clearInterval(interval);
  if (form.step === "practice") {
    form.elapsedSeconds = Math.round(elapsed.value / 1000);
    form.step = "care";
  }
  emit("close");
}
function back() {
  if (form.step === "understand") form.step = "record";
  else if (form.step === "care") form.step = "understand";
  else if (form.step === "practice") {
    clearInterval(interval);
    form.step = "care";
  } else if (form.step === "feedback") form.step = "care";
  else close();
}
function togglePost() {
  showPost.value = !showPost.value;
  form.postState = showPost.value ? { primaryMood: "", intensity: 5 } : null;
}
const canSave = computed(
  () =>
    !!form.primaryMood &&
    (!form.actionCompleted || !!form.feedback) &&
    (!form.postState || !!form.postState.primaryMood),
);
function save() {
  if (canSave.value && !props.saving) emit("save");
}
watch(
  () => form.step,
  async () => {
    await nextTick();
    scrollArea.value?.scrollTo({ top: 0 });
  },
);
onMounted(() => {
  dialog.value.showModal();
  if (form.step === "practice" && care.value) startCare(care.value);
});
onBeforeUnmount(() => {
  clearInterval(interval);
  clearTimeout(analysisTimeout);
});
</script>

<template>
  <dialog
    ref="dialog"
    class="flow-dialog"
    aria-labelledby="flow-title"
    @cancel.prevent="close"
  >
    <header class="flow-header">
      <button class="icon-button" aria-label="返回上一步" @click="back">
        <ArrowLeft :size="18" />
      </button>
      <h2 id="flow-title">{{ titles[form.step] }}</h2>
      <button
        class="icon-button"
        aria-label="关闭记录，保留草稿"
        @click="close"
      >
        <X :size="18" />
      </button>
    </header>
    <ol class="flow-progress" aria-label="记录进度">
      <li
        v-for="(name, index) in ['记录', '理解', '行动', '感受']"
        :key="name"
        :class="{ current: index === currentIndex, done: index < currentIndex }"
        :aria-current="index === currentIndex ? 'step' : undefined"
      >
        <span class="step-dot"
          ><Check v-if="index < currentIndex" :size="9" /></span
        ><span>{{ name }}</span>
      </li>
    </ol>
    <div ref="scrollArea" class="flow-scroll">
      <div
        v-if="form.step === 'record'"
        class="flow-body record-form page-enter"
      >
        <div class="flow-intro">
          <h3>此刻的你，是什么心情？</h3>
          <p class="muted">不用组织好语言，我们从一个感受开始。</p>
        </div>
        <fieldset>
          <legend>此刻的整体状态</legend>
          <div class="compact-moods">
            <button
              v-for="m in moods"
              :key="m.value"
              :class="{ selected: form.overall === m.value }"
              :aria-pressed="form.overall === m.value"
              @click="form.overall = m.value"
            >
              <MoodFace :tone="m.value" small /><span>{{ m.name }}</span>
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>此刻的感受</legend>
          <div class="emotion-grid">
            <button
              v-for="e in emotions"
              :key="e.name"
              :class="[
                'emotion-button',
                { selected: form.primaryMood === e.name },
              ]"
              :aria-pressed="form.primaryMood === e.name"
              @click="form.primaryMood = e.name"
            >
              <MoodFace :tone="e.tone" small /><span>{{ e.name }}</span
              ><Check
                v-if="form.primaryMood === e.name"
                class="emotion-check"
                :size="12"
              />
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>情绪强度 <span>感受有多强烈，不代表好坏</span></legend>
          <div class="range-row">
            <input
              v-model.number="form.intensity"
              aria-label="情绪强度"
              type="range"
              min="1"
              max="10"
              :style="{
                '--range-fill': ((form.intensity - 1) / 9) * 100 + '%',
              }"
            /><output>{{ form.intensity }} <span>/ 10</span></output>
          </div>
          <div class="range-labels"><span>轻轻的</span><span>很强烈</span></div>
        </fieldset>
        <fieldset>
          <legend>最近什么比较影响你？ <span>可多选，也可以不选</span></legend>
          <div class="factor-list">
            <button
              v-for="f in factors"
              :key="f"
              :class="['factor-chip', { selected: form.factors.includes(f) }]"
              :aria-pressed="form.factors.includes(f)"
              @click="toggleFactor(f)"
            >
              {{ f }}
            </button>
          </div>
        </fieldset>
        <div class="note-field">
          <label for="record-note">想记录些什么？ <span>选填</span></label
          ><textarea
            id="record-note"
            v-model="form.text"
            maxlength="2000"
            placeholder="可以简单记录，也可以只写几个关键词……"
          /><span class="char-count">{{ form.text.length }} / 2000</span>
        </div>
      </div>
      <div
        v-else-if="form.step === 'understand'"
        class="flow-body understanding page-enter"
      >
        <div v-if="loading" class="understanding-loading" role="status">
          <Illustration kind="leaf" />
          <p>把刚才的感受，轻轻整理一下……</p>
        </div>
        <template v-else
          ><div class="understand-block">
            <h3>你现在可能正在经历</h3>
            <div class="identified-emotion">
              <MoodFace
                :tone="emotions.find((e) => e.name === form.primaryMood)?.tone"
              />
              <div>
                <h4>
                  {{ form.primaryMood }} <span class="soft-tag">主要情绪</span>
                </h4>
                <p class="muted">这是你为此刻选择的感受</p>
              </div>
            </div>
          </div>
          <div class="understand-block">
            <h3>可能影响你的事情</h3>
            <div v-if="form.factors.length" class="factor-list">
              <span
                v-for="f in form.factors"
                :key="f"
                class="factor-chip static"
                >{{ f }}</span
              >
            </div>
            <p v-else class="muted">
              不一定要有明确的原因，你的感受本身就值得被看见。
            </p>
            <p v-if="form.text" class="note-quote">“{{ form.text }}”</p>
          </div>
          <div class="confirmation">
            <h3>这些符合你的感受吗？</h3>
            <p class="muted">你最了解自己，随时可以重新调整。</p>
            <div class="confirmation-buttons">
              <button
                :class="['button', form.confirmed ? 'primary' : 'secondary']"
                :aria-pressed="form.confirmed"
                @click="form.confirmed = true"
              >
                <Check :size="16" />{{
                  form.confirmed ? "已确认，符合我的感受" : "符合"
                }}</button
              ><button
                class="button secondary"
                @click="
                  form.step = 'record';
                  form.confirmed = false;
                "
              >
                调整一下
              </button>
            </div>
          </div>
          <div class="observation">
            <span class="observation-title"
              ><Illustration kind="leaf" />一点观察</span
            >
            <p>{{ observation }}</p>
          </div>
          <p class="understand-caption">
            这些文字来自你刚才的记录，是理解自己的一个起点。
          </p></template
        >
      </div>
      <div
        v-else-if="form.step === 'care'"
        class="flow-body care-body page-enter"
      >
        <div class="flow-intro">
          <h3>现在可以为自己做点什么？</h3>
          <p class="muted">不必做很多，一个小行动就好。</p>
        </div>
        <div class="care-list">
          <article
            v-for="item in careRecommendations"
            :key="item.id"
            class="care-option"
          >
            <div :class="['care-option-art', item.kind]">
              <Illustration :kind="item.kind" />
            </div>
            <div class="care-option-copy">
              <span class="small-note">{{ item.duration / 60 }} 分钟</span>
              <h4>{{ item.title }}</h4>
              <p>{{ item.reason }}</p>
            </div>
            <button
              class="button primary small"
              :aria-label="`开始${item.title}`"
              @click="startCare(item)"
            >
              开始
            </button>
          </article>
        </div>
        <button class="text-button skip-care" @click="skip">
          暂时不需要，先保存感受 <ArrowRight :size="14" />
        </button>
        <div class="care-landscape">
          <div class="hill hill-back"></div>
          <div class="hill hill-front"></div>
          <Illustration kind="plant" /><span
            >照顾自己，也可以从停下来开始。</span
          >
        </div>
      </div>
      <div
        v-else-if="form.step === 'practice'"
        class="flow-body practice-body page-enter"
      >
        <p class="eyebrow">这段时间，只属于你</p>
        <h3>{{ care.title }}</h3>
        <p class="muted">
          {{
            care.id === "breath"
              ? "找一个舒服的姿势，跟着圆圈慢慢呼吸。"
              : "不需要做到完美，按自己的节奏来。"
          }}
        </p>
        <div v-if="care.id === 'breath'" class="breathing-space">
          <div class="breath-ring ring-outer"></div>
          <div class="breath-ring ring-middle"></div>
          <div
            class="breath-orb"
            :class="{ paused }"
            :style="{ 'animation-play-state': paused ? 'paused' : 'running' }"
          ></div>
          <div class="breath-instruction" aria-live="off">
            <strong>{{ paused ? "歇一会儿" : phase.name }}</strong
            ><span>{{ paused ? "准备好再继续" : phase.seconds + " 秒" }}</span>
          </div>
        </div>
        <div v-else class="other-practice">
          <Illustration :kind="care.kind" />
          <p>
            {{
              care.id === "ground"
                ? groundPrompt
                : "慢慢走一走，留意脚步、树叶和周围的光。路上请把手机收好。"
            }}
          </p>
        </div>
        <div class="practice-countdown" role="timer" aria-label="剩余练习时间">
          {{ Math.floor(seconds / 60) }} <span>分</span>
          {{ String(seconds % 60).padStart(2, "0") }} <span>秒</span>
        </div>
        <p v-if="care.id === 'breath'" class="breath-rhythm">
          吸气 4 秒 <span>·</span> 停留 4 秒 <span>·</span> 呼气 6 秒
        </p>
        <p class="practice-gentle">
          {{
            care.id === "breath"
              ? "不必勉强跟上，感觉不舒服时恢复自然呼吸就好。"
              : "随时可以暂停，照顾自己的感受最重要。"
          }}
        </p>
        <div class="practice-controls">
          <button class="button secondary" @click="togglePause">
            <Play v-if="paused" :size="14" /><Pause v-else :size="14" />{{
              paused ? "继续练习" : "暂停一下"
            }}</button
          ><button class="text-button" @click="finish">结束这次练习</button>
        </div>
      </div>
      <div
        v-else-if="form.step === 'feedback'"
        class="flow-body feedback-body page-enter"
      >
        <div class="feedback-heading">
          <div>
            <p class="eyebrow">谢谢你，愿意照顾自己</p>
            <h3>
              {{
                form.actionCompleted
                  ? "为自己留了一点时间。"
                  : "每一种感受，都可以被接纳。"
              }}
            </h3>
            <h2 v-if="form.actionCompleted">
              和刚才相比，<br />现在感觉怎么样？
            </h2>
          </div>
          <Illustration kind="plant" />
        </div>
        <div v-if="form.actionCompleted" class="feedback-options">
          <button
            v-for="f in feedbackOptions"
            :key="f.value"
            :class="{ selected: form.feedback === f.value }"
            :aria-pressed="form.feedback === f.value"
            @click="form.feedback = f.value"
          >
            <MoodFace :tone="f.tone" /><span>{{ f.label }}</span
            ><Check v-if="form.feedback === f.value" :size="14" />
          </button>
        </div>
        <p v-if="form.feedback" class="feedback-kind" role="status">
          {{
            form.feedback === "lighter"
              ? "把这一点轻松，留给自己。"
              : form.feedback === "same"
                ? "没有变化也没关系，愿意陪着自己就很好。"
                : "谢谢你如实告诉自己。可以先停下练习，找一个让你感到安心的人陪伴。"
          }}
        </p>
        <fieldset v-if="!form.overall" class="direct-emotion">
          <legend>给这次记录选择一个感受</legend>
          <div class="factor-list">
            <button
              v-for="e in emotions"
              :key="e.name"
              :class="[
                'factor-chip',
                { selected: form.primaryMood === e.name },
              ]"
              :aria-pressed="form.primaryMood === e.name"
              @click="form.primaryMood = e.name"
            >
              {{ e.name }}
            </button>
          </div>
          <label class="direct-intensity" for="direct-intensity"
            >此刻的情绪强度 <span>{{ form.intensity }} / 10</span></label
          >
          <input
            id="direct-intensity"
            v-model.number="form.intensity"
            type="range"
            min="1"
            max="10"
            :style="{ '--range-fill': ((form.intensity - 1) / 9) * 100 + '%' }"
          />
        </fieldset>
        <div v-if="form.actionCompleted && form.overall" class="post-check">
          <p>想重新记录一下现在的状态吗？ <span>选填</span></p>
          <button
            class="button secondary"
            :aria-expanded="showPost"
            @click="togglePost"
          >
            {{ showPost ? "收起，不重新记录" : "重新记录一下现在的状态" }}
          </button>
          <div v-if="showPost" class="post-fields">
            <label
              >现在的主要感受<select v-model="form.postState.primaryMood">
                <option value="" disabled>选择此刻的感受</option>
                <option v-for="e in emotions" :key="e.name">
                  {{ e.name }}
                </option>
              </select></label
            >
            <label for="post-intensity"
              >现在的情绪强度
              <span>{{ form.postState.intensity }} / 10</span></label
            >
            <input
              id="post-intensity"
              v-model.number="form.postState.intensity"
              type="range"
              min="1"
              max="10"
              :style="{
                '--range-fill':
                  ((form.postState.intensity - 1) / 9) * 100 + '%',
              }"
            />
          </div>
        </div>
        <div class="sleeping-cat"><Illustration kind="cat" /></div>
      </div>
    </div>
    <footer v-if="form.step !== 'practice'" class="flow-footer">
      <Illustration kind="plant" />
      <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
      <template v-if="form.step === 'record'"
        ><span class="footer-hint"
          ><LockKeyhole :size="12" /> 只留在你的浏览器里</span
        ><button
          class="button primary"
          :disabled="!form.primaryMood || form.overall === null"
          @click="analyze"
        >
          下一步 <ArrowRight :size="16" /></button></template
      ><button
        v-else-if="form.step === 'understand'"
        class="button primary"
        :disabled="!form.confirmed || loading"
        @click="form.step = 'care'"
      >
        下一步 · 为你推荐行动 <ArrowRight :size="16" /></button
      ><template v-else-if="form.step === 'feedback'"
        ><button
          class="button primary save-button"
          :disabled="!canSave || saving"
          @click="save"
        >
          {{ saving ? "正在保存……" : "保存这次记录" }} <Check :size="16" />
        </button>
        <p class="save-caption">
          <Heart :size="11" /> 无论感受如何，都值得被认真记下
        </p></template
      ><span v-else class="footer-hint">按自己的节奏，慢慢来。</span>
    </footer>
  </dialog>
</template>
