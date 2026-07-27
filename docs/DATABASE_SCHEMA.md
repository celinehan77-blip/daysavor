# Recipe Ticket Database Schema

本文件用于后续接入 Supabase（后端数据库服务，用来保存用户、菜谱、收藏和生成任务数据）前的数据库规划。本轮只做设计文档，不创建真实数据库。

## 设计原则

- 当前 MVP 仍使用 `mockData` 和 `localStorage`，数据库只作为下一阶段准备。
- 流程一“生成菜谱”和流程二“浏览菜谱”共用同一套核心表。
- 先覆盖当前 MVP 闭环：驿站、菜谱、食材、步骤、收藏、生成任务。
- 登录、权限、AI 解析、小红书 / 抖音解析在后续阶段再实现。

## 1. users 用户表

用途：未来保存用户账号信息。当前 MVP 还不做登录，但后期收藏、生成任务、个人数据都需要关联用户。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 用户唯一 ID，建议对应 Supabase Auth user id |
| email | text | 用户邮箱 |
| display_name | text | 用户显示名称 |
| avatar_url | text | 用户头像地址 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

建议：
- `id` 作为主键。
- `email` 后期可加唯一约束。
- 当前无需在前端显示完整账号体系。

## 2. stations 分类 / 驿站表

用途：保存风味地图里的分类，例如羽禽驿站、牧场驿站、海味码头。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 驿站唯一 ID |
| slug | text | URL 标识，例如 `chicken`、`pasture`、`seafood` |
| name_zh | text | 中文名称，例如羽禽驿站 |
| name_en | text | 英文名称，例如 Poultry Station |
| description | text | 驿站说明 |
| category_type | text | 分类类型，例如 `poultry`、`pasture`、`seafood` |
| icon | text | 图标标识，前端可映射为 lucide icon |
| accent_color | text | 主题色标识，例如 `sage`、`caramel`、`blue` |
| recipe_count | integer | 菜谱数量，可先存展示值，后期也可实时统计 |
| average_time | text | 平均时间展示文案，例如 `25 分钟` |
| difficulty | text | 默认难度展示文案 |
| sort_order | integer | 排序 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

建议：
- `slug` 加唯一约束。
- `sort_order` 用于保持风味地图票根顺序。

## 3. recipes 菜谱表

用途：保存每一道菜谱的核心信息。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 菜谱唯一 ID |
| slug | text | URL 标识，例如 `kung-pao-chicken` |
| user_id | uuid | 创建者用户 ID，可为空；关联 `users.id` |
| station_id | uuid | 所属驿站 ID；关联 `stations.id` |
| title_zh | text | 中文菜名 |
| title_en | text | 英文菜名 |
| description | text | 菜谱说明 |
| source_url | text | 原始视频 / 图文链接 |
| source_platform | text | 来源平台，例如 `xiaohongshu`、`douyin`、`manual`、`mock` |
| time_minutes | integer | 烹饪时间，单位分钟 |
| difficulty | text | 难度，例如简单、中等 |
| flavor | text | 风味，例如川味、家常、鲜香 |
| main_ingredient | text | 主食材展示文案 |
| primary_category | text | 稳定英文分类 ID；旧数据为空时由应用按 `other` 读取 |
| primary_ingredient | text | 决定主要分类的具体食材 |
| classification_confidence | numeric(4,3) | 分类置信度，范围 0–1 |
| classification_reason | text | 分类依据 |
| classification_source | text | 分类来源：`ai`、`user` 或 `rule` |
| saved_count | integer | 收藏展示数量 |
| cover_type | text | 封面类型，例如 `illustration`、`image` |
| is_generated | boolean | 是否由链接生成 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

说明：
- `user_id` 代表这道菜属于哪个用户。
- `station_id` 代表这道菜属于哪个驿站分类。
- 后期 AI 解析生成的新菜谱也进入这张表，不单独建另一套生成菜谱表。

建议：
- `slug` 加唯一约束。
- `station_id` 加索引，方便读取某个驿站下的菜谱。
- `user_id` 加索引，方便未来读取某个用户生成过的菜谱。
- `user_id + primary_category + created_at` 建联合索引，支持当前用户分类列表与最近新增排序。
- 分类 ID 只允许 `chicken / duck / pork / beef / lamb / fish / shrimp / crab / other`。
- 旧数据不强制回填；读取时归入 `other`，避免误覆盖用户已经手动修正的结果。

## 4. ingredients 食材表

