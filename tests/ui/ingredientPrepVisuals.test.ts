import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { getIngredientPrepVisuals } from "../../src/lib/recipe-visual/ingredientPrepVisuals";
import type { RecipeCategoryId } from "../../src/types/classification";

test("Recipe Detail maps supported protein categories to complete isolated cutouts", () => {
  const expected = {
    chicken: "chicken-thigh-cutout.png",
    pork: "pork-cutout.png",
    beef: "beef-cutout.png",
    lamb: "lamb-cutout.png",
    fish: "fish-cutout.png",
  } as const;

  for (const [category, filename] of Object.entries(expected)) {
    const visuals = getIngredientPrepVisuals(category as RecipeCategoryId);

    assert.equal(visuals.main?.presentation, "isolated");
    assert.ok(visuals.main?.src.endsWith(filename), visuals.main?.src);
    assert.ok(
      existsSync(new URL(`../../public${visuals.main?.src}`, import.meta.url)),
      visuals.main?.src,
    );
  }
});

test("unsupported categories never borrow another protein cutout", () => {
  for (const category of ["duck", "shrimp", "crab", "other"] as const) {
    assert.equal(getIngredientPrepVisuals(category).main, null, category);
  }

  assert.equal(getIngredientPrepVisuals(undefined).main, null);
});

test("side and seasoning cards use the approved vertical cutouts", () => {
  const visuals = getIngredientPrepVisuals("pork");

  assert.deepEqual(visuals.side, {
    presentation: "isolated",
    src: "/images/recipe-library/cutouts/ingredients/kungpao-garnish-cutout.png",
  });
  assert.deepEqual(visuals.seasoning, {
    presentation: "isolated",
    src: "/images/recipe-library/cutouts/seasonings/seasoning-cutout.png",
  });
});
