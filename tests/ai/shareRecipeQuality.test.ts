import assert from "node:assert/strict";
import test from "node:test";

import { isGroundedShareRecipeUsable } from "../../src/lib/generation/generateRecipeFromShareLink";
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
