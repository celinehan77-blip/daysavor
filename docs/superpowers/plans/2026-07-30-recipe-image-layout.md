# Recipe Image Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让详情页 Hero 主体自然居中，并让三类食材图片按内容密度在卡片右侧自然融合。

**Architecture:** 使用一个无 DOM 依赖的纯函数确定 `compact / balanced / dense`，详情页专属组件把文字区和图片区作为独立 Grid 区域渲染。CSS 只控制比例、尺寸和边缘羽化，不修改素材匹配与数据层。

**Tech Stack:** Next.js 16、React 19、TypeScript、CSS Modules、Node test runner。

## Global Constraints

- 不重新生成或修改素材。
- 不修改 Manifest、Matcher、AI、Supabase、路由或其他页面。
- 不使用 DOM 测量、ResizeObserver、absolute 覆盖、负 margin 或动态 clip-path。
- Hero 与食材图优先 `object-fit: contain`。

---

### Task 1: 三档布局纯函数

**Files:**
- Create: `src/components/recipe/ingredientCardLayout.ts`
- Create: `tests/ui/ingredientCardLayout.test.ts`

**Interfaces:**
- Produces: `getIngredientCardLayoutMode({ type, items }): "compact" | "balanced" | "dense"`
- Produces: `normalizeIngredientCardItems(items): normalized items`

- [ ] 写入 compact、balanced、dense、空行、长文本、单调味料和 8+ 配料失败测试。
- [ ] 运行 `npx tsx --test --test-concurrency=1 tests/ui/ingredientCardLayout.test.ts`，确认函数不存在而失败。
- [ ] 实现纯函数与类型，不读取 DOM。
- [ ] 重跑测试，确认通过。

### Task 2: 详情页专属卡片组件

**Files:**
- Create: `src/components/recipe/IngredientPrepCard.tsx`
- Modify: `src/components/recipe/RecipeDetailScreen.tsx`
- Test: `tests/ui/recipeDetailImageLayout.test.ts`

**Interfaces:**
- Consumes: `Ingredient[]`、图片 URL、卡片类型和标题。
- Produces: `data-layout-mode`、`data-ingredient-type`、独立 TextArea/ImageArea。

- [ ] 写失败测试，要求组件使用三档纯函数并输出两个独立区域。
- [ ] 确认失败源于组件尚不存在。
- [ ] 抽取 `IngredientPrepCard` 与 `IngredientArtwork`，保留现有 fallback 图片组件。
- [ ] 详情页只传入 props，不改变素材选择。
- [ ] 重跑范围测试。

### Task 3: Hero 居中与图片融合 CSS

**Files:**
- Modify: `src/components/recipe/RecipeDetail.module.css`
- Modify: `src/components/recipe/RecipeDetailScreen.tsx`
- Test: `tests/ui/recipeDetailImageLayout.test.ts`

**Interfaces:**
- Hero 默认值：`contain / center center`。
- Grid：compact `42/58`，balanced `56/44`，dense `66/34`。

- [ ] 写失败 CSS 契约测试：无底部 Banner、透明图片区、三档 Grid、三个低强度 mask、320px 缩放。
- [ ] 运行并确认失败。
- [ ] 实现 CSS Modules 样式与 Hero 默认居中逻辑。
- [ ] 重跑所有详情页 UI 测试。

### Task 4: 浏览器与工程验收

**Files:**
- Modify: `docs/CHANGELOG.md`

- [ ] 在 320 / 375 / 390 / 430px 检查横向溢出、Hero 主体、图片边界和文字安全区。
- [ ] 验证图片加载失败 fallback。
- [ ] 运行 `npm run lint`。
- [ ] 运行 `npx tsc --noEmit --incremental false`。
- [ ] 运行范围 UI 测试。
- [ ] 运行 `npm run build`。
- [ ] 更新变更记录，不提交或发布。
