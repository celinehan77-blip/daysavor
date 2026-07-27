# Generated Recipe Save Flow

## 1. 当前流程

```text
首页输入
-> POST /api/parse-recipe
-> 得到 ParsedRecipeDraft
-> 校验或规则补齐 primaryCategory 等分类字段
-> 保存 latest parsed draft 到 localStorage
-> 创建 generation task
-> 尝试写入 Supabase recipes
-> 写入 ingredients
-> 写入 recipe_steps
-> 更新 generation task.generated_recipe_id
-> 保存 latestGeneratedRecipeSlug 到 localStorage
-> loading
-> 跳转 /recipe/[latestGeneratedRecipeSlug]
```

`recipes` 保存时会同步写入：

- `primary_category`
- `primary_ingredient`
- `classification_confidence`
- `classification_reason`
- `classification_source`

AI 提供完整且可信的分类时来源为 `ai`；AI 字段缺失、非法或低可信时由本地保守规则补齐并标记为 `rule`；详情页手动修正后标记为 `user`。

如果没有生成新 slug，`loading` 会继续 fallback 到：

```text
/recipe/kung-pao-chicken
```

## 2. 为什么仍然不接真实 AI

当前目标是验证“解析草稿能否变成真实菜谱数据”。

真实 AI 会带来额外变量：

- API key 管理；
- 调用成本；
- 输出不稳定；
- 错误重试；
- 模型选择；
- 内容安全边界。

本阶段继续使用 mock parser，可以先把数据库保存、详情页读取、Station 展示和任务状态跑通。

## 3. 为什么保存失败要 fallback

游客模式仍然是产品核心原则。

保存失败可能来自：

- 用户未登录；
- Supabase 未配置；
- RLS 策略限制；
- 网络失败；
- slug 冲突；
- ingredients 或 recipe_steps 写入失败。

这些失败都不应该阻止用户进入现有 MVP 流程。失败时继续进入 loading，并最终跳转默认菜谱。

## 4. 未登录用户如何处理

未登录用户仍然可以：

- 输入链接或文本；
- 调用 `/api/parse-recipe`；
- 保存 latest parsed draft 到 localStorage；
- 创建本地 generation task；
- 进入 loading；
- 跳转默认菜谱。

未登录用户暂不写入 Supabase `recipes / ingredients / recipe_steps`。

## 5. 已登录用户如何处理

已登录用户会优先尝试：

- 写入 `recipes.user_id`；
- 写入该 recipe 下的 `ingredients`；
- 写入该 recipe 下的 `recipe_steps`；
- 把 `generation_tasks.generated_recipe_id` 指向新 recipe；
- 保存新 recipe slug 供 loading 跳转。

如果任一步失败，页面仍然 fallback，不强制用户重新登录。

## 6. RLS 最小策略

本阶段需要允许登录用户给自己创建的 recipe 插入配料和步骤。

```sql
drop policy if exists "Users can create ingredients for own recipes" on public.ingredients;
create policy "Users can create ingredients for own recipes"
on public.ingredients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.recipes
    where recipes.id = ingredients.recipe_id
      and recipes.user_id = auth.uid()
  )
);

drop policy if exists "Users can create steps for own recipes" on public.recipe_steps;
create policy "Users can create steps for own recipes"
on public.recipe_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.user_id = auth.uid()
  )
);
```

这不是放开全表写入，只允许用户写入自己 recipe 的子数据。

## 7. 未来接真实 AI 后如何复用

后续接 DeepSeek / OpenAI / Qwen 时，只需要把真实模型输出转换成同一个 `ParsedRecipeDraft`：

```text
真实 AI 输出
-> ParsedRecipeDraft
-> createRecipeFromParsedDraft
-> Supabase recipe
```

也就是说，真实 AI 只替换 parser provider，不需要重写保存流程。
