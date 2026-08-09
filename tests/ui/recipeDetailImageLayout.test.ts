import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getRecipeAssetPresentation } from "../../src/components/recipe/RecipeAssetImage";
import { resolveHeroObjectPosition } from "../../src/components/recipe/ingredientCardLayout";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("Hero defaults legacy right-biased positions to center while preserving real overrides", () => {
  assert.equal(resolveHeroObjectPosition(), "center center");
  assert.equal(resolveHeroObjectPosition("70% 50%"), "center center");
  assert.equal(resolveHeroObjectPosition("68% 50%"), "center center");
  assert.equal(resolveHeroObjectPosition("43% 54%"), "43% 54%");
});

test("IngredientPrepCard renders deterministic layout metadata and separate regions", () => {
  const component = readProjectFile(
    "src/components/recipe/IngredientPrepCard.tsx",
  );

  assert.match(component, /getIngredientCardLayoutMode/);
  assert.match(component, /normalizeIngredientCardItems/);
  assert.match(component, /data-layout-mode=\{layoutMode\}/);
  assert.match(component, /data-ingredient-type=\{type\}/);
  assert.match(component, /styles\.ingredientTextArea/);
  assert.match(component, /styles\.ingredientPhoto/);
  assert.match(component, /styles\.ingredientArtworkSurface/);
  assert.match(component, /artworkPresentation\?:\s*RecipeAssetPresentation/);
  assert.match(component, /presentation=\{artworkPresentation\}/);
  assert.doesNotMatch(component, /ResizeObserver|getBoundingClientRect|offsetHeight/);
});

