# Product Roadmap

本路线图记录 Recipe Ticket / 日食笔记从 MVP 到真实上线的阶段状态。阶段是否完成以代码和验证结果为准，不以文档标题或计划描述代替验收。

开始开发前必须先阅读 [`AI_PROJECT_DIRECTOR.md`](./AI_PROJECT_DIRECTOR.md)。

## 路线原则

- MVP、可运行、可测试和可部署优先。
- 每次只推进一个可验收的小阶段。
- 保留游客路径、`mockData` 和 `localStorage` fallback，直到对应真实能力稳定。
- 不因架构优化推迟真实用户验证。
- Git commit、Git push、真实账号、Secret、付费和生产变更需要人工授权。

## 已完成阶段

### Phase 1：前端 MVP 闭环

状态：已完成

- 首页链接输入与模拟生成。
- Loading、菜谱详情、收藏、风味地图、Station 和“我的”页面。
- `mockData` 与 `localStorage` 本地演示路径。

### Phase 2：Supabase 基础设施与公共数据

状态：已完成基础版

- 数据库 schema、seed 和接入文档。
- 公共菜谱相关数据只读接入。
- Supabase 不可用时保留 `mockData` fallback。

### Phase 3：登录身份

状态：已完成基础版

- Supabase Auth 游客优先方案。
- Magic Link 登录、回调和 `/me` 登录状态。
- 缺少环境变量时保留 Local Demo。

### Phase 4：云端收藏与生成记录

状态：已完成基础版

- 已登录用户的云端收藏同步。
- 已登录用户的云端生成记录同步。
- 未登录用户继续使用本地存储。

### Phase 5：AI 菜谱解析管线

状态：已完成基础版

- `/api/parse-recipe` 接口和结构化草稿校验。
- 首页生成流程接入解析接口。
- 解析草稿保存为菜谱、食材和步骤。
- DeepSeek 服务端 Provider 与 mock fallback。

### Phase 6：AI Project Director 项目治理

状态：已完成

- 建立开发前强制阅读的项目级永久工作流。
- 建立统一的阶段闭环、Review、验证、文档和人工门槛规则。
- 建立本 ROADMAP 与 `docs/CHANGELOG.md`。

## 当前四级推进状态

```text
Milestone 3：Real User Beta
└── Phase A：Quality Baseline
    ├── Checkpoint A1：生产安全诊断（已完成，2026-07-16）
    │   ├── Task：定义单次生成安全诊断字段（已完成）
    │   ├── Task：记录 Provider、fallback、耗时与质量结果（已完成）
    │   ├── Task：正文与小红书生产样本真实写入（已完成）
    │   └── Task：建立 Beta 发布验收阈值（已完成）
    ├── Checkpoint A2：真实样本队列（已完成，2026-07-16）
    │   ├── Task：收集 10 条真实正文样本（10 / 10）
    │   ├── Task：收集 5 条小红书公开做饭视频（5 / 5）
    │   ├── Task：聚合成功率、fallback、耗时与质量分（已完成）
    │   └── Task：增加来源事实校验和用量估算标记（已完成）
    └── Checkpoint A3：小红书完成率修复（已完成，2026-07-16）
        ├── Task：按安全失败分类定位 2 条失败路径（已完成）
        ├── Task：验证新版 yt-dlp 的公开链接覆盖率（7 / 7）
        ├── Task：验证 ASR 后解析与质量失败率（7 / 7）
        └── Task：将小红书完成率提升到至少 80%（合并样本 10 / 12，83.3%）
└── Phase B：Platform Coverage（已完成，有限能力）
    └── Checkpoint B1：抖音公开视频 MVP（已完成，2026-07-17）
        ├── Task：短链、官方跳转和 SSRF 安全边界（已完成）
        ├── Task：ALAPI 公开媒体适配与 FFmpeg 复用（已完成）
        ├── Task：真实视频端到端验收（2 条完成，边界优化暂停）
        └── Task：成功菜谱写入并加入当前登录账号收藏（已完成）
└── Phase C：Retention（已完成）
    └── Checkpoint C1：云端收藏与再次查找（已完成，2026-07-17）
        ├── Task：成功样本进入当前账号收藏（已完成）
        ├── Task：刷新后登录与数据恢复（已完成）
        └── Task：动态详情与收藏状态恢复（已完成）
└── Phase D：Beta Release（已完成）
    └── Checkpoint D1：Vercel Production 发布验收（已完成，2026-07-17）
        ├── Task：核心路由与动态详情健康检查（已完成）
        ├── Task：Supabase 与 fallback 健康检查（已完成）
        └── Task：记录已知边界并冻结 MVP 范围（已完成）
```

