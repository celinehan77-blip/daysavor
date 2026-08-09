import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { SerializableRecipe } from "../../src/types";

const stationFoodMapPath =
  "../../src/components/station/StationFoodMapArtwork";

const recipe: SerializableRecipe = {
  id: "recipe-kung-pao",
  slug: "kung-pao-chicken",
  titleZh: "宫保鸡丁",
  titleEn: "Kung Pao Chicken",
  stationId: "station-chicken",
  coverType: "ticket",
  timeMinutes: 25,
  difficulty: "简单",
  flavor: "川味",
  mainIngredient: "鸡肉 · 花生 · 干辣椒 · 花椒",
  primaryCategory: "chicken",
  primaryIngredient: "鸡腿肉",
  tags: ["川菜"],
  description: "",
  ingredients: [
    {
      id: "chicken",
      name: "鸡腿肉",
      amount: "300g",
      group: "main",
      note: "切丁",
    },
  ],
  seasonings: [
    {
      id: "chili",
      name: "干辣椒",
      amount: "8个",
      group: "seasoning",
      note: "切段",
    },
  ],
  steps: [],
  savedCount: 0,
};

const photographicRecipe: SerializableRecipe = {
  ...recipe,
  id: "recipe-tomato-beef",
  slug: "tomato-beef",
  titleZh: "番茄豆腐滑牛肉",
  titleEn: "Tomato Tofu Beef",
  stationId: "station-beef",
  primaryCategory: "beef",
  primaryIngredient: "牛肉",
  mainIngredient: "牛肉 · 番茄 · 豆腐",
};

test("Station food map renders a semantic local image in the reserved area", async () => {
  const foodMapModule = (await import(stationFoodMapPath).catch(() => null)) as
    | {
        StationFoodMapArtwork: (props: {
          compact?: boolean;
          imageFailed: boolean;
          recipe: SerializableRecipe;
        }) => React.ReactNode;
      }
    | null;

  assert.ok(foodMapModule, "StationFoodMap component should exist");
  const markup = renderToStaticMarkup(
    createElement(foodMapModule.StationFoodMapArtwork, {
      imageFailed: false,
      recipe,
    }),
  );

  assert.match(markup, /station-chicken-kung-pao-/);
  assert.match(markup, /station-covers\//);
  assert.match(markup, /data-station-visual="image"/);
  assert.match(markup, /data-station-asset-presentation="isolated"/);
  assert.doesNotMatch(markup, /data-station-visual="legacy-css"/);
  assert.doesNotMatch(markup, /鸡腿肉|切丁|干辣椒|切段/);
});

test("Station eagerly loads the active photographic cover and marks it for paper blending", async () => {
  const { StationFoodMapArtwork } = await import(stationFoodMapPath);
  const markup = renderToStaticMarkup(
    createElement(StationFoodMapArtwork, {
      imageFailed: false,
      recipe: photographicRecipe,
    }),
  );

  assert.match(markup, /data-station-asset-presentation="photographic"/);
  assert.match(markup, /loading="eager"/);
  assert.match(markup, /h-\[190px\]/);
  assert.match(markup, /src="\/images\/recipe-library\/station-visuals\/beef\//);
  assert.doesNotMatch(markup, /_next\/image\?url=/);
});

test("Station food map never falls back to CSS-drawn ingredients", async () => {
  const { StationFoodMapArtwork } = await import(stationFoodMapPath);
  const markup = renderToStaticMarkup(
    createElement(StationFoodMapArtwork, {
      imageFailed: true,
      recipe,
    }),
  );

  assert.match(markup, /data-station-visual="unavailable"/);
  assert.doesNotMatch(markup, /data-station-visual="legacy-css"/);
  assert.doesNotMatch(markup, /station-covers\//);
});
