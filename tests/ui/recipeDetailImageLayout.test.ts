import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("recipe detail images preserve subjects and keep ingredient text safe", () => {
  const styles = readProjectFile(
    "src/components/recipe/RecipeDetail.module.css",
  );

  assert.match(
    styles,
    /\.heroPhotoImage\s*\{[\s\S]*?object-fit:\s*contain;[\s\S]*?object-position:\s*center center;/,
  );
  assert.match(
    styles,
    /\.ingredientCard\s*\{[\s\S]*?grid-template-areas:\s*"text"\s*"image";/,
  );
  assert.match(
    styles,
    /\.ingredientPhoto\s*\{[\s\S]*?justify-self:\s*end;[\s\S]*?width:\s*calc\(100% - \d+px\);/,
  );
  assert.match(
    styles,
    /\.ingredientPhotoImage\s*\{[\s\S]*?object-fit:\s*contain;[\s\S]*?object-position:\s*center center;/,
  );
  assert.doesNotMatch(
    styles,
    /\.ingredientPhoto\s*\{[\s\S]*?(?:mask-image|backdrop-filter|filter:\s*blur)/,
  );
  assert.doesNotMatch(
    styles,
    /\.ingredientPhoto\s*\{[\s\S]*?(?:position:\s*absolute|margin(?:-[a-z]+)?:\s*-\d)/,
  );
});
