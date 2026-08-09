import assert from "node:assert/strict";
import test from "node:test";

import {
  getIngredientCardLayoutMode,
  normalizeIngredientCardItems,
} from "../../src/components/recipe/ingredientCardLayout";

function item(name: string, amount = "") {
  return { name, amount };
}

test("main ingredient modes follow the compact balanced dense thresholds", () => {
  assert.equal(
    getIngredientCardLayoutMode({
      type: "main",
      items: [item("鸡腿肉", "300g")],
    }),
    "compact",
  );
  assert.equal(
    getIngredientCardLayoutMode({
      type: "main",
      items: [item("鸡腿肉"), item("土豆"), item("胡萝卜")],
    }),
    "balanced",
  );
  assert.equal(
    getIngredientCardLayoutMode({
      type: "main",
      items: [item("鸡肉"), item("土豆"), item("胡萝卜"), item("香菇")],
    }),
    "dense",
  );
});

test("side ingredient modes keep four items balanced and eight items dense", () => {
  assert.equal(
    getIngredientCardLayoutMode({
      type: "side",
      items: [
        item("花生", "50g"),
        item("干辣椒", "8个"),
        item("葱段", "20g"),
        item("花椒", "1小勺"),
      ],
    }),
    "balanced",
  );
  assert.equal(
    getIngredientCardLayoutMode({
      type: "side",
      items: Array.from({ length: 8 }, (_, index) =>
        item(`配料${index + 1}`),
      ),
    }),
    "dense",
  );
});

test("seasoning modes keep one item compact and seven items dense", () => {
  assert.equal(
    getIngredientCardLayoutMode({
      type: "seasoning",
      items: [item("生抽", "2勺")],
    }),
    "compact",
  );
  assert.equal(
    getIngredientCardLayoutMode({
      type: "seasoning",
      items: [
        item("生抽", "2勺"),
        item("老抽", "1勺"),
        item("糖", "1勺"),
        item("盐", "1勺"),
        item("淀粉", "1勺"),
        item("料酒", "1勺"),
        item("醋", "1勺"),
      ],
    }),
    "dense",
  );
});

test("normalization removes blank items and collapses repeated whitespace", () => {
  assert.deepEqual(
    normalizeIngredientCardItems([
      item("   "),
      item("\n"),
      item("  鸡腿肉  ", "  300   g  "),
      item("葱\n段", "20\tg"),
    ]),
    [
      item("鸡腿肉", "300 g"),
      item("葱 段", "20 g"),
    ],
  );
});

test("one unusually long item increases density by one level", () => {
  assert.equal(
    getIngredientCardLayoutMode({
      type: "main",
      items: [item("去骨带皮鸡腿肉切成大小均匀的小块", "300g")],
    }),
    "balanced",
  );
  assert.equal(
    getIngredientCardLayoutMode({
      type: "side",
      items: [
        item("花生"),
        item("干辣椒"),
        item("葱段"),
        item("提前泡发并切成细丝的黑木耳"),
      ],
    }),
    "dense",
  );
});