- Current Milestone：`Milestone 3 - Real User Beta`（已完成）
- Current Phase：`Phase D - Beta Release`（已完成）
- Current Checkpoint：`D1 - Vercel Production 发布验收`（已完成）
- Current Version：`0.2.0-working.16`
- Checkpoint A0 Rollback Commit：`a1303b6`
- Checkpoint A1 Working Rollback Commit：`07c54db`
- 历史项目阶段编号 `Phase 12` 仅作为旧记录保留，不再作为当前执行层级。

## Milestone 4：Downloadable App

```text
Milestone 4：Downloadable App（进行中）
└── Phase A：Android Direct Distribution（进行中）
    ├── Checkpoint A1：Android 云端构建（已完成，2026-07-17）
        ├── Task：Capacitor Android 原生外壳（已完成）
        ├── Task：GitHub Actions debug APK 构建（已完成）
        └── Task：APK Artifact 完整性记录（已完成）
    └── Checkpoint A2：签名与 GitHub Prerelease（进行中）
        ├── Task：长期 Android 签名证书与 GitHub Secrets（已完成）
        ├── Task：签名 APK / AAB 与 GitHub Prerelease（已完成）
        ├── Task：中国大陆阿里云入口 Beta 3（已完成，2026-07-26）
        ├── Task：全屏移动端、自动分类与 3D Cover Flow Beta 4（发布准备中，2026-07-27）
        └── Task：Android 真机下载安装与主流程验收（待人工真机）
└── Phase B：Store Evaluation（待决策）
    ├── Checkpoint B1：Google Play 一次性费用与测试要求评估
    └── Checkpoint B2：中国大陆 Android 应用市场资质评估
```

- Current Milestone：`Milestone 4 - Downloadable App`
- Current Phase：`Phase A - Android Direct Distribution`
- Current Checkpoint：`A2 - 签名与 GitHub Prerelease`
- Current Version：`0.3.0-beta.4`

菜谱体验支撑项已完成（2026-07-30）：将详情页视觉素材 Pilot 生产化为 165 张通用素材和 24 张离线 Hero，建立确定性语义评分、三批生成、自动 QA、人工淘汰与覆盖报告；保持详情页 UI 与业务保存链路不变，不新增数据库 migration。

Checkpoint A1 已完成：GitHub Actions run `29582168527` 在 `24330c9` 上成功完成 Capacitor 同步、Gradle 编译和 debug APK 上传，产物约 3.58 MiB。

Checkpoint A2 发布部分已完成：run `29586070898` 发布首个长期签名 `0.2.0-beta.1`；真机安装成功但启动白屏。兼容修复提交 `dc0b55a` 已通过 79 项测试、lint、build、Capacitor sync 和 Vercel Production 健康检查，run `29646310937` 已发布 `0.2.0-beta.2` 签名 APK 与 AAB。公开 APK digest 和压缩结构验证通过；只剩 Android 真机覆盖安装、启动和游客生成流程验收。

Android 首轮真机结果：`0.2.0-beta.1` 安装成功但启动白屏。APK 配置、权限、资源和 Vercel WebView 请求均正常，当前最可能是设备 WebView 低于 Next.js 16 的 Chrome 111 默认基线，或手机网络无法稳定载入 Vercel。`0.2.0-beta.2` 已增加 Chrome 90 构建目标与本地加载失败页并完成发布，等待覆盖安装复验。

Beta 3 保留现有 Capacitor 工程与长期签名，只把 App 入口切换到 `https://app.recipetix.top`。该域名的阿里云生产线路已通过 HTTPS、Supabase、DeepSeek、火山 ASR、yt-dlp、FFmpeg 和真实小红书样本验收；run `30207828314` 已发布签名 APK/AAB，只剩华为设备真机复验。

Beta 4 保留相同包名、长期签名和中国大陆入口，发布真实移动端全屏、个人菜谱自动分类与纠错、九类师傅动态路由、风味地图高保真票根和 Chicken Station 连续 3D Cover Flow。发布门槛包括生产 Supabase 分类 migration、Web 与 Android 构建、GitHub Prerelease 资产完整性和阿里云同提交部署验证。

