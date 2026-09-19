import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShareRecipeSource,
  isGroundedShareRecipeUsable,
} from "../../src/lib/generation/generateRecipeFromShareLink";
import type { ParsedRecipeDraft } from "../../src/types/ai";

const sparseButUsableRecipe: ParsedRecipeDraft = {
  classificationConfidence: 0.9,
  classificationReason: "主食材为鱼片",
  classificationSource: "rule",
  confidence: 0.72,
  description: "根据短视频口播整理的家常椒麻鱼片。",
  difficulty: "简单",
  flavor: "椒麻",
  ingredients: [
    { amount: "适量", group: "main", name: "鱼片", note: "" },
    { amount: "适量", group: "side", name: "青椒", note: "" },
  ],
  mainIngredient: "鱼片",
  primaryCategory: "fish",
  primaryIngredient: "鱼片",
  seasonings: [],
  steps: [
    { description: "鱼片清洗后沥干水分。", duration: "未说明", heat: "未说明", tips: "", title: "处理鱼片" },
    { description: "青椒切好后下锅炒香。", duration: "未说明", heat: "未说明", tips: "", title: "炒香青椒" },
    { description: "放入鱼片翻炒至熟后出锅。", duration: "未说明", heat: "未说明", tips: "", title: "炒熟出锅" },
  ],
  tags: [],
  timeMinutes: 15,
  titleEn: "Pepper Fish Fillets",
  titleZh: "椒麻鱼片",
  warnings: ["部分调料用量由模型估算。"],
};

test("accepts a sparse but grounded short-video recipe for MVP", () => {
  const transcript =
    "今天做椒麻鱼片，鱼片清洗以后沥干，青椒切好炒香，再放鱼片一起翻炒，熟了以后直接出锅。";

  assert.equal(isGroundedShareRecipeUsable(sparseButUsableRecipe, transcript), true);
});

test("still rejects a recipe whose ingredients are not grounded in transcript", () => {
  const transcript =
    "今天分享一道简单快手菜，先把食材处理好，然后下锅翻炒，最后装盘就可以了。";

  assert.equal(isGroundedShareRecipeUsable(sparseButUsableRecipe, transcript), false);
});

test("accepts one main ingredient when grounded seasonings make the recipe usable", () => {
  const draft = {
    ...sparseButUsableRecipe,
    ingredients: [sparseButUsableRecipe.ingredients[0]],
    seasonings: [
      { amount: "6 克", group: "seasoning" as const, name: "盐", note: "" },
      { amount: "1 汤匙", group: "seasoning" as const, name: "花椒", note: "" },
    ],
  };
  const transcript =
    "盐水鸡腿先把盐和花椒炒黄，抹到鸡腿上隔夜腌制，第二天洗净后小火煮二十分钟。";

  assert.equal(isGroundedShareRecipeUsable(draft, transcript), true);
});

test("accepts a disclosed title-backed estimate but rejects an undisclosed one", () => {
  const titleBacked = {
    ...sparseButUsableRecipe,
    ingredients: [
      { amount: "500 克", group: "main" as const, name: "排骨", note: "AI估算（按2人份）" },
    ],
    seasonings: [
      { amount: "2 汤匙", group: "seasoning" as const, name: "辣椒", note: "AI估算（按2人份）" },
    ],
    warnings: ["仅根据视频标题估算食材与步骤"],
  };
  const source = buildShareRecipeSource(
    "香辣排骨教程",
    "视频使用背景音乐，没有可用的步骤口播内容。",
  );

  assert.equal(isGroundedShareRecipeUsable(titleBacked, source), true);
  assert.equal(
    isGroundedShareRecipeUsable({ ...titleBacked, warnings: [] }, source),
    false,
  );
});
