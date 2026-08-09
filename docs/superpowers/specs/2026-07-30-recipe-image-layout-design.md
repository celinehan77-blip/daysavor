# 菜谱详情页图片布局与融合设计

## 范围

只调整菜谱详情页的 Hero 图片内部定位，以及食材准备区三张卡片的图片布局与边缘融合。保留现有数据、素材选择、页面结构、文字、信息栏、步骤和底部操作。

## Hero

- 容器继续位于页面右侧。
- 图片默认 `object-fit: contain`、`object-position: center center`。
- 仅当素材 Manifest 明确提供非默认构图位置时，才使用素材自身 `objectPosition`；不再全局统一右偏。
- 不拉伸、不用激进 cover，优先保留盘子与主要菜品。

## 食材卡

每张卡固定为 `TextArea + ImageArea` 两个 Grid 区域。图片不绝对定位、不覆盖文字、不使用负 margin，也不改成底部 Banner。

纯函数 `getIngredientCardLayoutMode({ type, items })` 先清理空白和重复空格，再按条目数量与长文本权重返回：

- `compact`
- `balanced`
- `dense`

阈值：

- 主食材：1–2 / 3 / 4+
- 配料：1–3 / 4–5 / 6+
- 调味料：1–3 / 4–6 / 7+
- 单条标准化文字超过 14 个字符时增加一档密度，最多到 `dense`。

Grid 比例：

- compact：42% / 58%
- balanced：56% / 44%
- dense：66% / 34%

卡片外部高度、标题基线、圆角和间距统一。

## 图片融合

- 图片区透明、无边框、无底板、无独立阴影。
- 图片使用 `object-fit: contain`、`object-position: center bottom`。
- 图片外围采用低侵入径向 mask，中心主体完全不透明，仅最外缘渐隐。
- main / side / seasoning 使用三个克制的 mask 参数；图片加载失败继续复用现有 fallback。
- 只允许极轻微的饱和度、对比度与亮度校正，不模糊主体。

## 验收

- 测试 compact 主食材、balanced 配料、dense 调味料、长文本、空行、单调味料和 8+ 配料。
- 320 / 375 / 390 / 430px 无横向溢出，图片区保持右侧，文字不覆盖。
- lint、typecheck、范围测试和 build 通过。