首轮只做 Android APK。iOS 正式分发需要 Apple Developer Program 年费，不符合当前低成本约束；Google Play 和中国大陆应用市场等 GitHub Beta 验证后再决定。

Checkpoint B1 已完成：Vercel Production 已跑通游客真实小红书链路、登录用户云端菜谱写入、动态详情刷新、云端收藏和 `/me` 数据恢复。

Checkpoint C1 已完成：登录用户会先按净化后的完整来源匹配自己已完成的云端任务，命中后复用动态菜谱 slug，不新建任务、不调用 ASR/DeepSeek；缓存命中直接打开已有菜谱，新生成仍保持 Loading 流程。Checkpoint C2 负责处理超时或页面中断留下的 processing task，并验证失败后重试不会产生半成品菜谱。

Checkpoint C2 已完成：超过 15 分钟的中断任务不会重新进入付费链路，新任务开始前会把当前用户的过期 processing task 安全标记为 failed；生产数据审计未发现过期任务、无菜谱完成任务或缺少食材/步骤的半成品。Milestone 2 完成。

Milestone 3 目标：让 MVP 可以进入小范围真实用户 Beta，用可验证的质量、耗时、fallback 和成本数据决定后续投入。Phase 依次为：A 质量与成本基线、B 平台覆盖（优先抖音公开样本）、C 收藏与再次查找留存、D Beta 发布与运营验收。

Checkpoint A1 已完成：正文样本“香菇滑鸡”和小红书公开样本“农家一碗香”均在 Vercel 登录生产会话完成并写入安全 diagnostics；两条任务均使用 DeepSeek、无 fallback、质量分分别为 86 和 98。小红书样本使用火山 Seed ASR，动态菜谱包含 14 项食材/调料和 6 个步骤。

Checkpoint A2 首轮结果：5 条小红书公开样本中 3 条完成、2 条安全失败，成功率 60%，成功样本平均质量分 94.7、P95 处理耗时约 30.9 秒、fallback 为 0。失败样本中一条未进入媒体提取，另一条完成火山 ASR 后在 DeepSeek 解析或质量校验阶段失败。成功率尚未达到 80% Beta 门槛。

Checkpoint A2 正文结果：10 条真实正文全部完成，完成率 100%、平均质量分 92.6、P95 约 9.8 秒、fallback 为 0。新增 8 条样本每条只调用一次 DeepSeek，共 15979 Tokens。Reviewer 发现模型会估算原文未提供的步骤时长并补充常识 tips，因此增加来源事实校验：用量允许按 2 人份估算并明确标记，步骤时间、火候和重点提醒必须有原文依据。

Checkpoint A3 已完成：新增 7 条从未使用的小红书公开样本，7 条均完成 `yt-dlp -> FFmpeg -> 火山 ASR -> DeepSeek`，无 ASR fallback。6 条本地完整链路平均约 44.8 秒、P95 约 48.9 秒、平均质量分 86.3；另 1 条 Vercel Production 样本约 29.2 秒、质量分 78，并正确保留原文时间与火候、标记 2 人份 AI 估算。合并 A2 历史样本后为 10 / 12，完成率 83.3%，达到 Beta 的 80% 门槛。第 8 条备用链接未调用，避免无必要计费。

Checkpoint B1 已完成为有限 MVP：ALAPI 路线有 2 条真实抖音视频完成生成、Supabase 写入和云端收藏。空音轨样本在火山与阿里备用均无有效转录，另一样本超过 100 MB 安全上限；图文笔记需要 OCR。按产品决策保留现有实现和记录，暂停这些边界优化，不阻塞 Beta 上线。

Checkpoint C1 与 D1 已完成：登录会话刷新后恢复，当前账号 11 道生成、10 道收藏，两条抖音成功样本可从收藏页再次打开，动态详情刷新后收藏状态恢复。Vercel Production 核心路由、三个 Station、动态详情和部署健康接口均返回 200，Supabase 可读且 fallback 保留。Milestone 3 完成。

每个 Checkpoint 必须依次完成 Architect Review、QA、Reviewer、Debug、Release、CHANGELOG 和 Git Commit。网络中断或新会话启动时，从本节最近一个已完成 Checkpoint 继续。

## Next Queue

