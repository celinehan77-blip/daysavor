# Hero Semantic Matching

## 目标与边界

菜谱详情页只从仓库中的静态 WebP 素材选择 Hero。运行时不调用 OpenAI、不调用图片生成 API、不下载新图片，也不改变详情页布局。

## 数据流

```text
ParsedRecipeDraft / Recipe
→ deriveHeroVisualTags()
→ selectHeroAsset()
→ assignRecipeVisualAssets()
→ localStorage 草稿持久化，或详情读取时确定性使用
→ RecipeDetailScreen
```

`deriveHeroVisualTags()` 只读取已有菜谱事实：

- 中文名、英文名和别名
- `primaryCategory`
- 主食材、食材、调味料
- 做法和步骤
- 口味与标签

不会调用新的模型，也不会反向修改菜谱事实。

## Manifest 字段

每张 Hero 由 `src/lib/recipe-visual/heroManifest.ts` 集中登记：

- `id`
- `src`
- `dishNames`
- `aliases`
- `primaryCategory`
- `cookingMethods`
- `ingredientForms`
- `dishForm`
- `keyIngredients`
- `flavorTags`
- `objectPosition`
- `isCategoryFallback`

## 选择顺序

1. 精确菜名/英文名：`exact`
2. 常见别名：`alias`
3. 同分类近似语义：`similar`
4. 分类 fallback：`category`
5. 全局中性 fallback：`global`

已经保存的结果标记为 `persisted`，优先于重新匹配。

近似语义分数：

| 信号 | 分值 |
| --- | ---: |
| 精确菜名 | +200 |
| 别名 | +180 |
| 主分类 | +80 |
| 烹饪方式 | +60 |
| 食材形态 | +40 |
| 成菜形态 | +40 |
| 每个关键食材 | +15 |
| 每个口味标签 | +8 |
| 做法冲突 | -100 |
| 成菜形态冲突 | -80 |

分类冲突候选不会进入排序。虾、蟹可复用 seafood Hero；其他可识别肉类和鱼类不会跨分类借图。

同分时按 `recipeId + dishName + hero + match group` 计算稳定哈希，因此同一菜谱刷新、重新进入或旧菜谱重新推导都保持一致。

## 持久化兼容

- 新本地菜谱：视觉标签和已选资源随现有 localStorage 草稿保存。
- 旧本地菜谱：首次读取时推导并回写同一草稿。
- 云端菜谱：现有 Supabase 表没有视觉字段，本阶段遵守“不加 Schema / migration”的边界，在读取层确定性推导，不增加查询。

未来若功能层提供视觉 JSON 或对应字段，只需把现有 `heroVisualTags / visualAssets` 原样写入和映射；详情组件与匹配接口无需重写。
