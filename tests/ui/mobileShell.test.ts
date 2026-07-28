import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("shared shell uses the real viewport and safe areas without a fake iOS status bar", () => {
  const viewport = readProjectFile("src/components/layout/AppViewport.tsx");
  const globalStyles = readProjectFile("src/app/globals.css");
  const rootLayout = readProjectFile("src/app/layout.tsx");
  const screenFiles = [
    "src/components/auth/AuthCallbackScreen.tsx",
    "src/components/favorites/FavoritesScreen.tsx",
    "src/components/flavor-map/FlavorMapScreen.tsx",
    "src/components/home/HomeScreen.tsx",
    "src/components/loading/TicketLoadingScreen.tsx",
    "src/components/login/LoginScreen.tsx",
    "src/components/me/MeScreen.tsx",
    "src/components/recipe/RecipeDetailScreen.tsx",
    "src/components/search/SearchScreen.tsx",
    "src/components/station/ChickenStationScreen.tsx",
  ];

  assert.match(viewport, /className="app-shell"/);
  assert.match(globalStyles, /\.app-shell\s*\{[\s\S]*width:\s*100%/);
  assert.match(globalStyles, /\.app-shell\s*\{[\s\S]*min-height:\s*100dvh/);
  assert.match(globalStyles, /\.app-shell\s*\{[\s\S]*overflow-x:\s*hidden/);
  assert.match(
    globalStyles,
    /\.app-viewport\s*\{[\s\S]*padding-top:\s*env\(safe-area-inset-top\)/,
  );
  assert.match(globalStyles, /\.app-viewport\s*\{[\s\S]*min-width:\s*0/);
  assert.match(globalStyles, /\.app-viewport\s*\{[\s\S]*max-width:\s*100%/);
  assert.doesNotMatch(globalStyles, /width:\s*min\(100vw,\s*393px\)/);
  assert.doesNotMatch(globalStyles, /border-radius:\s*44px/);
  assert.doesNotMatch(globalStyles, /0 30px 100px/);
  assert.match(rootLayout, /viewportFit:\s*"cover"/);

  for (const path of screenFiles) {
    const source = readProjectFile(path);
    assert.doesNotMatch(source, /IosStatusBar/);
  }
});
