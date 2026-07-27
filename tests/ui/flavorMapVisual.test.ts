import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("chef category themes are fixed for every supported category", () => {
  const source = readProjectFile(
    "src/components/flavor-map/chefCategoryThemes.ts",
  );
  const expectedThemes = [
    ["chicken", "#E1E1CC", "#6F795D", "#3D3025"],
    ["duck", "#E6D7AE", "#8A7544", "#443629"],
    ["pork", "#E7D0C7", "#A06F60", "#4B342E"],
    ["beef", "#E5C7A3", "#925B32", "#493326"],
    ["lamb", "#D9D0C0", "#756858", "#40362D"],
    ["fish", "#D7E1E8", "#55778A", "#294A59"],
    ["shrimp", "#E8D0BE", "#B36F52", "#53372D"],
    ["crab", "#DFC1B3", "#9C5645", "#4E3029"],
    ["other", "#DDD9D0", "#777168", "#3F3A34"],
  ];

  for (const [id, paper, accent, text] of expectedThemes) {
    assert.match(source, new RegExp(`${id}:[\\s\\S]*paper: "${paper}"`));
    assert.match(source, new RegExp(`${id}:[\\s\\S]*accent: "${accent}"`));
    assert.match(source, new RegExp(`${id}:[\\s\\S]*text: "${text}"`));
  }

  assert.doesNotMatch(source, /Math\.random|recipeCount.*(?:paper|accent|text)/);
});

test("the shared ticket consumes view-model props and keeps empty categories linked", () => {
  const source = readProjectFile(
    "src/components/flavor-map/ChefTicket.tsx",
  );

  assert.match(source, /category:\s*ChefCategoryViewModel/);
  assert.match(source, /href=\{category\.href\}/);
  assert.match(source, /\{category\.displayName\}/);
  assert.match(source, /\{category\.englishName/);
  assert.match(source, /\{category\.description\}/);
  assert.match(source, /\{category\.recipeCount\}/);
  assert.match(source, /category\.latestRecipeName/);
  assert.match(source, /还没有新的菜谱/);
  assert.match(source, /chef-ticket-perforation/);
  assert.match(source, /chef-ticket-notch/);
  assert.match(source, /chef-ticket-barcode/);
  assert.match(source, /active:scale-\[0\.985\]/);
  assert.match(source, /data-depth=\{depth\}/);
  assert.doesNotMatch(source, /getPersonalRecipes|getChefCategories|supabase/i);
});

test("the flavor map renders a scalable overlapping stack from category view models", () => {
  const source = readProjectFile(
    "src/components/flavor-map/FlavorMapScreen.tsx",
  );

  assert.match(source, /useChefCategories\(\)/);
  assert.match(source, /const \{ categories, error, isLoading \}/);
  assert.match(source, /categories\.map/);
  assert.match(source, /<ChefTicket/);
  assert.match(source, /category=\{category\}/);
  assert.match(source, /styles\.ticketStackInset/);
  assert.match(source, /-mt-\[18px\]/);
  assert.match(source, /都是一类值得收藏的味道/);
  assert.doesNotMatch(
    source,
    /getChefCategories|getPersonalRecipes|buildChefCategoryViewModels/,
  );
  assert.doesNotMatch(source, /IosStatusBar|9:41|Chicken Station/);
});

test("ticket proportions, center shadow, and stamp match the refined visual spec", () => {
  const source = readProjectFile(
    "src/components/flavor-map/FlavorMap.module.css",
  );

  assert.match(
    source,
    /\.ticketStackInset\s*\{[\s\S]*margin-inline:\s*8px/,
  );
  assert.match(
    source,
    /@media\s*\(max-width:\s*340px\)[\s\S]*\.ticketStackInset\s*\{[\s\S]*margin-inline:\s*0/,
  );
  assert.match(source, /\.ticket\s*\{[\s\S]*height:\s*178px/);
  assert.match(
    source,
    /\.ticketLink::after\s*\{[\s\S]*radial-gradient[\s\S]*filter:\s*blur/,
  );
  assert.match(
    source,
    /\.ticketLink\[data-depth="1"\]::after[\s\S]*opacity:/,
  );
  assert.match(source, /\.stamp\s*\{[\s\S]*width:\s*72px[\s\S]*height:\s*72px/);
});
