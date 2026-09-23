export const moods = [
  { value: 1, name: "很糟糕" },
  { value: 2, name: "不太好" },
  { value: 3, name: "一般" },
  { value: 4, name: "还不错" },
  { value: 5, name: "很好" },
];
export const emotions = [
  { name: "焦虑", tone: 1 },
  { name: "疲惫", tone: 3 },
  { name: "平静", tone: 5 },
  { name: "烦躁", tone: 2 },
  { name: "低落", tone: 1 },
  { name: "开心", tone: 4 },
  { name: "满足", tone: 5 },
  { name: "孤独", tone: 3 },
];
export const factors = [
  "学习",
  "工作",
  "求职",
  "关系",
  "家庭",
  "睡眠",
  "健康",
  "金钱",
  "自我压力",
  "其他",
];
export const feedbackOptions = [
  { value: "lighter", label: "轻松了一些", tone: 5 },
  { value: "same", label: "差不多", tone: 3 },
  { value: "harder", label: "更难受了一些", tone: 2 },
];
export const careRecommendations = [
  {
    id: "breath",
    duration: 120,
    title: "节律呼吸",
    kind: "leaf",
    reason: "先让身体慢下来，再处理眼前的事情。",
  },
  {
    id: "ground",
    duration: 300,
    title: "感官回归练习",
    kind: "cup",
    reason: "如果思绪有些乱，试着把注意力带回身边真实的小事。",
  },
  {
    id: "walk",
    duration: 600,
    title: "出去走一走",
    kind: "walk",
    reason: "暂时离开眼前的忙碌，让阳光和空气陪你一会儿。",
  },
];
export const recordKey = "xiyue-records-v1";
export const settingsKey = "xiyue-settings-v1";
export const defaultSettings = {
  name: "亲爱的你",
  reminder: false,
  reminderTime: "21:00",
  tone: "温柔陪伴",
  showExamples: true,
  hideNotes: false,
};
export function localDay(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function makeExamples(now = new Date()) {
  const examples = [
    [
      0,
      "焦虑",
      2,
      7,
      ["学习", "睡眠"],
      "明天要交报告，感觉自己还没有准备好。",
      "breath",
      "lighter",
    ],
    [
      1,
      "疲惫",
      3,
      6,
      ["工作", "关系"],
      "忙碌的一天结束了，想给自己留一点安静的时间。",
      "ground",
      "same",
    ],
    [
      2,
      "满足",
      4,
      7,
      ["健康"],
      "出门走了一小段路，发现路边的桂花开了。",
      "walk",
      "lighter",
    ],
    [
      3,
      "平静",
      4,
      4,
      ["家庭"],
      "和家人聊了聊天，心里踏实了一些。",
      "breath",
      "lighter",
    ],
    [
      4,
      "焦虑",
      2,
      8,
      ["睡眠", "自我压力"],
      "昨晚睡得有些晚，今天很难集中注意力。",
      "breath",
      "same",
    ],
    [
      5,
      "开心",
      5,
      8,
      ["关系"],
      "和朋友一起吃了晚饭，好像又充满了电。",
      "walk",
      "lighter",
    ],
    [
      6,
      "平静",
      3,
      3,
      ["健康"],
      "慢慢整理了房间，也整理了一点心情。",
      null,
      null,
    ],
    [
      10,
      "低落",
      2,
      5,
      ["工作"],
      "今天有点不顺利，好在给自己泡了一杯热茶。",
      "ground",
      "lighter",
    ],
  ];
  return examples.map(
    (
      [days, primaryMood, overall, intensity, tags, note, actionId, feedback],
      i,
    ) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      date.setHours(days === 0 ? 9 : 20, 24 - i, 0, 0);
      return {
        id: `example-${i}`,
        createdAt: date.toISOString(),
        primaryMood,
        overall,
        intensity,
        factors: tags,
        note,
        actionId,
        feedback,
        actionCompleted: !!actionId,
        elapsedSeconds: actionId
          ? careRecommendations.find((x) => x.id === actionId).duration
          : 0,
        postState: null,
        example: true,
      };
    },
  );
}
export function validateRecords(value) {
  if (!Array.isArray(value)) throw new Error("记录格式不正确");
  const valid = value.filter(
    (x) =>
      x &&
      typeof x.id === "string" &&
      Number.isFinite(Date.parse(x.createdAt)) &&
      emotions.some((e) => e.name === x.primaryMood) &&
      (x.overall === null ||
        (Number.isInteger(x.overall) && x.overall >= 1 && x.overall <= 5)) &&
      Number.isInteger(x.intensity) &&
      x.intensity >= 1 &&
      x.intensity <= 10 &&
      Array.isArray(x.factors) &&
      x.factors.every((f) => factors.includes(f)) &&
      typeof x.note === "string" &&
      (x.actionId === null ||
        careRecommendations.some((a) => a.id === x.actionId)) &&
      (x.feedback === null ||
        feedbackOptions.some((f) => f.value === x.feedback)) &&
      typeof x.actionCompleted === "boolean" &&
      (!x.actionCompleted || (x.actionId !== null && x.feedback !== null)) &&
      Number.isInteger(x.elapsedSeconds) &&
      x.elapsedSeconds >= 0 &&
      (x.postState === null ||
        (x.postState &&
          emotions.some((e) => e.name === x.postState.primaryMood) &&
          Number.isInteger(x.postState.intensity) &&
          x.postState.intensity >= 1 &&
          x.postState.intensity <= 10)),
  );
  if (valid.length !== value.length)
    throw new Error("有记录未能读取，原始内容仍保留在浏览器中");
  return valid;
}
export function groupRecords(records, now = new Date()) {
  const today = localDay(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const groups = ["今天", "昨天", "本周更早", "更早"].map((title) => ({
    title,
    items: [],
  }));
  [...records]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .forEach((item) => {
      const day = localDay(item.createdAt);
      const index =
        day === today
          ? 0
          : day === localDay(yesterday)
            ? 1
            : new Date(item.createdAt) >= monday
              ? 2
              : 3;
      groups[index].items.push(item);
    });
  return groups.filter((g) => g.items.length);
}
export function recordsInPeriod(records, days, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return records.filter(
    (r) => new Date(r.createdAt) >= start && new Date(r.createdAt) <= now,
  );
}
export function aggregateInsights(records, days = 7, now = new Date()) {
  const selected = recordsInPeriod(records, days, now);
  const trend = Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days + 1 + i);
    const items = selected.filter(
      (r) => localDay(r.createdAt) === localDay(date) && r.overall !== null,
    );
    return {
      date: localDay(date),
      label: `${date.getMonth() + 1}.${date.getDate()}`,
      value: items.length
        ? items.reduce((a, r) => a + r.overall, 0) / items.length
        : null,
      emotions: [...new Set(items.map((x) => x.primaryMood))],
    };
  });
  const topFactors = factors
    .map((name) => ({
      name,
      count: selected.filter((r) => r.factors.includes(name)).length,
    }))
    .filter((f) => f.count)
    .sort((a, b) => b.count - a.count)
    .map((f) => ({
      ...f,
      percentage: Math.round((f.count / selected.length) * 100),
    }));
  const actions = careRecommendations
    .map((action) => {
      const items = selected.filter(
        (r) => r.actionId === action.id && r.actionCompleted,
      );
      const feedback = items.filter((r) => r.feedback);
      const helped = feedback.filter((r) => r.feedback === "lighter").length;
      return {
        ...action,
        count: items.length,
        feedbackCount: feedback.length,
        helped,
        label:
          feedback.length === 0
            ? "还没有行动反馈"
            : helped / feedback.length > 0.5
              ? "较多时候有帮助"
              : helped
                ? "有时会轻松一些"
                : "继续找到适合你的方式",
      };
    })
    .filter((a) => a.count);
  return { selected, trend, topFactors, actions };
}
export function findPattern(records) {
  const sleep = records.filter((r) => r.factors.includes("睡眠"));
  const anxiety = sleep.filter((r) => r.primaryMood === "焦虑");
  if (sleep.length >= 2 && anxiety.length / sleep.length >= 0.5)
    return `在 ${sleep.length} 次提到睡眠的记录里，有 ${anxiety.length} 次也记录了焦虑。睡眠与感受或许有关，可以继续留意。`;
  if (records.length < 3)
    return "每一次记录，都是靠近自己的一小步。再积累几次，我们一起看看情绪里藏着什么线索。";
  const counts = emotions
    .map((e) => ({
      ...e,
      count: records.filter((r) => r.primaryMood === e.name).length,
    }))
    .sort((a, b) => b.count - a.count);
  return `这段时间，你 ${counts[0].count} 次记录了「${counts[0].name}」。感受可以有很多种，慢慢留意它出现的时刻就好。`;
}
export function toCSV(records) {
  const escape = (value) => {
    const s = String(value ?? "");
    return (
      '"' + (/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'
    );
  };
  const rows = [
    [
      "记录时间",
      "主要情绪",
      "整体状态",
      "情绪强度",
      "影响因素",
      "日记",
      "关怀行动",
      "行动完成",
      "行动反馈",
      "练习秒数",
      "行动后情绪",
      "行动后强度",
    ],
    ...records.map((r) => [
      new Date(r.createdAt).toLocaleString("zh-CN"),
      r.primaryMood,
      moods.find((m) => m.value === r.overall)?.name ?? "未记录",
      r.intensity,
      r.factors.join("、"),
      r.note,
      careRecommendations.find((a) => a.id === r.actionId)?.title ?? "",
      r.actionCompleted ? "是" : "否",
      feedbackOptions.find((f) => f.value === r.feedback)?.label ?? "",
      r.elapsedSeconds ?? "",
      r.postState?.primaryMood ?? "",
      r.postState?.intensity ?? "",
    ]),
  ];
  return "\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
