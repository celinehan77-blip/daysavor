# Recipe Ticket / 日食笔记

一个将小红书 / 抖音美食视频链接整理成干净菜谱，并支持收藏、分类浏览和风味地图的高质感菜谱收藏 App MVP。

> **开发前必读：所有开发开始前必须先阅读 [`docs/AI_PROJECT_DIRECTOR.md`](docs/AI_PROJECT_DIRECTOR.md)，再继续规划、编码、调试或部署。**
>
> 项目阶段与变更记录：[`docs/ROADMAP.md`](docs/ROADMAP.md) · [`docs/CHANGELOG.md`](docs/CHANGELOG.md)
>
> 产品战略最高层：[`MASTER_PLAN.md`](MASTER_PLAN.md)

**Milestone 3：Real User Beta MVP 已完成。** Vercel Production 已具备正文、小红书与有限抖音公开视频生成、动态详情、云端收藏和再次查找闭环；完整四级进度以 ROADMAP 为准。

**Milestone 4：Downloadable App 正在进行。** Android 使用 Capacitor 原生外壳连接阿里云中国大陆生产线路；Beta 4 加入真实移动端全屏、个人菜谱自动分类、九类师傅入口、风味地图票根视觉与 Chicken Station 3D Cover Flow，并继续复用长期签名证书。

