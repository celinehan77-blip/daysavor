import assert from "node:assert/strict";
import test from "node:test";

import { groundParsedRecipeDraft } from "../../src/lib/ai/groundParsedRecipe";
import type { ParsedRecipeDraft } from "../../src/types/ai";

function makeDraft(): ParsedRecipeDraft {
  return {
    titleZh: "测试菜谱",
    titleEn: "Test Recipe",
    description: "用于测试来源事实校验的菜谱。",
    timeMinutes: 20,
    difficulty: "简单",
    flavor: "家常",
    mainIngredient: "鸡肉",
    primaryCategory: "chicken",
    primaryIngredient: "鸡肉",
    classificationConfidence: 0.9,
    classificationReason: "主食材为鸡肉",
    classificationSource: "rule",
    tags: ["鸡肉"],
    ingredients: [
      { name: "鸡肉", amount: "适量", group: "main", note: "" },
    ],
    seasonings: [
      { name: "盐", amount: "适量", group: "seasoning", note: "" },
    ],
    steps: [
      {
        title: "腌制鸡肉",
        description: "鸡肉腌制后备用。",
        duration: "约 5 分钟",
        heat: "大火",
        tips: "最后放油可以锁住水分。",
      },
      {
        title: "煸炒鸡肉",
        description: "中小火煸炒鸡肉，不要加水。",
        duration: "20 分钟",
        heat: "中小火",
        tips: "千万不能加水，否则影响口感。",
      },
    ],
    confidence: 0.8,
    warnings: [],
  };
}

test("grounding guard estimates key step duration while keeping prep steps unspecified", () => {
  const grounded = groundParsedRecipeDraft(
    makeDraft(),
    "鸡肉加调料腌制。然后中小火慢慢煸炒20分钟，千万别加水，要不然口感不好。",
  );

  assert.equal(grounded.steps[0]?.duration, "15 分钟");
  assert.equal(grounded.steps[0]?.heat, "未说明");
  assert.equal(grounded.steps[0]?.tips, "");
  assert.equal(grounded.steps[1]?.duration, "20 分钟");
  assert.equal(grounded.steps[1]?.heat, "中小火");
  assert.match(grounded.steps[1]?.tips ?? "", /不能加水/);
  assert.ok(grounded.warnings.some((warning) => warning.includes("步骤时间")));
  assert.ok(grounded.warnings.some((warning) => warning.includes("步骤火候")));
  assert.ok(grounded.warnings.some((warning) => warning.includes("步骤提示")));
});

test("grounding guard accepts equivalent time and temperature formats", () => {
  const draft = makeDraft();
  draft.steps = [
    {
      title: "烤制鸡翅",
      description: "鸡翅烤熟。",
      duration: "30 分钟",
      heat: "180°C",
      tips: "",
    },
    {
      title: "继续加热",
      description: "翻面继续加热。",
      duration: "1-2 分钟",
      heat: "高火",
      tips: "",
    },
  ];

  const grounded = groundParsedRecipeDraft(
    draft,
    "鸡翅180度烤半个小时，翻面后高火再加1到2分钟。",
  );

  assert.equal(grounded.steps[0]?.duration, "30 分钟");
  assert.equal(grounded.steps[0]?.heat, "180°C");
  assert.equal(grounded.steps[1]?.duration, "1-2 分钟");
  assert.equal(grounded.steps[1]?.heat, "高火");
});

test("grounding guard labels estimated amounts without overriding source amounts", () => {
  const draft = makeDraft();
  draft.ingredients = [
    { name: "鸡蛋", amount: "4 个", group: "main", note: "" },
  ];
  draft.seasonings = [
    { name: "盐", amount: "1 茶匙", group: "seasoning", note: "调味" },
  ];

  const grounded = groundParsedRecipeDraft(draft, "打4个鸡蛋，加入盐调味。");

  assert.equal(grounded.ingredients[0]?.note, "");
  assert.equal(
    grounded.seasonings[0]?.note,
    "调味；AI估算（按2人份）",
  );
  assert.ok(grounded.warnings.some((warning) => warning.includes("数值用量")));
});

test("grounding guard keeps author amounts and replaces vague amounts with safe two-serving estimates", () => {
  const draft = makeDraft();
  draft.ingredients = [
    { name: "草鱼", amount: "适量", group: "main", note: "" },
    { name: "姜", amount: "适量", group: "side", note: "" },
  ];
  draft.seasonings = [
    { name: "生抽", amount: "适量", group: "seasoning", note: "" },
    { name: "盐", amount: "适量", group: "seasoning", note: "" },
  ];

  const grounded = groundParsedRecipeDraft(
    draft,
    "准备草鱼500克，姜和生抽适量，再放盐调味。",
  );

  assert.equal(grounded.ingredients[0]?.amount, "500 克");
  assert.equal(grounded.ingredients[0]?.note, "");
  assert.equal(grounded.ingredients[1]?.amount, "3 片");
  assert.equal(grounded.seasonings[0]?.amount, "1 汤匙");
  assert.equal(grounded.seasonings[1]?.amount, "2 克");
  assert.match(grounded.seasonings[0]?.note ?? "", /AI估算（按2人份）/);
  assert.equal(
    [...grounded.ingredients, ...grounded.seasonings].some(
      (item) => item.amount === "适量",
    ),
    false,
  );
});

test("grounding guard preserves an author's explicit 少许 wording", () => {
  const draft = makeDraft();
  draft.seasonings = [
    { name: "白胡椒", amount: "少许", group: "seasoning", note: "" },
  ];

  const grounded = groundParsedRecipeDraft(draft, "最后加入白胡椒少许。 ");

  assert.equal(grounded.seasonings[0]?.amount, "少许");
  assert.equal(grounded.seasonings[0]?.note, "");
});

test("grounding guard only estimates timing for time-sensitive cooking actions", () => {
  const draft = makeDraft();
  draft.steps = [
    {
      title: "切肉备料",
      description: "将梅花肉切片，辣椒切段。",
      duration: "未说明",
      heat: "未说明",
      tips: "",
    },
    {
      title: "腌制梅花肉",
      description: "梅花肉加入调料抓匀腌制。",
      duration: "未说明",
      heat: "未说明",
      tips: "",
    },
    {
      title: "干煸辣椒",
      description: "辣椒下锅干煸出香味。",
      duration: "未说明",
      heat: "未说明",
      tips: "",
    },
    {
      title: "炒五花肉",
      description: "五花肉下锅炒至变色。",
      duration: "未说明",
      heat: "未说明",
      tips: "",
    },
  ];

  const grounded = groundParsedRecipeDraft(
    draft,
    "梅花肉切片，辣椒切段。梅花肉加调料抓匀，再干煸辣椒，最后下五花肉炒至变色。",
  );

  assert.equal(grounded.steps[0]?.duration, "未说明");
  assert.equal(grounded.steps[1]?.duration, "15 分钟");
  assert.equal(grounded.steps[2]?.duration, "2 分钟");
  assert.equal(grounded.steps[3]?.duration, "2 分钟");
});