用途：保存菜谱里的食材和调料。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 食材记录唯一 ID |
| recipe_id | uuid | 所属菜谱 ID；关联 `recipes.id` |
| name | text | 食材名称 |
| amount | text | 用量，例如 `300g`、`2勺` |
| group_type | text | 分组类型 |
| note | text | 备注，例如切丁后腌制 |
| sort_order | integer | 排序 |
| created_at | timestamptz | 创建时间 |

`group_type` 可选值：

- `main`：主食材
- `side`：配料
- `seasoning`：调味料

建议：
- `recipe_id` 加索引。
- 后期可以加 check 约束，限制 `group_type` 只能为 `main`、`side`、`seasoning`。

## 5. recipe_steps 烹饪步骤表

用途：保存每一道菜的具体步骤。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 步骤唯一 ID |
| recipe_id | uuid | 所属菜谱 ID；关联 `recipes.id` |
| title | text | 步骤标题 |
| description | text | 步骤说明 |
| duration | text | 步骤耗时展示文案，例如 `3 分钟` |
| tips | text | 小提示 |
| sort_order | integer | 步骤顺序 |
| created_at | timestamptz | 创建时间 |

建议：
- `recipe_id` 加索引。
- `sort_order` 从 1 开始，保证步骤顺序稳定。

## 6. favorites 收藏表

用途：保存用户收藏了哪些菜谱。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 收藏记录唯一 ID |
| user_id | uuid | 用户 ID；关联 `users.id` |
| recipe_id | uuid | 菜谱 ID；关联 `recipes.id` |
| created_at | timestamptz | 收藏时间 |

说明：
- 一个用户可以收藏多道菜。
- 一条收藏记录对应一个用户和一道菜。

建议：
- 对 `user_id + recipe_id` 加唯一约束，避免重复收藏。
- `user_id` 加索引，方便读取我的收藏。
- `recipe_id` 加索引，方便统计某道菜被收藏次数。

## 7. generation_tasks 生成任务表

用途：保存用户从链接生成菜谱的任务状态。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| id | uuid | 任务唯一 ID |
| user_id | uuid | 用户 ID；关联 `users.id`，未登录阶段可为空 |
| source_url | text | 用户粘贴的原始链接 |
| source_platform | text | 来源平台，例如 `xiaohongshu`、`douyin`、`unknown`、`mock` |
| status | text | 任务状态 |
| generated_recipe_id | uuid | 生成成功后的菜谱 ID；关联 `recipes.id` |
| error_message | text | 失败原因 |
| created_at | timestamptz | 创建时间 |
| completed_at | timestamptz | 完成时间 |

`status` 可选值：

- `pending`：已创建，等待处理
- `processing`：处理中
- `completed`：已完成
- `failed`：失败

建议：
- `user_id` 加索引，方便查询用户自己的生成记录。
- `status` 加索引，方便后端查找待处理任务。
- `generated_recipe_id` 可以为空，只有成功生成后才填写。

## 当前 mockData 到数据库表的映射关系

| 当前数据 | 未来数据库表 | 说明 |
| --- | --- | --- |
| `mockData.stations` | `stations` | 保存羽禽驿站、牧场驿站、海味码头等分类 |
| `mockData.recipes` | `recipes` | 保存黄焖鸡、宫保鸡丁、辣子鸡等菜谱核心信息 |
| `recipe.ingredients` | `ingredients` | 保存主食材和配料，`group` 映射为 `group_type` |
| `recipe.seasonings` | `ingredients` | 保存调味料，`group` 映射为 `seasoning` |
| `recipe.steps` | `recipe_steps` | 保存烹饪步骤 |
| `localStorage favorites` | `favorites` | 当前收藏 slug 列表，未来改为用户和菜谱的关系表 |
| `localStorage mockGenerationTask` | `generation_tasks` | 当前模拟生成任务，未来改为真实任务状态表 |

## 流程一与流程二的数据关系

### 流程一：生成菜谱

用户粘贴链接
→ 创建 `generation_tasks`
→ AI 解析完成
→ 新增 `recipes`
→ 新增 `ingredients`
→ 新增 `recipe_steps`
→ 更新 `generation_tasks.generated_recipe_id` 和 `status`
→ 用户进入 recipe detail

### 流程二：浏览菜谱

用户进入风味地图
→ 读取 `stations`
→ 进入某个 station
→ 读取该 station 下的 `recipes`
→ 进入 recipe detail
→ 读取 `recipes`、`ingredients`、`recipe_steps`

### 关键原则

流程一和流程二不是两套数据库。

- 它们共用同一套 `recipes` / `stations` / `ingredients` / `recipe_steps` 数据。
- 流程一负责新增数据。
- 流程二负责浏览和复用数据。
- AI 生成出来的菜谱，只要通过审核或保存，就应该进入 `recipes`，成为普通可浏览菜谱。