test("recipe artwork keeps a neutral fallback when an image fails to load", () => {
  const component = readProjectFile(
    "src/components/recipe/RecipeAssetImage.tsx",
  );

  assert.match(component, /RECIPE_VISUAL_FALLBACK/);
  assert.match(component, /onError=\{\(\) =>/);
  assert.match(component, /setCurrentSrc\(RECIPE_VISUAL_FALLBACK\)/);
});

test("transparent artwork requires an explicit isolated presentation", () => {
  assert.equal(
    getRecipeAssetPresentation("/images/ingredients/chicken.png"),
    "photographic",
  );
  assert.equal(
    getRecipeAssetPresentation(
      "/images/ingredients/chicken.PNG?v=2#preview",
      "isolated",
    ),
    "isolated",
  );
  assert.equal(
    getRecipeAssetPresentation(
      "/images/ingredients/chicken.webp",
      "isolated",
    ),
    "isolated",
  );
});

test("isolated artwork is unmasked, uncropped, and shadowed by its transparent silhouette", () => {
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(
    styles,
    /\.ingredientArtworkSurface:has\([\s\S]*data-asset-presentation="isolated"[\s\S]*\)\s*\{[\s\S]*flex:\s*0\s+0\s+var\(--artwork-width\);[\s\S]*aspect-ratio:\s*auto;[\s\S]*overflow:\s*visible;[\s\S]*mask-image:\s*none;/,
  );
  assert.match(
    styles,
    /\.ingredientPhotoImage\[data-asset-presentation="isolated"\]\s*\{[\s\S]*object-fit:\s*contain;[\s\S]*drop-shadow[\s\S]*transform:\s*none;/,
  );
  assert.match(
    styles,
    /\.ingredientPhoto:has\([\s\S]*data-asset-presentation="isolated"[\s\S]*\)\s*\{[\s\S]*grid-area:\s*1\s*\/\s*1\s*\/\s*-1\s*\/\s*-1;[\s\S]*pointer-events:\s*none;/,
  );
  assert.match(
    styles,
    /\.ingredientCard\[data-ingredient-type="main"\][\s\S]*data-asset-presentation="isolated"[\s\S]*--artwork-width:\s*80%;[\s\S]*--artwork-x:\s*-4%;[\s\S]*--artwork-y:\s*1%;/,
  );
  assert.match(
    styles,
    /\.ingredientCard\[data-ingredient-type="side"\][\s\S]*data-asset-presentation="isolated"[\s\S]*--artwork-width:\s*76%;[\s\S]*--artwork-x:\s*2%;[\s\S]*--artwork-y:\s*10%;/,
  );
  assert.match(
    styles,
    /\.ingredientCard\[data-ingredient-type="side"\][\s\S]*\.ingredientPhotoImage\[data-asset-presentation="isolated"\]\s*\{[\s\S]*transform:\s*scaleX\(-1\);/,
  );
  assert.match(
    styles,
    /\.ingredientCard\[data-ingredient-type="seasoning"\][\s\S]*data-asset-presentation="isolated"[\s\S]*--artwork-width:\s*72%;[\s\S]*--artwork-x:\s*-3%;[\s\S]*--artwork-y:\s*1%;/,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*data-asset-presentation="isolated"[\s\S]*animation:\s*none;/,
  );
});

test("Hero still life shifts toward the copy without changing the grid", () => {
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(
    styles,
    /\.heroPhoto\s*\{[\s\S]*width:\s*calc\(100%\s*\+\s*8px\);[\s\S]*transform:\s*translateX\(-8px\);/,
  );
  assert.match(
    styles,
    /\.heroPhotoImage\s*\{[\s\S]*ellipse 68% 22% at 60% 50%[\s\S]*mix-blend-mode:\s*multiply;/,
  );
});

test("ingredient images use right-side grids, transparent artwork, and type-specific feathering", () => {
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(
    styles,
    /\.ingredientCard\s*\{[\s\S]*grid-template-areas:\s*"text image"/,
  );
  assert.match(
    styles,
    /\[data-layout-mode="compact"\][\s\S]*grid-template-columns:\s*minmax\(0,\s*42%\)\s+minmax\(0,\s*58%\)/,
  );
  assert.match(
    styles,
    /\[data-layout-mode="balanced"\][\s\S]*grid-template-columns:\s*minmax\(0,\s*56%\)\s+minmax\(0,\s*44%\)/,
  );
  assert.match(
    styles,
    /\[data-layout-mode="dense"\][\s\S]*grid-template-columns:\s*minmax\(0,\s*66%\)\s+minmax\(0,\s*34%\)/,
  );
  assert.match(
    styles,
    /\.ingredientPhoto\s*\{[\s\S]*background:\s*transparent/,
  );
  assert.match(
    styles,
    /\.ingredientArtworkSurface\s*\{[\s\S]*aspect-ratio:\s*4\s*\/\s*3;[\s\S]*align-self:\s*end/,
  );
  assert.match(
    styles,
    /\.ingredientPhotoImage\s*\{[\s\S]*object-fit:\s*contain;[\s\S]*object-position:\s*center bottom;[\s\S]*transform:\s*scale\(1\.55\);[\s\S]*transform-origin:\s*center bottom/,
  );
  assert.match(
    styles,
    /\.ingredientTextArea h3\s*\{[\s\S]*font-size:\s*13px;[\s\S]*white-space:\s*nowrap/,
  );
  assert.match(
    styles,
    /\[data-ingredient-type="main"\]\s+\.ingredientArtworkSurface[\s\S]*mask-image:/,
  );
  assert.match(
    styles,
    /\[data-ingredient-type="side"\]\s+\.ingredientArtworkSurface[\s\S]*mask-image:/,
  );
  assert.match(
    styles,
    /\[data-ingredient-type="seasoning"\]\s+\.ingredientArtworkSurface[\s\S]*mask-image:/,
  );
  assert.doesNotMatch(
    styles,
    /\.ingredientPhoto\s*\{[^}]*position:\s*absolute/,
  );
  assert.doesNotMatch(styles, /\.ingredientPhoto\s*\{[^}]*box-shadow:/);
});

test("narrow screens keep the two-column card structure without a bottom banner", () => {
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(styles, /@media \(max-width:\s*340px\)/);
  assert.match(
    styles,
    /@media \(max-width:\s*340px\)[\s\S]*\.ingredientArtworkSurface\s*\{[\s\S]*transform:\s*scale\(\.9\)/,
  );
  assert.doesNotMatch(
    styles,
    /\.ingredientCard\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) \d+px/,
  );
});
