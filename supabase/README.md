# Supabase SQL Setup

这个目录只用于准备 Supabase 数据库结构和初始数据。

当前阶段前端页面仍然读取 `mockData + localStorage`，还不会读取 Supabase。

## 文件说明

- `schema.sql`：创建表、索引和 RLS 权限策略。
- `seed.sql`：插入当前 MVP 的初始菜谱数据。
- `migrations/`：对现有项目进行增量升级；已上线数据库优先执行这里的 migration，不要重新执行 seed。

## 已有数据库增加菜谱分类

在 Supabase SQL Editor 中执行：

`migrations/20260727090433_add_recipe_classification.sql`

该 migration 可重复执行，只新增缺失字段、约束和索引，不删除菜谱、不回填旧分类，也不会覆盖 `classification_source = user` 的记录。旧数据由应用安全归入 `other`。

## 执行步骤

1. 去 Supabase 创建一个新项目。
2. 打开 Supabase Dashboard。
3. 进入左侧菜单的 SQL Editor。
4. 新建一个 Query。
5. 复制 `schema.sql` 的全部内容，粘贴进去并执行。
6. 等 `schema.sql` 执行成功。
7. 再新建一个 Query。
8. 复制 `seed.sql` 的全部内容，粘贴进去并执行。
9. 等 `seed.sql` 执行成功。

## 执行后检查

打开 Supabase 的 Table Editor，确认能看到这些表：

- `stations`
- `recipes`
- `ingredients`
- `recipe_steps`

并确认：

- `stations` 里有 `chicken`、`pasture`、`seafood`。
- `recipes` 里至少有 9 道 MVP 测试菜谱。
- `ingredients` 里有每道菜的食材。
- `recipe_steps` 里有每道菜的步骤。

## 配置本地环境变量

1. 在 Supabase 项目设置中复制 Project URL。
2. 复制 anon public key。
3. 在项目根目录创建 `.env.local`。
4. 填入：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon public key
```

5. 重启本地开发服务器：

```bash
npm run dev
```

## 当前阶段说明

- 当前阶段页面仍然不会读取 Supabase。
- 当前前端仍然使用 `mockData + localStorage`。
- 下一阶段才会开始把 `stations / recipes` 切换到 Supabase 只读数据。

## 注意事项

- 不要提交 `.env.local`。
- 不要把真实 key 写进代码。
- 不要把真实 key 写进 `.env.example`。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 可以暴露给前端，但必须配合 RLS 策略保护数据。
