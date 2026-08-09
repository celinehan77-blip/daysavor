# Recipe Visual Library

## 当前状态

菜谱详情页图片由“结构化素材清单 + 显式语义评分 + 稳定种子”驱动。页面组件不查询数据库、不在浏览器生成图片，也不按数组位置或 `Math.random()` 随机选图。

第二阶段生产库包含 165 张通用 WebP 素材：

- 主食材 42 张：鸡、鸭、猪、牛、鱼、海鲜。
- 配料组合 38 张：葱姜蒜、辣味、蔬菜、菌菇、豆类、坚果和香料。
- 调味体系 24 张：基础中式调味、复合酱汁、油脂和粉料。
- 烹饪步骤 53 张：切、腌、焯、爆香、炒、煎、炸、炖、焖、蒸、煮、勾芡、收汁和装盘。
- 分类型 fallback 8 张。

Hero 独立于通用素材计数：17 张验收菜谱 Hero + 7 张分类成品菜 fallback，共 24 张，统一为 1536×1024 WebP。

## 目录与唯一清单

```text
public/images/recipe-library/
├── proteins/
├── ingredients/
├── seasonings/
├── steps/
├── hero/
│   └── fallback/
├── fallback/
│   └── production/
└── rejected/
    ├── batch-1/
    ├── batch-2/
    └── batch-3/
```

`src/lib/recipe-visual/manifest.ts` 仍是运行时唯一清单；第一阶段 Pilot 与 `productionManifest.ts` 在这里合并，不存在第二套不兼容接口。每项保持原有字段：

- `id`
- `src`
- `type`
- `category`
- `tags`
- `compatibleActions`
- `aspectRatio`
- `visualWeight`

页面只调用 `matcher.ts`，不直接读取路径或把图片写死进组件。

## 明确评分与稳定选择

`src/lib/recipe-visual/scoring.ts` 使用以下离散分组：

1. 精确食材 + 精确动作：100 分。
2. 精确主食材：70 分。
3. 配料组合命中两个及以上标签：60 分。
4. 精确动作：55 分。
5. 配料组合命中一个标签：30 分。
6. 同大类：20 分。
7. fallback：0 分。

自由文本只作为低权重回退，单字不会被当作精确食材，因此“鱼香肉丝”不会因菜名中的“鱼”误选鱼类。

同分候选使用稳定种子选择：

```text
recipeId + imageType + category
recipeId + step + stepIndex + action + category
```

相同菜谱刷新后图片不变；不同菜谱和不同步骤可稳定落入不同变体。

## Hero 语义匹配链路

Hero 只表现成品菜。`heroManifest.ts` 为 24 张静态 Hero 提供独立元数据：

- `dishNames` / `aliases`
- `primaryCategory`
- `cookingMethods`
- `ingredientForms`
- `dishForm`
- `keyIngredients`
- `flavorTags`
- `objectPosition`

真实菜谱只使用解析结果中已经存在的菜名、分类、食材、步骤和口味，在本地由 `deriveHeroVisualTags.ts` 生成同构标签；这一步不调用新的 LLM。`heroMatcher.ts` 按以下五级顺序选择：

1. 精确菜名或英文名。
2. 常见别名。
3. 同分类下的近似语义（做法、食材形态、成菜形态、关键食材和口味）。
4. 分类成品菜 fallback。
5. 全局中性 fallback。

可识别分类会先做硬过滤，再进入评分；鸡、鸭、猪、牛、羊、鱼不会跨肉类借图，虾和蟹只与 seafood 兼容。评分采用 `菜名 +200 / 别名 +180 / 分类 +80 / 做法 +60 / 食材形态 +40 / 成菜形态 +40 / 关键食材每项 +15 / 口味每项 +8`，做法冲突扣 100、成菜形态冲突扣 80；分类冲突候选直接排除。

同分候选使用 `recipeId + dishName + hero + match group` 稳定选择，刷新不会换图。详情页优先复用已保存的 `visualAssets` 或 `heroImageUrl`，否则现场确定性推导。浏览器不调用图片 API、不持有图片生成 Key，匹配失败只降级图片，不阻塞菜谱生成、保存或详情页打开。

当前没有新增 Supabase Schema 或 migration。本地生成菜谱会把 `heroVisualTags` 与 `visualAssets` 写入现有 localStorage 草稿；旧本地菜谱第一次读取时补齐并回写。云端菜谱仍由读取层确定性推导，因为现有 Supabase 表没有视觉字段；该结果稳定，但暂不写回数据库。

## 生产脚本与报告

`scripts/recipe-assets/` 包含：

- `generation-plan.json`：165 张通用素材的批次、标签、提示和目标路径。
- `generation-results.json`：最终文件尺寸、格式、字节数和 QA 结果。
- `rejected-assets.json`：12 张人工淘汰素材及原因。
- `coverage-report.json`：类型、分类、动作、低覆盖标签和缺失路径。
- `hero-generation-plan.json` / `hero-generation-results.json`：24 张 Hero 的离线计划与验证结果。
- `build-generation-plan.ts` / `build-hero-plan.ts`：重建计划。
- `import-generated.mjs` / `import-hero.mjs`：WebP 转换与尺寸归一。
- `normalize-assets.mjs`：把通用素材归一为卡片 800×600、步骤 512×512。
- `validate-assets.mjs` / `validate-heroes.mjs`：格式、尺寸、读取、零字节、精确重复和路径检查。
- `create-contact-sheet.mjs` / `create-hero-contact-sheet.mjs`：分批人工视觉审查联系表。

生成分三批完成：50 + 50 + 41。每批均先自动检查，再以联系表审查主体、语义、风格和文字安全区。12 张问题图保留在 `rejected/`，正式路径均已使用定向重生成版本替换。

## AI 视觉语义字段

`ParsedRecipeDraft` 的以下可选字段继续复用：

- `primaryIngredientTags`
- `ingredientImageTags`
- `seasoningImageTags`
- `stepActionTags`
- `heroImagePromptData`
- `heroVisualTags`
- `visualAssets`

视觉语义只能检索图片，不能反向修改菜名、用量、食材、调料、步骤、火候或时间。旧菜谱缺少字段时，匹配器从已有分类和文本确定性回退。

## 已保留的详情页融合方式

本阶段没有重新设计详情页：

- 三张食材卡片布局、尺寸、字体、配色不变。
- 上方文字安全区与底部图片区不变。
- 图片继续使用 `object-fit: cover`、顶部渐隐 mask、卡片圆角和 `overflow: hidden`。
- 图片继续处于正常文档流，不覆盖食材文字。

## 验收覆盖

语义回归覆盖：

- 鸡：宫保鸡丁、黄焖鸡、辣子鸡。
- 鸡近似匹配：可乐鸡翅。
- 鸭：啤酒鸭、姜母鸭。
- 猪：红烧肉、鱼香肉丝、糖醋排骨。
- 牛：土豆炖牛肉、黑椒牛柳、番茄牛腩。
- 鱼：清蒸鱼、水煮鱼、香煎鱼。
- 海鲜：蒜蓉粉丝虾、辣炒鱿鱼、清蒸螃蟹。

通用素材 165/165、Hero 24/24 已通过格式、尺寸、路径与精确重复检查；`missingTags` 为空。低覆盖报告保留具体单一变体标签，便于未来根据真实菜谱命中数据继续扩充，而不是用重复图片凑数量。