Android Beta 下载：[日食笔记 Android 0.3.0-beta.4](https://github.com/celinehan77-blip/recipe-ticket-app-v2/releases/tag/android-v0.3.0-beta.4)。Android 用户下载 `.apk` 后可直接安装；`.aab` 仅用于后续应用市场提交。

## 当前功能

- 首页粘贴菜谱正文、字幕或公开小红书做饭视频链接，使用真实语音识别和 DeepSeek 生成菜谱
- Loading 票根生成页
- 动态菜谱详情页
- 本地收藏
- 收藏页
- 风味地图
- 九类师傅个人菜谱自动分类与真实数量
- Station 3D Cover Flow 菜谱选择
- 我的页本地数据汇总
- Supabase 只读接入
- Supabase Auth 游客优先
- 云端收藏同步基础版
- Android APK 云端构建与 GitHub Beta 长期签名分发已验证
- 云端生成记录基础版
- AI 解析接口骨架
- mockData fallback
- localStorage fallback

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- yt-dlp / FFmpeg
- Framer Motion
- localStorage

## 本地运行

先安装依赖：

```bash
npm install
```

启动本地开发服务：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 环境变量

如果需要连接 Supabase，请在项目根目录创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

说明：

- 没有配置 Supabase 时，项目会 fallback 到 `mockData`。
- 不要提交 `.env.local`。
- 不要把真实 Supabase URL 或 anon key 写进代码。
- 不要把真实 Supabase URL 或 anon key 写进 `.env.example`。

如果需要启用 DeepSeek 真实 AI 解析，可以在 `.env.local` 或部署平台环境变量中添加：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=30000
DEEPSEEK_MAX_RETRIES=1
DEEPSEEK_MAX_TOKENS=3000
```

说明：

- 默认 `AI_PROVIDER=mock`，不配置 AI key 也能运行。
- AI key 是服务端密钥，不要使用 `NEXT_PUBLIC_`。
- 不要把真实 DeepSeek key 写进代码、README 或 `.env.example`。

小红书视频语音识别还需要配置服务端 ASR 变量。只在本地 `.env.local` 或部署平台 Secret 中填写，不要提交真实值：

```env
ASR_PROVIDER=volcengine
ASR_FALLBACK_PROVIDER=aliyun_qwen
VOLC_ASR_API_KEY=
VOLC_ASR_APP_ID=
ALIBABA_ASR_API_KEY=
ALIBABA_ASR_BASE_URL=
ALIBABA_ASR_MODEL=qwen3-asr-flash
```

本地需要可执行的 `yt-dlp` 和 `ffmpeg`。构建脚本会在 Netlify Linux x64 环境下载并校验固定版本的 yt-dlp 独立二进制，避免依赖函数运行时的 Python；FFmpeg 使用平台 npm 二进制。也可用 `YT_DLP_PATH`、`FFMPEG_PATH` 显式指定路径。

## Supabase 数据库

数据库相关文件：

- schema 文件：`supabase/schema.sql`
- seed 文件：`supabase/seed.sql`
- 手动设置说明：`docs/SUPABASE_MANUAL_SETUP.md`
- 只读接入说明：`docs/SUPABASE_READONLY_PHASE.md`

当前 Supabase 只读接入：

- `stations`
- `recipes`
- `ingredients`
- `recipe_steps`

如果 Supabase 未配置、查询失败或数据为空，页面会继续使用 `mockData` 正常运行。

## AI Parsing

- 当前已新增 `/api/parse-recipe`。
- 首页生成流程已经接入 `/api/parse-recipe`。
- 已新增小红书公开视频语音提取链路：短链规范化、yt-dlp 公开媒体解析、FFmpeg 临时音轨、火山 ASR 主调用与 Qwen ASR 失败备用。
- 小红书继续使用 `yt-dlp`；抖音公开分享链接通过服务端 ALAPI 短视频聚合解析取得公开媒体后，复用同一套 FFmpeg、ASR 和 DeepSeek 管线。私密内容、需要登录的内容、B 站和 YouTube 不在当前范围内。
- 抖音图文作品当前不做 OCR；没有可用音轨或足够正文时会安全提示，不生成与来源无关的菜谱。
- 链接抓取只读取无需登录即可访问的公开内容，不执行页面脚本，不绕过登录、验证码或平台访问控制。
- 当前已接入 DeepSeek Provider，并已完成 Vercel Production 真实链路验收；Netlify 保留为备用部署平台。
- DeepSeek 请求支持可配置超时、受控重试和 JSON 输出截断检测。
- 开发诊断会显示 attempted provider、模型、耗时、尝试次数、finish reason 和 Token 用量。
- 设置 `AI_PROVIDER=deepseek` 且填写 `DEEPSEEK_API_KEY` 后，服务端会尝试调用 DeepSeek。
- 公开视频必须取得真实 transcript 才会调用 DeepSeek；媒体或 ASR 失败时不会根据标题生成无关菜谱。
- `npm run test:ai` 会运行本地 Provider fallback、Prompt、校验和解析样本质量测试，不调用真实 DeepSeek。
- 当前解析结果会先保存为本地 draft。
- 已登录用户会尝试把 draft 保存为 Supabase `recipes / ingredients / recipe_steps`。
- 保存成功后 loading 会跳转到新生成的 `/recipe/[slug]`。
- 游客生成的每道本地菜谱使用唯一 slug，保存失败时仍保留可用的本地动态菜谱。
- 真实小红书做饭视频已通过 yt-dlp、FFmpeg、火山 Seed ASR 主调用和 DeepSeek 验收；Qwen ASR 保留为火山明确失败后的备用。
- 首页提交后会立即进入 Loading，处理完成后跳转真实动态菜谱；登录用户的 `recipes / ingredients / recipe_steps / generation_tasks` 持久化已通过验证。
- 登录用户的新 generation task 会保存 Provider、模型、fallback、耗时、质量分和 Token 数等安全诊断指标，不保存原始口播或 Secret。
- AI key 只使用服务端环境变量，不使用 `NEXT_PUBLIC_`。

## 当前阶段说明

当前是 MVP 阶段。

- Supabase 公共读取继续用于 `stations / recipes`；已登录用户可按 RLS 写入自己的菜谱、食材、步骤、收藏和生成任务。
- 未登录用户继续使用 `localStorage` 收藏、生成任务和动态菜谱 fallback。
- 已登录用户可以使用 Supabase 收藏同步和生成记录同步。
- AI 解析默认仍保留 Mock Parser fallback；配置 DeepSeek 服务端环境变量后可使用真实 AI 解析。

这样做是为了先保证前端体验稳定，再逐步切换真实后端能力。

## Deployment

当前同时保留两个部署平台：

- Vercel：主要测试站点
- Netlify：备用站点，Credits 恢复后可继续部署

部署前需要：

- GitHub 仓库：`celinehan77-blip/recipe-ticket-app-v2`
- Vercel / Netlify 账号
- Supabase 项目的 Project URL 和 anon public key

说明：

- 两个平台连接同一个 GitHub `main` 分支，但环境变量需要分别维护。
- Vercel 使用 Next.js `/api/parse-recipe` 完成链接生成；Netlify 优先使用 Background Functions。
- 不要删除 `netlify.toml`、`netlify/functions` 或 Vercel 项目配置。
- 构建命令：`npm run build`
- 发布目录：`.next`
- Next.js 插件：`@netlify/plugin-nextjs`

在 Netlify Site configuration -> Environment variables 中添加：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=mock
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=30000
DEEPSEEK_MAX_RETRIES=1
DEEPSEEK_MAX_TOKENS=3000
```

说明：

- Supabase 目前只读接入 `stations / recipes` 相关公共菜谱数据。
- 没有配置 Supabase 环境变量时，项目会 fallback 到 `mockData`。
- 未登录用户的收藏与生成任务继续使用 `localStorage`；已登录用户会尝试同步到 Supabase。
- 不要把真实 Supabase URL 或 anon key 写进 GitHub。
- 不要把真实 DeepSeek key 写进 GitHub，也不要使用 `NEXT_PUBLIC_`。
- Netlify 不会自动读取本地 `.env.local`，线上环境变量需要在 Netlify 后台单独配置。
- Vercel 同样不会自动读取本地 `.env.local`。
- 双平台配置和运行差异见 [`docs/DUAL_PLATFORM_DEPLOYMENT.md`](docs/DUAL_PLATFORM_DEPLOYMENT.md)。
- 环境变量更新后需要重新部署。
- 如果 Supabase 不可用，线上页面会继续 fallback 到 `mockData`。
- 如果 DeepSeek 不配置或调用失败，线上解析会 fallback 到 mock parser。
- `DEEPSEEK_MAX_RETRIES=1` 表示失败后最多额外尝试一次；增加重试会增加耗时和可能的 API 费用。

线上 Supabase 诊断接口：

- `/api/deploy-health`

详细步骤：

- `docs/NETLIFY_DEPLOYMENT.md`
- `docs/VERCEL_DEPLOYMENT.md`
- `docs/DEPLOYMENT_CHECKLIST.md`

## 后续计划

- 当前完整路线、Phase 状态和验收标准见 [`docs/ROADMAP.md`](docs/ROADMAP.md)。
- Current Milestone：`Milestone 4 - Downloadable App`；先完成 Android 签名 APK 和 GitHub Release，再决定是否支付应用市场费用。
- 正文完成率 100%，小红书合并样本完成率 83.3%；抖音 ALAPI 路线已验证 2 条真实视频可生成并收藏，大文件、空音轨和图文 OCR 优化按 MVP 决策暂停。
- 菜谱用量遵循来源优先：原文具体量最高优先；缺失时允许按 2 人份估算并标明 AI 估算。步骤时间、火候和重点提醒仍必须有原文依据。
- Git commit、Git push、真实账号、API Key、付费和生产环境变更仍需人工授权。

## AI Software Company

项目由产品负责人、ChatGPT（CTO + Product Director）和 Codex（Engineering Manager）共同推进。固定职责文档：

- [`AI_PROJECT_DIRECTOR.md`](docs/AI_PROJECT_DIRECTOR.md)
- [`AI_ARCHITECT.md`](docs/AI_ARCHITECT.md)
- [`AI_QA.md`](docs/AI_QA.md)
- [`AI_REVIEWER.md`](docs/AI_REVIEWER.md)
- [`AI_RELEASE_MANAGER.md`](docs/AI_RELEASE_MANAGER.md)
- [`AI_KNOWLEDGE_MANAGER.md`](docs/AI_KNOWLEDGE_MANAGER.md)
- [`AI_PRODUCT_ANALYST.md`](docs/AI_PRODUCT_ANALYST.md)

## 常用命令

```bash
npm run dev
npm run build
npm run lint
```
