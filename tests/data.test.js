import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateInsights,
  groupRecords,
  makeExamples,
  validateRecords,
  toCSV,
  findPattern,
  careRecommendations,
  localDay,
} from "../src/data.js";

const now = new Date(2026, 8, 22, 21, 0);
function entry(overrides = {}) {
  return {
    id: "one",
    createdAt: new Date(2026, 8, 22, 10, 0).toISOString(),
    primaryMood: "焦虑",
    overall: 2,
    intensity: 8,
    factors: ["睡眠"],
    note: "",
    actionId: null,
    actionCompleted: false,
    feedback: null,
    elapsedSeconds: 0,
    postState: null,
    ...overrides,
  };
}

test("整体状态趋势独立于情绪强度；没有数据的日期保持空白", () => {
  const happy = entry({
    id: "happy",
    primaryMood: "开心",
    overall: 5,
    intensity: 8,
  });
  const anxious = entry({ id: "anxious", overall: 1, intensity: 8 });
  const insight = aggregateInsights([happy, anxious], 7, now);
  assert.equal(insight.trend.at(-1).value, 3);
  assert.equal(insight.trend[0].value, null);
  assert.deepEqual(insight.trend.at(-1).emotions, ["开心", "焦虑"]);
  const changed = aggregateInsights(
    [
      { ...happy, intensity: 1 },
      { ...anxious, intensity: 10 },
    ],
    7,
    now,
  );
  assert.equal(changed.trend.at(-1).value, 3);
});

test("直接练习没有整体状态时不虚构趋势", () => {
  const insight = aggregateInsights([entry({ overall: null })], 7, now);
  assert.ok(insight.trend.every((p) => p.value === null));
});

test("关怀帮助程度来自明确反馈，而非强度前后差值", () => {
  const base = { actionId: "breath", actionCompleted: true, intensity: 9 };
  const records = [
    entry({
      ...base,
      feedback: "harder",
      postState: { primaryMood: "焦虑", intensity: 1 },
    }),
    entry({ ...base, id: "two", feedback: "same" }),
    entry({
      ...base,
      id: "three",
      feedback: "lighter",
      postState: { primaryMood: "开心", intensity: 10 },
    }),
  ];
  const [a] = aggregateInsights(records, 7, now).actions;
  assert.equal(a.count, 3);
  assert.equal(a.helped, 1);
  assert.equal(a.label, "有时会轻松一些");
  assert.equal(
    aggregateInsights([entry({ ...base, feedback: "harder" })], 7, now)
      .actions[0].label,
    "继续找到适合你的方式",
  );
});

test("跳过行动不计入已完成练习，也不默认为有帮助", () => {
  const insight = aggregateInsights(
    [entry({ actionId: "breath", actionCompleted: false })],
    7,
    now,
  );
  assert.equal(insight.actions.length, 0);
});

test("日期筛选跨月有效，并排除未来记录", () => {
  const records = [
    entry({ createdAt: new Date(2026, 8, 15, 12).toISOString() }),
    entry({ id: "future", createdAt: new Date(2026, 8, 23).toISOString() }),
    entry({ id: "old", createdAt: new Date(2026, 7, 31).toISOString() }),
  ];
  assert.equal(aggregateInsights(records, 7, now).selected.length, 0);
  assert.equal(aggregateInsights(records, 30, now).selected.length, 2);
});

test("时间线按本地日期分类并在跨周时正确区分昨天和更早", () => {
  const monday = new Date(2026, 8, 21, 12);
  const dates = [21, 20, 19, 10].map((day, i) =>
    entry({
      id: String(i),
      createdAt: new Date(2026, 8, day, 9).toISOString(),
    }),
  );
  assert.deepEqual(
    groupRecords(dates, monday).map((g) => [g.title, g.items.length]),
    [
      ["今天", 1],
      ["昨天", 1],
      ["更早", 2],
    ],
  );
  const friday = new Date(2026, 8, 25, 12);
  assert.deepEqual(
    groupRecords(
      [entry({ createdAt: new Date(2026, 8, 23, 9).toISOString() })],
      friday,
    ).map((g) => g.title),
    ["本周更早"],
  );
});

test("本地存储损坏或缺少必需字段时拒绝静默覆盖", () => {
  assert.throws(() => validateRecords({}));
  assert.throws(() => validateRecords([entry({ intensity: 0 })]));
  assert.throws(() => validateRecords([entry({ createdAt: "invalid" })]));
  assert.throws(() =>
    validateRecords([entry({ feedback: "better-by-intensity" })]),
  );
  assert.throws(() =>
    validateRecords([
      entry({ actionCompleted: true, actionId: "breath", feedback: null }),
    ]),
  );
  assert.throws(() =>
    validateRecords([
      entry({
        postState: { primaryMood: "不存在的情绪", intensity: 5 },
      }),
    ]),
  );
  assert.throws(() =>
    validateRecords([
      entry({ postState: { primaryMood: "平静", intensity: 11 } }),
    ]),
  );
  assert.equal(validateRecords([entry()]).length, 1);
});

test("导出保留中文、逗号、换行，并防止表格公式执行", () => {
  const csv = toCSV([entry({ note: '=HYPERLINK("x")\n第二行,中文' })]);
  assert.ok(csv.startsWith("\ufeff"));
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")\n第二行,中文"'));
  assert.ok(csv.includes("行动反馈"));
  assert.ok(csv.includes('"不太好"'));
});

test("发现只表述记录支持的关联，不把睡眠标签当作睡眠不足或因果", () => {
  assert.match(findPattern([entry(), entry({ id: "two" })]), /2 次提到睡眠/);
  assert.doesNotMatch(
    findPattern([entry(), entry({ id: "two" })]),
    /不足|第二天|导致/,
  );
  assert.match(findPattern([]), /再积累几次/);
});

test("示例数据有效且带标记；三项关怀为真实的二、五、十分钟", () => {
  assert.equal(validateRecords(makeExamples(now)).length, 8);
  assert.ok(makeExamples(now).every((r) => r.example));
  assert.deepEqual(
    careRecommendations.map((a) => a.duration),
    [120, 300, 600],
  );
  assert.equal(localDay(now), "2026-09-22");
});
