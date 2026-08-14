# Xiaohongshu Generation and Motion Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reliable Xiaohongshu recipe generation for the two supplied public links and remove visible reveal stutter from Flavor Map and Favorites without changing their visual design.

**Architecture:** Keep the existing share-link pipeline and security boundary. Xiaohongshu media resolution will prefer the already-integrated mainland ALAPI adapter and fall back to yt-dlp when the provider is unavailable; complex paper cards will use a capped opacity-and-translate reveal that avoids scale, blur, filter, and animated shadows.

**Tech Stack:** Next.js 16, TypeScript, Node test runner through tsx, React 19, Framer Motion.

## Global Constraints

- Do not change recipe classification, Supabase schema, routes, copy, or visual styling.
- Do not bypass login, CAPTCHA, platform access controls, URL allowlists, DNS safety checks, or SSRF protection.
- Preserve yt-dlp as a safe fallback and preserve reduced-motion behavior.
- Complete real-link API verification, UI browser verification, lint, build, and full tests before release.

---

### Task 1: Xiaohongshu media resolution fallback

**Files:**
- Modify: `src/lib/media/extractAudio.ts`
- Test: `tests/source/mediaResolutionStrategy.test.ts`

**Interfaces:**
- Consumes: `resolveAlapiMedia()`, `normalizeShareUrl()`, and the existing yt-dlp metadata reader.
- Produces: a resolver result containing either provider media or yt-dlp metadata without weakening URL validation.

- [ ] **Step 1: Write failing tests** proving Xiaohongshu prefers ALAPI and falls back to yt-dlp when ALAPI fails, while Douyin remains provider-only.
- [ ] **Step 2: Run `npx tsx --test --test-concurrency=1 tests/source/mediaResolutionStrategy.test.ts` and confirm the tests fail because the strategy does not exist.**
- [ ] **Step 3: Implement the minimal strategy helper and connect it to `extractAudioFromShareLink()`.**
- [ ] **Step 4: Run the focused test and `npm run test:source`.**

### Task 2: Lightweight staggered card reveal

**Files:**
- Modify: `src/lib/motion/pageReveal.ts`
- Modify: `src/components/flavor-map/FlavorMapScreen.tsx`
- Modify: `src/components/favorites/FavoritesScreen.tsx`
- Test: `tests/ui/pageRevealMotion.test.ts`
- Test: `tests/ui/flavorMapVisual.test.ts`
- Test: `tests/ui/favoritesMotion.test.ts`

**Interfaces:**
- Consumes: `useReducedMotion()` and existing category/favorite data hooks.
- Produces: `getSurfaceRevealMotion(index, reducedMotion)` with capped stagger and transform/opacity-only targets.

- [ ] **Step 1: Write failing tests** for capped delay, no scale/filter/blur/shadow animation, reduced-motion behavior, and Favorites loading stability.
- [ ] **Step 2: Run the focused UI tests and confirm the expected failures.**
- [ ] **Step 3: Implement the lightweight helper and use it only for Flavor Map tickets and Favorites cards/empty state.**
- [ ] **Step 4: Run focused UI tests and confirm they pass.**

### Task 3: End-to-end verification and documentation

**Files:**
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/ROADMAP.md` only if the verified status changes.

**Interfaces:**
- Consumes: the two user-supplied Xiaohongshu links and the existing production deployment pipeline.
- Produces: reproducible QA evidence and a rollback-ready bugfix release.

- [ ] **Step 1: Run `npm run test`, `npm run lint`, and `npm run build`.**
- [ ] **Step 2: Reuse or start the local dev server and verify Flavor Map/Favorites at 390px with no horizontal overflow or console errors.**
- [ ] **Step 3: Verify both links through `/api/parse-recipe` and confirm each returns a grounded recipe draft.**
- [ ] **Step 4: Record verified facts in the changelog, review the final diff, and prepare release/deployment only within the user's existing authorization.**
