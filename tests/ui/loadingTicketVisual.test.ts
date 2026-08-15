import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const screenPath = "src/components/loading/TicketLoadingScreen.tsx";
const stylesPath =
  "src/components/loading/TicketLoadingScreen.module.css";

test("loading screen renders four generic recipe tickets without stale titles", () => {
  const source = readFileSync(screenPath, "utf8");

  assert.match(source, /ticketLayers\.map/);
  assert.match(source, /你的菜谱/);
  assert.match(source, /Your Recipe/);
  assert.match(source, /食材识别完成/);
  assert.match(source, /步骤整理完成/);
  assert.match(source, /票根制作完成/);
  assert.match(source, /INGREDIENTS VERIFIED/);
  assert.match(source, /RECIPE CREATED/);
  assert.match(source, /TICKET READY/);
  assert.match(source, /ticket\.variant === "recipe"/);
  assert.match(source, /key=\{ticket\.id\}/);
  assert.doesNotMatch(source, /getLatestParsedDraft|recipeTitle/);
  assert.doesNotMatch(source, /COLLECTION IN PROGRESS/);
});

test("four complete tickets use equal proportions and deterministic stacking", () => {
  assert.equal(existsSync(stylesPath), true);
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(styles, /\.ticket\s*\{[\s\S]*aspect-ratio:\s*2\s*\/\s*1/);
  assert.match(styles, /\.ticketLayer\s*\{[\s\S]*position:\s*absolute/);
  assert.match(styles, /\.layerOne\s*\{[\s\S]*z-index:\s*40/);
  assert.match(styles, /\.layerTwo\s*\{[\s\S]*z-index:\s*30/);
  assert.match(styles, /\.layerThree\s*\{[\s\S]*z-index:\s*20/);
  assert.match(styles, /\.layerFour\s*\{[\s\S]*z-index:\s*10/);
  assert.doesNotMatch(styles, /Math\.random|clip-path/);
});

test("loading hint stays truthful while background generation is deferred", () => {
  const source = readFileSync(screenPath, "utf8");

  assert.match(source, /AI 生成中[\s\S]*大约需要 10[–-]20 秒/);
  assert.doesNotMatch(source, /切换到后台|后台继续|完成后我们会通知你/);
});

test("loading page uses scoped editorial serif and utility sans stacks", () => {
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(
    styles,
    /--loading-display-serif:\s*"Source Han Serif SC",\s*"Noto Serif SC",\s*"Songti SC",\s*"STSong"/,
  );
  assert.match(
    styles,
    /--loading-ui-sans:\s*"PingFang SC",\s*"Hiragino Sans GB",\s*"Microsoft YaHei"/,
  );
  assert.match(styles, /\.title\s*\{[\s\S]*font-family:\s*var\(--loading-display-serif\)/);
  assert.match(styles, /\.statusTitle\s*\{[\s\S]*font-family:\s*var\(--loading-display-serif\)/);
  assert.match(styles, /\.subtitle\s*\{[\s\S]*font-family:\s*var\(--loading-ui-sans\)/);
  assert.doesNotMatch(styles, /font-family:\s*var\(--font-display\)/);
});
