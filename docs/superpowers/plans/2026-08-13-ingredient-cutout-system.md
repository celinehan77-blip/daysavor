# Ingredient Cutout System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cropped photographic ingredient-card images with complete transparent subjects selected from the existing recipe category.

**Architecture:** Add a Recipe Detail-only visual resolver that maps `primaryCategory` to local transparent protein assets and returns fixed approved garnish and seasoning cutouts. Keep the classification pipeline and shared recipe-visual matcher unchanged. Render all three selected assets as isolated artwork with `object-fit: contain` and type-specific safe sizing.

**Tech Stack:** Next.js 16, React, TypeScript, CSS Modules, Node test runner, local PNG assets.

## Global Constraints

- Keep the existing three-column Recipe Detail layout, typography, card dimensions, and recipe copy.
- Reuse `primaryCategory`; do not add or change classification logic, database fields, routes, or APIs.
- Modify Recipe Detail visual files only; do not touch Flavor Map, Chicken Station, or other pages.
- Main ingredient art must remain complete and category-safe for chicken, pork, beef, lamb, and fish.
- Side and seasoning groups use the approved fixed vertical cutouts.
- Validate at 320px and 393px with no clipping or horizontal overflow.

---

### Task 1: Produce complete transparent protein assets

**Files:**
- Create: `public/images/recipe-library/cutouts/proteins/pork-cutout.png`
- Create: `public/images/recipe-library/cutouts/proteins/beef-cutout.png`
- Create: `public/images/recipe-library/cutouts/proteins/lamb-cutout.png`
- Create: `public/images/recipe-library/cutouts/proteins/fish-cutout.png`

**Interfaces:**
- Produces: Four square transparent PNG files with complete centered subjects and safe edge padding.

- [ ] Generate one top-down ingredient still life per protein on a flat chroma-key background.
- [ ] Remove chroma key locally into alpha PNG files.
- [ ] Verify alpha corners, full subject bounds, dimensions, and absence of key-color fringe.
- [ ] Compare all four with existing chicken, garnish, and seasoning cutouts.

### Task 2: Add the Recipe Detail visual resolver

**Files:**
- Create: `src/lib/recipe-visual/ingredientPrepVisuals.ts`
- Create: `tests/ui/ingredientPrepVisuals.test.ts`

**Interfaces:**
- Consumes: `RecipeCategoryId` from `@/types/classification`.
- Produces: `getIngredientPrepVisuals(primaryCategory)` returning `{ main, side, seasoning }`, each with `src` and `presentation: "isolated"`.

- [ ] Write failing tests asserting category-safe mappings for chicken, pork, beef, lamb, and fish plus neutral fallback behavior.
- [ ] Run `npx tsx --test --test-concurrency=1 tests/ui/ingredientPrepVisuals.test.ts` and confirm failure.
- [ ] Implement the fixed mapping and approved shared side/seasoning paths.
- [ ] Rerun the focused test and confirm it passes.

### Task 3: Connect the resolver without changing recipe data

**Files:**
- Modify: `src/components/recipe/RecipeDetailScreen.tsx`
- Modify: `tests/ui/recipeVisualLibrary.test.ts`

**Interfaces:**
- Consumes: `getIngredientPrepVisuals(recipe.primaryCategory)`.
- Produces: Three `IngredientPrepCard` entries using detail-only transparent artwork.

- [ ] Add a failing source test requiring the detail resolver and forbidding the shared photographic prep matchers in the ingredient group construction.
- [ ] Run the focused source test and confirm failure.
- [ ] Replace only the three prep image selections with the detail resolver.
- [ ] Rerun the focused tests and confirm they pass.

### Task 4: Restore the approved vertical artwork composition

**Files:**
- Modify: `src/components/recipe/RecipeDetail.module.css`
- Modify: `tests/ui/recipeDetailImageLayout.test.ts`

**Interfaces:**
- Consumes: `data-ingredient-type` and `data-asset-presentation="isolated"`.
- Produces: Complete contained subjects with main, side, and seasoning-specific scale and position.

- [ ] Add failing style assertions for contained isolated art, safe inset, and type-specific vertical sizing.
- [ ] Run the focused UI test and confirm failure.
- [ ] Remove the photographic stacked-region workaround and implement isolated artwork sizing without crop masks.
- [ ] Rerun the focused UI test and confirm it passes.

### Task 5: Verify real generated content and regressions

**Files:**
- Test: `tests/ui/*.test.ts`
- Test: existing project suites.

**Interfaces:**
- Produces: Verified Recipe Detail at the generated chili-pork route and known Kung Pao route.

- [ ] Run focused UI tests, then `npm test`, `npm run lint`, and `npm run build`.
- [ ] Start a local production preview.
- [ ] Verify the generated chili-pork recipe at 393px and 320px: complete pork subject, approved garnish/seasoning cutouts, no text collision, and no horizontal overflow.
- [ ] Verify Kung Pao still uses complete chicken artwork.
- [ ] Run `git diff --check` and confirm only scoped Recipe Detail files and new assets changed.
