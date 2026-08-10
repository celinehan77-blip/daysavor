import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), "utf8");
}

test("Android system bars share the app surface instead of the system gray fallback", () => {
  const colors = readProjectFile(
    "android/app/src/main/res/values/colors.xml",
  );
  const styles = readProjectFile(
    "android/app/src/main/res/values/styles.xml",
  );

  assert.match(colors, /name="app_surface">#FAF6F0</);
  assert.match(
    styles,
    /<item name="android:windowBackground">@color\/app_surface<\/item>/,
  );
  assert.match(
    styles,
    /<item name="android:statusBarColor">@color\/app_surface<\/item>/,
  );
  assert.match(
    styles,
    /<item name="android:windowLightStatusBar">true<\/item>/,
  );
});

test("the web viewport publishes the same surface color to browser chrome", () => {
  const rootLayout = readProjectFile("src/app/layout.tsx");

  assert.match(rootLayout, /themeColor:\s*"#faf6f0"/);
  assert.match(rootLayout, /colorScheme:\s*"light"/);
});