| 顺序 | 待开发项 | 状态 | 启动时必须确认 |
| --- | --- | --- | --- |
| 1 | DeepSeek 真实解析优化 | 已完成（2026-07-16） | 真实 Provider 与登录用户写入均已验证 |
| 2 | 解析样本测试体系 | 已完成（2026-07-16） | 10 条正文、5 条小红书和安全诊断基线已建立 |
| 3 | 小红书链接解析 | 已完成（2026-07-16） | yt-dlp、火山 ASR、Qwen 备用与 DeepSeek 已验收 |
| 4 | 抖音链接解析 | 已完成有限 MVP；边界优化暂停 | 已验证 2 条真实视频，保留安全失败 |
| 5 | OCR 图片识别 | 暂停 | 等待真实 Beta 反馈后决定是否投入 |
| 6 | AI 菜谱质量评分 | 待开发 | 评分维度、合格阈值和人工样本 |
| 6 | Recipe Embedding 搜索 | 待开发 | Embedding（把菜谱转成可搜索向量）Provider、数据库方案和成本 |
| 7 | 收藏夹优化 | 待开发 | 产品交互与视觉范围 |
| 8 | iOS PWA | 待开发 | PWA（可安装到手机桌面的网页应用）范围、图标和真机测试 |
| 9 | 数据分析 | 待开发 | 事件清单、分析平台、隐私与 Cookie 策略 |
| 10 | 正式上线 | 待开发 | 真人验收、Git push、生产配置和发布授权 |

## 队列推进规则

- 严格保持产品负责人给出的顺序，未经确认不重排、不跳项。
- 每完成一项，先完成 Review、lint、build、类型、API、数据库、安全和 Preview 中适用的验证。
- 完成项保留在表格中并标记为 `已完成（YYYY-MM-DD）`，同时记录关键验证结果。
- 当前项完成后，自动将下一项提升为待开发首项，并同步 README、CHANGELOG 和相关 docs。
- 遇到真实账号、API Key、付费、产品设计、Git、生产环境或真人测试时停止，明确请求最小人工操作。
- 小红书和抖音解析不得以绕过平台权限或访问限制为实现前提；若直接链接方案不可行，优先采用用户提供正文、字幕、截图或授权数据的 MVP fallback。

### Queue #1 当前验收记录

已完成（2026-07-14）：

- 可配置超时、受控重试、输出截断检查和非思考 JSON 模式。
- fallback 后保留 attempted provider、模型、耗时、尝试次数、finish reason 和 Token usage。
- `sourceUrl` / `rawText` 输入长度保护与 Prompt 注入隔离。
- Mock 正常请求、空输入、非法 JSON、超长输入和 DeepSeek 不可达 fallback 验证。
- lint、build、TypeScript、路由和 `/dev/parse-test` Preview 通过。
- Netlify Production 已验证 `/api/parse-recipe` 返回 `provider=deepseek`、`usedFallback=false`。
- 线上 `/dev/parse-test` 返回 200，可用于同一接口的开发验证。

补充验收（2026-07-16）：

- 登录用户真实写入 `recipes / ingredients / recipe_steps / generation_tasks` 已通过。
- 火山主 ASR 真实样本 `usedFallback=false`，Qwen 备用保留并有自动测试覆盖。
- 真实样本的长期质量、Token 成本和耗时统计进入 Queue #2 继续推进。

### Queue #2 当前验收记录

已完成（2026-07-14）：

- 新增解析质量评分工具，用于检查食材、调料、步骤、火候、时间、标签和置信度。
- 新增 16 条本地解析样本，覆盖详细菜谱、短文本、噪声文本、口语输入、缺失信息、重复步骤和 Prompt 注入。
- 新增 `npm run test:ai`，当前 23 项 AI 解析相关测试通过。

补充完成（2026-07-16）：

- 形成 10 条正文与 5 条小红书公开链接的真实样本集。
- 正文样本完成率 100%、平均质量分 92.6、P95 约 9.8 秒、fallback 为 0。
- 小红书样本完成率 60%，未达到 80% 门槛，进入 Checkpoint A3 专项修复。
- 增加来源事实校验；用量可透明估算，步骤时间、火候和重点提醒不得脱离原文。

## 长期暂缓事项

- 社交、评论、复杂会员、积分和广告。
- 复杂后台和大规模数据架构。
- 未被真实用户反馈证明必要的性能优化或重构。
- 未确认授权与稳定性的第三方平台抓取方案。
