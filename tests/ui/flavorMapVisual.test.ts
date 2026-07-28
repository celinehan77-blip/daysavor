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
  assert.doesNotMatch(source, /chef-ticket-notch|styles\.notch/);
  assert.match(source, /chef-ticket-barcode/);
  assert.match(source, /active:scale-\[0\.985\]/);
  assert.match(source, /data-depth=\{depth\}/);
  assert.match(source, /<svg[\s\S]*viewBox="0 0 100 100"/);
  assert.match(source, /<textPath/);
  assert.match(source, /styles\.stampAnimal/);
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
  assert.match(source, /styles\.travelTag/);
  assert.match(source, /styles\.airMailMark/);
  assert.match(source, /探索美食世界/);
  assert.match(source, /从这里出发/);
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
    /\.ticket\s*\{[^}]*0 3px 5px rgb\(65 48 32 \/ 16%\)[^}]*0 10px 22px rgb\(65 48 32 \/ 10%\)/,
  );
  assert.match(
    source,
    /\.ticket\[data-depth="1"\]\s*\{[^}]*0 3px 5px rgb\(65 48 32 \/ 13%\)/,
  );
  assert.match(source, /\.stamp\s*\{[\s\S]*width:\s*84px[\s\S]*height:\s*84px/);
});

test("paper, typography, and edge details stay subtle and high fidelity", () => {
  const source = readProjectFile(
    "src/components/flavor-map/FlavorMap.module.css",
  );

  assert.match(
    source,
    /\.screen::before\s*\{[\s\S]*repeating-linear-gradient[\s\S]*opacity:/,
  );
  assert.match(source, /\.screen::after\s*\{[\s\S]*radial-gradient/);
  assert.match(source, /\.travelTag\s*\{[\s\S]*width:\s*clamp\(/);
  assert.match(source, /\.travelTagPin\s*\{[\s\S]*border-radius:\s*50%/);
  assert.match(source, /\.airMailMark\s*\{[\s\S]*opacity:/);
  assert.match(source, /\.ticket\s*\{[\s\S]*border-radius:\s*16px/);
  assert.match(source, /\.main::after\s*\{[\s\S]*radial-gradient/);
  assert.match(
    source,
    /\.title\s*\{[\s\S]*font-size:\s*clamp\([^;]*31px\)/,
  );
  assert.match(source, /\.description\s*\{[\s\S]*max-width:\s*82%/);
  assert.match(source, /\.meta\s*\{[\s\S]*margin-top:\s*20px/);
  assert.match(source, /\.stamp\s*\{[\s\S]*width:\s*84px[\s\S]*height:\s*84px/);
});

test("final polish keeps cotton grain and overlaps complete rounded tickets", () => {
  const source = readProjectFile(
    "src/components/flavor-map/FlavorMap.module.css",
  );

  assert.match(
    source,
    /\.stack\s*>\s*div\s*\+\s*div\s+\.main\s*\{[\s\S]*padding-top:\s*24px/,
  );
  assert.match(
    source,
    /\.ticket::after\s*\{[\s\S]*feTurbulence[\s\S]*background-size:\s*100%\s+100%[\s\S]*background-repeat:\s*no-repeat/,
  );
  assert.doesNotMatch(
    source,
    /\.ticket::before\s*\{[^}]*repeating-linear-gradient/,
  );
  assert.doesNotMatch(source, /\.main::before\s*\{[^}]*url\(/);
  assert.doesNotMatch(source, /\.main::after\s*\{[^}]*url\(/);
  assert.match(source, /\.main::before\s*\{[^}]*radial-gradient/);
  assert.match(
    source,
    /\.ticket::after\s*\{[\s\S]*feDisplacementMap[\s\S]*feGaussianBlur/,
  );
  assert.match(source, /cx='220'\s+cy='66'/);
  assert.match(
    source,
    /\.ticket\s*\{[\s\S]*border-radius:\s*16px[\s\S]*0 3px 5px rgb\(65 48 32 \/ 16%\)[\s\S]*0 10px 22px rgb\(65 48 32 \/ 10%\)/,
  );
  assert.doesNotMatch(source, /\.ticket\s*\{[^}]*mask-image:/);
  assert.doesNotMatch(source, /\.ticket\s*\{[^}]*-webkit-mask-image:/);
  assert.doesNotMatch(source, /\.ticket\s*\{[^}]*clip-path:/);
  assert.doesNotMatch(source, /\.ticketLink::before/);
  assert.doesNotMatch(source, /\.ticketLink::after/);
  assert.doesNotMatch(source, /\.notch(?:Top|Bottom)?\s*\{/);
});

test("two complete rounded cards expose a natural 4-8px branch when overlapped", () => {
  const screenSource = readProjectFile(
    "src/components/flavor-map/FlavorMapScreen.tsx",
  );
  const styleSource = readProjectFile(
    "src/components/flavor-map/FlavorMap.module.css",
  );

  const radius = Number(
    styleSource.match(/\.ticket\s*\{[^}]*border-radius:\s*(\d+)px/)?.[1],
  );
  const overlap = Number(screenSource.match(/-mt-\[(\d+)px\]/)?.[1]);
  const cornerCenterDistance = radius * 2 - overlap;
  const exposedBranch = cornerCenterDistance / 2;

  assert.equal(radius, 16);
  assert.equal(overlap, 18);
  assert.ok(exposedBranch >= 4 && exposedBranch <= 8);
});
