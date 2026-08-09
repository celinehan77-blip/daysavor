import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  getIngredientGroupImage,
  getProteinImage,
  getSeasoningImage,
  getStepImage,
  RECIPE_ASSET_FALLBACK,
} from "../../src/components/recipe/recipeAssetMatcher";
import type { Ingredient } from "../../src/types";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

function ingredient(
  name: string,
  group: Ingredient["group"] = "side",
): Ingredient {
  return {
    amount: "适量",
    group,
    id: `${group}-${name}`,
    name,
    note: "",
  };
}

test("recipe detail keeps the description, photo, and stats in normal flow", () => {
  const screen = readProjectFile(
    "src/components/recipe/RecipeDetailScreen.tsx",
  );
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(screen, /className=\{styles\.heroBody\}/);
  assert.match(screen, /className=\{styles\.heroCopy\}/);
  assert.match(screen, /className=\{styles\.heroPhoto\}/);
  assert.match(styles, /\.heroBody\s*\{[\s\S]*display:\s*grid/);
  assert.match(
    styles,
    /\.heroDescription\s*\{[\s\S]*-webkit-line-clamp:\s*3/,
  );
  assert.match(styles, /\.statsCard\s*\{[\s\S]*margin-top:\s*18px/);
  assert.doesNotMatch(screen, /h-\[236px\]/);
});

test("ingredient text and photography use independent card regions", () => {
  const screen = readProjectFile(
    "src/components/recipe/RecipeDetailScreen.tsx",
  );
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(
    styles,
    /\.ingredientCard\s*\{[\s\S]*grid-template-areas:\s*"text image"/,
  );
  assert.match(styles, /\.ingredientText\s*\{[\s\S]*overflow:\s*hidden/);
  assert.match(
    styles,
    /\.ingredientPhotoImage\s*\{[\s\S]*object-fit:\s*contain/,
  );
  assert.match(screen, /<IngredientPrepCard[\s\S]*image=\{group\.image\}/);
});

test("bottom bar removes notes and gives the primary save action more room", () => {
  const screen = readProjectFile(
    "src/components/recipe/RecipeDetailScreen.tsx",
  );
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.doesNotMatch(screen, /NotebookPen|记笔记/);
  assert.match(styles, /grid-template-columns:[^;]*0\.8fr[^;]*0\.8fr[^;]*1\.6fr/);
  assert.match(screen, /加入收藏/);
});

test("keyword matching selects stable static assets with a neutral fallback", () => {
  assert.equal(
    getProteinImage([ingredient("鸡腿", "main")]),
    "/images/recipe-assets/proteins/chicken.png",
  );
  assert.equal(
    getIngredientGroupImage([ingredient("干辣椒"), ingredient("花椒")]),
    "/images/recipe-assets/ingredients/chili-peppercorn.png",
  );
  assert.equal(
    getSeasoningImage([ingredient("生抽", "seasoning")]),
    "/images/recipe-assets/seasonings/soy-vinegar-wine.png",
  );
  assert.equal(
    getStepImage("加入鸡肉大火翻炒至变色"),
    "/images/recipe-assets/steps/stir-frying.png",
  );
  assert.equal(getStepImage("完成一个未知动作"), RECIPE_ASSET_FALLBACK);

  for (const path of [
    "public/images/recipe-assets/proteins/chicken.png",
    "public/images/recipe-assets/ingredients/chili-peppercorn.png",
    "public/images/recipe-assets/seasonings/soy-vinegar-wine.png",
    "public/images/recipe-assets/steps/cutting.png",
    "public/images/recipe-assets/steps/marinating.png",
    "public/images/recipe-assets/steps/preparing.png",
    "public/images/recipe-assets/steps/frying-aromatics.png",
    "public/images/recipe-assets/steps/stir-frying.png",
    "public/images/recipe-assets/steps/thickening-sauce.png",
    "public/images/recipe-assets/steps/plating.png",
    "public/images/recipe-assets/fallback/neutral-food.png",
  ]) {
    assert.equal(existsSync(new URL(path, projectRoot)), true, path);
  }
});
