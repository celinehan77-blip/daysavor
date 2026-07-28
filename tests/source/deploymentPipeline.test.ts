import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(path: string) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("web image workflow publishes an amd64 GHCR image with immutable tags", async () => {
  const workflow = await readProjectFile(
    ".github/workflows/web-container-image.yml",
  );

  assert.match(workflow, /packages:\s*write/);
  assert.match(workflow, /platforms:\s*linux\/amd64/);
  assert.match(workflow, /type=sha,format=long/);
  assert.match(workflow, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(workflow, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(workflow, /secrets\.SUPABASE_URL/);
  assert.match(workflow, /secrets\.SUPABASE_ANON_KEY/);
});

test("production compose pulls a registry image instead of building on the server", async () => {
  const compose = await readProjectFile("deploy/docker-compose.ghcr.yml");

  assert.match(
    compose,
    /image:\s*\$\{WEB_IMAGE:-ghcr\.io\/celinehan77-blip\/recipe-ticket-app-v2:main\}/,
  );
  assert.doesNotMatch(compose, /^\s+build:/m);
  assert.match(compose, /condition:\s*service_healthy/);
});

test("production image retains the media runtime tools", async () => {
  const dockerfile = await readProjectFile("Dockerfile");

  assert.match(dockerfile, /FROM node:22-bookworm-slim AS dependencies/);
  assert.match(dockerfile, /COPY --from=dependencies \/app\/runtime-tools/);
  assert.match(dockerfile, /YT_DLP_PATH=\/app\/runtime-tools\/yt-dlp/);
  assert.match(dockerfile, /FFMPEG_PATH=\/app\/runtime-tools\/ffmpeg/);
});
