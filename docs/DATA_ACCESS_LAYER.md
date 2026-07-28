# Data Access Layer

本轮新增 `src/lib/data/`，用于把页面读取数据的方式集中起来。它是后续接 Supabase 前的准备层，不改变当前 MVP 功能。

## 当前目的

- 让页面尽量通过 `src/lib/data/` 获取 Station、Recipe、收藏和生成任务数据。
- 减少页面直接关心 `mockData` 和 `localStorage` 的细节。
- 为后续从本地假数据切换到 Supabase 查询预留稳定入口。

## 当前数据来源

当前仍然使用：

- `src/lib/mockData.ts`：Station、Recipe、loading steps、底部 Tab 等本地静态数据。
- `src/lib/localFavorites.ts`：基于 `localStorage` 的收藏 slug 列表。
- `src/lib/mockGenerationTask.ts`：基于 `localStorage` 的模拟生成任务。

本轮没有接数据库，没有接 AI API，也没有创建真实后端接口。

## 使用原则

页面和组件应优先从 `src/lib/data/` 读取业务数据：

- `stations.ts` 负责驿站数据读取。
- `recipes.ts` 负责菜谱列表、详情和卡片数据读取。
- `favorites.ts` 负责收藏数据读取与切换。
- `generationTasks.ts` 负责模拟生成任务读取与更新。
- `index.ts` 统一导出上述方法。

UI 页面不应该关心数据来自 `mockData`、`localStorage` 还是未来数据库。

## 个人菜谱分类

- `recipeClassification.ts` 合并当前用户生成和收藏的菜谱，并按 slug 去重。
- 登录用户的生成与收藏查询都使用当前 `user.id`；游客只读取当前浏览器的本地生成和收藏。
- `primary_category` 为空或非法时统一按 `other` 处理。
- 风味地图只展示当前设计已有的 chicken / beef / fish 三张票根，但 `/chef/[categoryId]` 和数据层支持全部九类。
- 用户纠错只更新本地生成菜谱或当前用户拥有的云端菜谱；云端更新同时限定 `slug + user_id`。

## 后续接 Supabase 的替换方式

后续接 Supabase 时，优先替换 `src/lib/data/` 内部实现：

1. `getAllStations()` 改为查询 `stations` 表。
2. `getRecipesByStationSlug()` 改为通过 station slug 查询对应 recipes。
3. `getRecipeDetailBySlug()` 改为查询 recipe、ingredients、recipe_steps。
4. `getFavoriteRecipes()` 改为查询 `favorites` 表。
5. `getLatestGenerationTask()` 改为查询 `generation_tasks` 表。

页面层尽量保持不动，只继续调用这些 data 方法。

## 后续 Supabase 接入方式

- 当前页面通过 `src/lib/data/` 读取数据。
- 当前 `src/lib/data/` 内部仍然读取 `mockData + localStorage`。
- 本轮新增的 `src/lib/data/supabase/` 只作为草稿，不接入页面。
- 后续只需要逐步替换 `src/lib/data/` 内部实现，让它调用 Supabase 草稿方法。
- UI 页面不应该直接 import Supabase client。
- 这样可以避免大范围修改页面，也能降低从 mockData 切换到数据库时的风险。

## 当前边界

- 不接 Supabase。
- 不让页面读取 Supabase。
- 不写 `.env.local`。
- 不接 AI API。
- 不改页面 UI、配色、布局、动画或跳转逻辑。
