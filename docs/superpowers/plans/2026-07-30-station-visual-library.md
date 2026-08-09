# Station Visual Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Station cards' CSS ingredient illustration with a static, semantically matched editorial ingredient-photography library without changing card geometry, Cover Flow behavior, routes, or recipe data.

**Architecture:** A Station-only manifest and matcher consume the existing `SerializableRecipe` fields and return a stable `StationVisualSelection`. The Station screen renders the selected local WebP in the existing visual area and retains the current CSS composition only as an image-error fallback. This does not modify the shared recipe-detail manifest, matcher, scoring, types, Supabase schema, or classification logic.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS Modules, `next/image`, Node test runner, static WebP assets.

## Global Constraints

- Generate and save exactly 24 Pilot assets: Chicken 10, Beef 4, Pork 3, Fish 3, Seafood 3, Duck 1.
- Do not call image-generation APIs at page runtime.
- Do not change card height, width, typography, Cover Flow geometry, interaction, routes, or recipe data structures.
- Match in order: exact dish, alias, category plus method plus ingredients, category plus form, category plus method, category, category fallback.
- Reject every cross-primary-category candidate.
- Use a stable seed based on recipe id, dish name, and Station category; never use `Math.random()`.
- Do not modify `src/lib/recipe-visual/*`, `src/types/recipeVisual.ts`, Type/Recipe detail components, Supabase, global styles, or classification.

---

### Task 1: Station visual contract and semantic matcher

**Files:**
- Create: `src/lib/station-visual/types.ts`
- Create: `src/lib/station-visual/manifest.ts`
- Create: `src/lib/station-visual/matcher.ts`
- Test: `tests/ui/stationVisualMatcher.test.ts`

**Interfaces:**
- Consumes: `SerializableRecipe` and existing optional semantic fields.
- Produces: `getStationVisual(recipe: SerializableRecipe): StationVisualSelection`.

- [ ] Write tests for exact matching, alias matching, method/form fallback, category fallback, stable variants, and cross-category rejection.
- [ ] Run `npx tsx --test --test-concurrency=1 tests/ui/stationVisualMatcher.test.ts` and confirm failure because the Station matcher does not exist.
- [ ] Implement a Station-local manifest contract and deterministic score tiers.
- [ ] Re-run the focused test and confirm PASS.

### Task 2: Station Pilot asset library

**Files:**
- Create: `public/images/recipe-library/station-visuals/chicken/*.webp`
- Create: `public/images/recipe-library/station-visuals/beef/*.webp`
- Create: `public/images/recipe-library/station-visuals/pork/*.webp`
- Create: `public/images/recipe-library/station-visuals/fish/*.webp`
- Create: `public/images/recipe-library/station-visuals/seafood/*.webp`
- Create: `public/images/recipe-library/station-visuals/duck/*.webp`
- Test: `tests/ui/stationVisualAssets.test.ts`

**Interfaces:**
- Consumes: paths declared by `stationVisualManifest`.
- Produces: 24 readable WebP files with non-zero dimensions.

- [ ] Write an asset-integrity test for count, category allocation, unique ids/paths, path existence, WebP signature, and minimum dimensions.
- [ ] Run the test and confirm failure because assets do not exist.
- [ ] Generate the assets in batches of 6-8 with the built-in image tool and save them under the Station-only directory.
- [ ] Inspect each batch, convert final files to WebP, and re-run the integrity test.

### Task 3: Station card image integration

**Files:**
- Modify: `src/components/station/ChickenStationScreen.tsx`
- Create: `src/components/station/StationFoodMap.module.css`
- Test: `tests/ui/stationVisualIntegration.test.ts`

**Interfaces:**
- Consumes: `getStationVisual(recipe)` and `StationVisualSelection`.
- Produces: a layout-stable `StationFoodMap` using `next/image`, `object-fit: contain`, and manifest `objectPosition`.

- [ ] Write an integration test that renders the Station visual component behavior and verifies an image error switches to the legacy CSS fallback.
- [ ] Run the focused test and confirm failure against the current CSS-only implementation.
- [ ] Replace normal rendering with a fixed-size local-image container; keep the legacy composition behind error state only.
- [ ] Add a subtle edge mask and cream background blend without changing the existing visual area's dimensions.
- [ ] Re-run focused matcher, asset, integration, and existing Cover Flow motion tests.

### Task 4: Responsive and regression verification

**Files:**
- Modify only if needed: Station-exclusive files listed above.

**Interfaces:**
- Consumes: completed Station implementation.
- Produces: verified `/chef/chicken` and representative category routes at 320, 375, 390, and 430 CSS pixels.

- [ ] Run Station tests plus the full test suite.
- [ ] Run `npm run lint`.
- [ ] Run the repository typecheck script if present; otherwise record that `npm run build` is the TypeScript gate.
- [ ] Run `npm run build`.
- [ ] Reuse or start the dev server and verify center/side cards, image loading, fallback behavior, route opening, swipe/click behavior, and viewport overflow.
- [ ] Compare the 390px rendering with the supplied high-fidelity reference and adjust only Station-exclusive image-container styles.

### Task 5: Parallel-development handoff

**Files:**
- No shared documentation changes while the other Agent is editing README/ROADMAP/CHANGELOG.

**Interfaces:**
- Produces: an explicit list of exclusive files, shared files, conflicts, integration review points, and verification results.

- [ ] Re-run `git status --short` and `git diff --name-status`.
- [ ] Confirm no Type/Recipe detail, shared matcher/scoring, global data, Supabase, or global style files were modified.
- [ ] Report asset list, manifest, matcher, CSS replacement, tested recipes, mismatch findings, blend method, and preview URL.
