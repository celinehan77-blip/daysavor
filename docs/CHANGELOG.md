# Changelog

## 2026-08-14 - 小红书生成恢复与卡片入场性能修复

- 小红书公开视频改为优先使用现有 ALAPI 国内媒体解析通道；临时不可用时回退到 yt-dlp，保留 HTTPS、DNS 与 SSRF 安全校验，图文笔记仍明确拒绝。
- 用“醋蒸鸡”和“清炖牛肋条配广式蘸汁”两条真实分享链接完成本地端到端生成，分别正确归类为 chicken 与 beef。
- 风味地图票根和收藏菜谱卡改用复杂纸张表面专用入场参数，仅插值 opacity 与轻微 y 位移，取消缩放并限制长列表错峰上限。
- 收藏页等待真实数据返回后再展示卡片或空状态，消除首屏空状态闪烁；动画同步支持 prefers-reduced-motion。
- 同步修正 GHCR 仓库更名后遗留的部署测试与文档镜像地址。

## 2026-08-10 - Android 系统栏与页面入场动画精修

- Android 原生主题显式使用应用浅米色作为窗口、状态栏与导航栏背景，并启用深色系统图标，消除系统灰色回退形成的顶部暗带。
- Web viewport 同步发布浅色主题色与 light color scheme，使浏览器外壳、页面根背景和原生容器保持一致。
- 风味地图和“我的”页面统一为逐项、连续、从上到下的 transform + opacity 入场节奏，移除批量同时合成和父子叠加动画造成的顿挫。
- 支持 prefers-reduced-motion；新增原生系统栏与页面动画回归测试。
- QA：96 项完整测试、68 项 UI 测试、lint、Next.js production build 与 Android debug APK 构建通过；320px / 390px 浏览器复核无横向溢出或控制台错误。

## 2026-07-30 - 菜谱视觉素材库生产化

- 菜谱详情页 Hero 默认改为容器内自然居中；食材准备卡片按有效条目稳定切换 compact / balanced / dense 三档左右分区，并用贴底透明素材画布与分类差异化边缘羽化消除矩形照片感。
- 将第一阶段 24 张 Pilot 扩充为 165 张通用 WebP：42 主食材、38 配料、24 调味、53 步骤和 8 分类型 fallback。
- 新增 24 张 1536×1024 离线 Hero：覆盖 17 道验收菜谱和 7 个分类成品菜 fallback；运行时按 `heroImageUrl → 静态菜谱缓存 → 分类 fallback` 选择，不在浏览器生成。
- 将静态 Hero 正式接入真实菜谱读取与本地保存流程：从已有菜名、分类、食材、做法、形态和口味本地推导标签，不增加 LLM 或图片 API 调用。
- Hero 选择升级为精确菜名、别名、近似语义、分类 fallback、全局 fallback 五级；先硬过滤分类冲突，再执行显式评分与稳定种子选择。
- 本地生成菜谱持久化 `heroVisualTags / visualAssets`，旧本地草稿首次读取自动补齐；云端菜谱在不改 Supabase Schema 的前提下确定性推导。
- 18 道 MVP 菜谱（含可乐鸡翅近似匹配）通过稳定性、跨分类隔离和 fallback 优先级回归。
- 匹配器改为 100 / 70 / 60 / 55 / 30 / 20 / 0 的显式分组评分；稳定种子包含 recipe ID、图片类型、分类、步骤序号和动作。
- 修复“鱼香肉丝”单字“鱼”误导自由文本匹配的问题；补齐焖鸡、焖鸭、炖鸭、煮鱼和蒸海鲜的动作＋食材素材。
- 建立三批生成、WebP 归一、尺寸/格式/路径/零字节/精确重复检查、联系表人工审查和覆盖报告流程。
- 12 张语义或构图不合格图片已移入 `public/images/recipe-library/rejected/` 并记录原因，正式 manifest 仅引用替换后的合格素材。
- 保留详情页卡片布局、图片渐隐融合、字体、配色、路由和业务数据；没有新增 Supabase Schema、migration 或浏览器图片 API 调用。

## 2026-07-29 - 菜谱视觉素材库 Pilot

- 新增 24 张 WebP 通用素材 Pilot：6 张主食材、6 张配料组合、4 张调料和 8 张步骤动作；所有素材由统一 manifest 管理。
- 新增确定性语义匹配器，综合可选 AI 视觉标签、菜谱已有文本、分类和步骤动作选图；同一菜谱刷新后结果稳定，并保留全局 fallback。
- 为宫保鸡丁、土豆炖牛肉、清蒸鱼和蒜蓉粉丝虾加入菜谱级成菜 Hero 缓存，详情页不再用生肉主食材图充当成菜封面。
- `ParsedRecipeDraft` 新增可选视觉语义字段；旧菜谱缺失字段时安全回退，本阶段不新增 Supabase 字段、migration 或数据库查询。
- 食材准备卡片改为独立文字区与底部图片区，使用 WebP、`object-fit: cover` 和顶部渐隐遮罩融合，避免图片与文字重叠。
- 完整测试、全部 UI 测试、lint、production build 与 320 / 375 / 390 / 430px 浏览器复核通过。

## 2026-07-28 - GHCR 云端镜像发布

- 将 Next.js 与 Docker 镜像构建迁移到 GitHub Actions，阿里云 2 GB 服务器不再承担生产编译。
- 新增 GHCR `main` 与完整提交 SHA 镜像标签，支持按镜像 digest 验证和按提交标签回滚。
- 新增服务器拉取式 Compose 配置；Caddy、运行时环境变量、内存限制、健康检查和音视频工具保持不变。
- 部署健康接口新增 `deployCommit`，用于确认线上容器与 GitHub 发布提交一致。
- AI、ASR 和 ALAPI 密钥继续只保存在服务器，不写入 GitHub Workflow、镜像或 Android 安装包。

## 2026-07-27 - Android 0.3.0 Beta 4 发布候选

- 将手机样机容器改为真实移动端全屏，移除假 iOS 状态栏，并使用动态视口与 safe-area 适配真实设备。
- 发布个人菜谱自动分类：AI 识别主要食材，底层支持 chicken、duck、pork、beef、lamb、fish、shrimp、crab、other，并提供分类纠错。
- 风味地图改为读取真实用户分类数量和最近菜谱，九类票根使用稳定动态路由与高保真纸张、缺口、印章和条形码视觉。
- Chicken Station 改为连续 3D Cover Flow：实时跟手、速度分级惯性、慢拖单张、快速甩动多张和弹簧吸附。
- Android 继续使用 `com.rishibiji.app`、同一长期签名证书和 `https://app.recipetix.top` 中国大陆入口，支持从 Beta 3 覆盖升级。
- 发布候选版本更新为 `0.3.0-beta.4`；正式 GitHub Actions run、APK 大小和 SHA-256 在 Prerelease 成功后补录。

## 2026-07-27 - 风味地图个人菜谱自动分类

- AI 菜谱结构新增稳定英文分类 ID、主要食材、分类置信度与判断理由；缺失或低可信输出由保守规则补齐，无法可靠判断时进入 `other`。
- 生成菜谱的 Supabase 与本地保存路径同步保存分类来源；新增可重复执行的 `recipes` 分类字段 migration，不回写或删除旧数据。
- 风味地图三张现有票根连接当前用户真实“生成 + 收藏”数据，显示 chicken / beef / fish 的真实数量、平均时间和难度。
- 新增通用 `/chef/[categoryId]` 页面，底层支持 chicken、duck、pork、beef、lamb、fish、shrimp、crab、other，分类列表不再读取固定 Mock Data。
- 菜谱详情复用“更多”入口提供最小分类纠错；本地和当前用户云端菜谱更新后写入 `classification_source = user`。
- 完整测试、lint、production build 通过；本地浏览器完成鸡肉、牛肉、待整理与 chicken → beef 纠错四条流程。

## 2026-07-27 - 小红书 `.cn` 分享口令兼容

- 真实线上样本确认 `xhslink.cn` 被安全域名白名单拒绝，接口返回 `unsupported_url`；问题与登录状态无关。
- 增加小红书官方短链域名 `xhslink.cn`，继续保留 HTTPS、域名相似攻击和 SSRF 防护。
- 复用现有分享口令提取逻辑：用户可粘贴包含标题、中文引导语和 URL 的整段文本，系统只取其中 URL 进入媒体解析。
- 增加真实格式回归测试，确认 HTTP 短链自动升级为 HTTPS，并规范化为稳定来源地址。

## 2026-07-26 - Android Beta 3 中国大陆线路

- 保留现有 Capacitor Android 工程、包名和长期签名证书，只调整远程应用入口。
- APK 入口从 Vercel 切换到 `https://app.recipetix.top`，由阿里云轻量服务器、Docker Compose 和 Caddy 提供中国大陆主线路。
- 同步更新 Capacitor 导航白名单与本地错误页重试地址，不修改网页 UI、Supabase、Auth 或 AI 业务逻辑。
- 复用已验证的 GitHub Actions 长期签名流程，并将 Beta 3 作为新的真机验收版本。
- GitHub Actions run `30207828314` 完成 Capacitor 同步、debug 构建、长期签名校验、release APK/AAB 构建和 Prerelease 发布。
- Beta 3 APK 大小约 3.02 MB，SHA-256 为 `b196fd442b30334579eecffaa42e7c0e8b0c79e3f1cb698edf3cdc4afd5593e0`；本地下载后的压缩结构与内嵌大陆入口均验证通过。

## 2026-07-18 - Android Beta 白屏兼容修复

- 真实 Android 安装确认 `0.2.0-beta.1` 能下载安装，但启动后显示空白页。
- APK 审计确认 Vercel Production 地址、HTTPS 配置、`INTERNET` 权限和打包资源均正确；Android WebView 请求生产首页返回 HTTP 200。
- Next.js 16 默认浏览器基线为 Chrome 111；将 Web 构建目标下调至 Chrome / Edge / Firefox 90 和 Safari 15，扩大旧 Android System WebView 兼容范围。
- 为 Capacitor 增加本地 `errorPath`：主页面网络加载失败时显示中文检查说明和重试入口，不再保留无反馈白屏。
- QA：79 项现有测试、lint、Next.js 生产 build 和 Capacitor sync 全部通过。
- 修复提交 `dc0b55a` 已部署到 Vercel Production；首页和 `/api/deploy-health` 返回 200，Supabase 公共数据、FFmpeg 和 yt-dlp 健康信号正常。
- GitHub Actions run `29646310937` 使用长期证书成功生成并发布 `0.2.0-beta.2` 签名 APK 与 AAB。
- Beta 2 APK 大小约 3.02 MB，SHA-256 为 `0c32fac2ec640b0fde38efbcc0466e9e9f7febf1f1bd5b90e385c64d6ce15e9f`；本地重新下载后与 Release digest 一致，压缩结构无错误。
- 下一步仅剩 Android 真机覆盖安装验证；在设备结果返回前，不把白屏根因标记为完全确认。

## 2026-07-17

### Milestone 4 / Checkpoint A1 Android 可下载 Beta

- 新增 Capacitor 8 Android 原生外壳，固定包名 `com.rishibiji.app`、应用名“日食笔记”，复用现有 Vercel Production 与游客优先业务流程。
- 新增 GitHub Actions Android Beta 工作流：每次移动端相关提交构建可安装 debug APK；配置长期签名 Secret 后可生成 release APK、AAB 并创建 GitHub Prerelease。
- Android 签名信息只从 GitHub Secrets 读取，仓库忽略 keystore、签名配置和构建产物；不复制任何 Supabase 或 AI Secret 到 App。
- 保留 Vercel 和 Netlify 双平台服务端部署；Android App 不复制数据库、Auth 或 AI 后端。
- iOS App Store 暂不实施，避免每年 99 美元会员成本；Google Play 暂不付费，先用 GitHub 下载验证真实需求。
- 版本更新为 `0.2.0-working.17`；回滚基线为 `81e75b8`。
- GitHub Actions run `29582168527` 已在提交 `24330c9` 上成功完成首轮云端编译，生成约 3.58 MiB 的 `rishibiji-android-debug` Artifact。
- debug APK 仅用于构建验证；下一 Checkpoint 使用长期签名生成可持续覆盖升级的公开 Beta APK。
- 已生成并在本机安全备份长期 Android 签名证书，GitHub Actions 四个签名 Secret 已配置，仓库和日志不包含 Secret 内容。
- GitHub Actions run `29586070898` 成功生成签名 APK 与 AAB，并发布 `android-v0.2.0-beta.1` Prerelease。
- 公开 APK 下载完整性通过，大小 `3,167,674 bytes`，SHA-256 为 `f8a479e8c20f0e828b7ac81d01c258ba791776093d69186da1a418b29d717edd`。
- Checkpoint A2 仅剩 Android 真机安装、启动和游客主流程验收。

### Milestone 3 / Beta MVP 生产闭环完成

- 按产品决策暂停抖音大文件、空音轨和图文 OCR 边界优化；保留 ALAPI 代码、生产能力与失败记录，不删除、不继续扩展。
- 两条真实抖音视频完成 `ALAPI -> FFmpeg -> 火山 ASR -> DeepSeek -> Supabase`，生成“可乐鸡翅年糕”和“滑蛋鸡腿杂粮菠菜饭”，均加入当前登录账号云端收藏。
- 登录会话刷新后恢复；`/me` 显示 11 道生成、10 道收藏，`/favorites` 可再次打开两条动态菜谱，详情刷新后收藏状态恢复。
- Vercel Production 首页、Loading、收藏、我的、风味地图、三个 Station、两条动态详情和部署健康接口均返回 200；Supabase 公共数据可读，fallback 保留。
- 正文与小红书达到既定 Beta 门槛；抖音作为有限可用能力发布，已知空音轨、超过 100 MB 媒体和图文笔记继续安全失败，不阻塞 MVP 上线。
- Milestone 3 完成，版本更新为 `0.2.0-working.16`；代码回滚基线为 `61deaff`。

### Milestone 3 / Checkpoint B1 短视频质量门槛修复

- 生产样本确认 ALAPI、火山 ASR 和 DeepSeek 已成功，但通用 70 分质量门槛误拦截了信息较短、仍满足来源一致性底线的抖音菜谱。
- 分享链接正式保存门槛调整为 55 分；仍强制真实口播不少于 30 字、至少 2 个原文可验证食材、至少 3 步，并拒绝标题复述。
- 增加“信息稀疏但可执行”和“食材不来自口播”回归测试，提高 MVP 完成率而不放开无关内容。
- 版本更新为 `0.2.0-working.15`；代码回滚基线为 `76a6463`。

### Milestone 3 / Checkpoint B1 ALAPI 替换

- 按面向中国大陆用户的 Provider 选型规则，完整移除 TikHub 代码、环境变量和测试，替换为 ALAPI 短视频聚合解析。
- Next.js 服务端使用 `POST https://v3.alapi.cn/api/video/url`，从 `ALAPI_TOKEN` 读取鉴权信息，不向浏览器暴露 Token。
- 优先使用 ALAPI 返回的音频直链，否则使用视频直链进入 FFmpeg；保留媒体大小、HTTPS、DNS/私网、跳转与超时防护。
- 增加鉴权、余额、限流、非法 JSON、图文无音轨和媒体 URL 安全分类；没有真实语音时不生成假菜谱。
- 版本更新为 `0.2.0-working.14`；代码回滚基线为 `483afad`。

### Milestone 3 / Checkpoint B1 抖音 MVP 实现

- 确认真实抖音短链可展开，但直接 `yt-dlp` 需要新鲜匿名 Cookie；不引入用户 Cookie、浏览器抓取或登录绕过。
- 新增 TikHub App V3 服务端解析适配器，只取得公开作品媒体数据；媒体仍以流方式进入 FFmpeg，不永久保存视频。
- 抖音复用现有火山 ASR、阿里 fallback、DeepSeek、质量校验、Supabase 保存和动态详情链路。
- 增加 `iesdouyin.com` 官方跳转域名、安全媒体 URL 校验、HTTPS 跳转、超时、大小限制和图文无音轨分类。
- 六条真实抖音样本均通过短链规范化测试；真实付费验收等待服务端 `TIKHUB_API_KEY`，Checkpoint B1 尚未完成。
- 版本更新为 `0.2.0-working.13`；本轮代码回滚基线为 `0c7fa85`。

本文件记录 Recipe Ticket / 日食笔记的重要产品、代码和项目治理变化。

## 2026-07-16

### Milestone 3 / Checkpoint A3 完成

- 使用 7 条全新小红书公开做饭视频完成真实复验，7 条全部通过 `yt-dlp -> FFmpeg -> 火山 ASR -> DeepSeek`，无 fallback。
- 6 条本地完整链路平均约 44.8 秒、P95 约 48.9 秒、平均质量分 86.3；另 1 条 Vercel Production 样本约 29.2 秒、质量分 78。
- 合并 A2 历史样本后，小红书公开链接完成率为 10 / 12，即 83.3%，达到 Beta 80% 门槛。
- Production 样本确认用量缺失时按 2 人份透明估算；步骤时间、火候和重点提醒仍以来源为准，没有为提高评分而补写事实。
- 新版 yt-dlp 与现有单一路线未再复现媒体获取、ASR、AI 解析或质量失败；保留第 8 条备用链接未调用。
- 本轮未修改业务代码、UI、Auth、收藏、数据库 schema、RLS、Station 或风味地图。
- Checkpoint A3 完成并进入 Milestone 3 / Phase B；版本 `0.2.0-working.12`，代码回滚点 `c5d0c2d`。

### Milestone 3 / Checkpoint A2 完成

- 补齐 8 条真实正文样本，覆盖简单菜、详细菜谱、口语化转录和多做法合集；8 条均由 DeepSeek 单次调用成功解析，无 fallback。
- 10 条正文总体完成率 100%、平均质量分 92.6、P95 约 9.8 秒；新增 8 条共使用 15979 Tokens。
- Reviewer 识别出结构评分无法发现的来源一致性问题：模型会估算未说明的步骤时间，并偶尔补充常识 tips。
- 新增来源事实校验：未在原文出现的步骤时间和火候改为“未说明”，没有明确强调依据的 tips 自动清除。
- 按产品负责人决策，用量以用户可执行为优先：原文具体量最高优先；缺失时允许按 2 人份估算，但必须标记 `AI估算（按2人份）`。
- 增加确定性估算标记保护：模型给出数值但来源中找不到对应食材用量时，自动补充估算 note 和 warning；不覆盖来源明确用量。
- 强化合集边界、原文准备动作和来源优先 Prompt；新增来源事实校验测试。
- 最终 70 项测试、lint 和 production build 通过；未修改 UI、Auth、收藏、Station、风味地图或数据库 schema。
- GitHub `main@c5d0c2d` 已部署到 Vercel Production 并进入 READY；正式首页返回 200，Supabase、yt-dlp、FFmpeg 与 fallback 健康信号正常。
- Checkpoint A2 完成；小红书 60% 完成率仍未达到 Beta 门槛，自动进入 A3 专项修复。

### Milestone 3 / Checkpoint A2 首轮样本

- 新增原文重点提醒规则：只保留来源明确强调的注意事项，没有强调时不生成虚假重点。
- “醋蒸鸡”正文样本完成：质量分 92、12 项食材/调料、9 步，无 fallback；白醋选择、焯水程度、吸干水分和辣椒用油等重点写入 step tips。
- 4 条新增小红书样本中，“甜辣冷吃鸡翅”和“微波炉黄金脆皮鸡”成功；“捞汁小海鲜”和“无油花椒鸡腿”安全失败且没有半成品菜谱。
- 合并前一条“农家一碗香”后，小红书首轮 5 条样本成功率 60%，平均质量分 94.7，P95 约 30.9 秒，fallback 为 0。
- 新增媒体提取、DeepSeek 解析和质量校验的安全失败分类，避免全部写成通用 AI 错误。
- 固定 yt-dlp 从 `2025.10.14` 升级到官方 `2026.06.09`，Vercel 构建继续强制 SHA-256 校验。
- Vercel Production 提交 `301ee90` 部署 READY；健康接口确认 yt-dlp、FFmpeg 和 Supabase 均可用，首页返回 200。
- Checkpoint A2 保持进行中：正文样本 2 / 10，小红书成功率未达到 80% 门槛。

### Milestone 3 / Checkpoint A1 完成

- 复用现有解析响应，为 generation task 生成 Provider、模型、ASR Provider、fallback、耗时、质量分和 Token 数安全诊断。
- 小红书真实链路现在向前端返回 DeepSeek diagnostics，正文和视频流程使用同一诊断结构。
- `generation_tasks` 增加 `diagnostics jsonb` 字段；迁移后 RLS 保持开启，原有 3 条策略保持不变。
- 诊断数据不包含原始口播、完整来源链接、邮箱、Authorization 或 Secret。
- Vercel 登录生产会话正文样本写入成功：DeepSeek、无 fallback、质量分 86、约 5.0 秒、Token 1666。
- Vercel 登录生产会话小红书样本写入成功：火山 Seed ASR + DeepSeek、无 fallback、质量分 98、约 30.4 秒、Token 2727。
- 小红书动态菜谱包含 14 项食材/调料和 6 个步骤，task、recipe、ingredients 和 recipe_steps 关联完整。
- 本地 67 项测试、lint 和 production build 通过；Vercel Production 提交 `213a86a` 部署 READY。
- Checkpoint A1 回滚基线：`4911230`。

### Milestone 2 / Checkpoint C2 完成

- 超过 15 分钟的浏览器 processing 状态不再自动恢复付费解析，改为安全失败并提示重新提交。
- 登录用户创建新任务前，会把自己的过期 processing task 标记为 `generation_interrupted`，不影响其他用户或已完成任务。
- 保留现有菜谱写入失败级联清理；未修改数据库 schema、RLS 或 UI。
- 生产只读审计结果：过期 processing task、completed 无 recipe、生成菜谱缺 ingredients、缺 steps 均为 0。
- 完整回归 66 项测试、lint 和 production build 通过；Build 仅保留既有 Next.js NFT 文件追踪警告。
- Milestone 2 完成，进入 Milestone 3 / Phase A / Checkpoint A1。
- Checkpoint C2 回滚基线：`51303c6`。

### Milestone 2 / Checkpoint C1 完成

- 登录用户生成前按净化后的完整来源查询自己的已完成云端任务，跨设备或浏览器缓存失效后可复用既有动态菜谱。
- 云端缓存命中时不新建 generation task，也不再次请求 ASR 或 DeepSeek。
- 修复缓存命中后经 Loading 二次读取浏览器状态可能返回首页的问题；命中时由首页直接打开已有菜谱，新生成仍进入 Loading。
- 生产诊断确认重复提交期间没有新的 `/api/parse-recipe` 请求，数据库没有新增重复任务。
- 完整回归 64 项测试、lint 和 production build 通过；Build 仅保留既有 Next.js NFT 文件追踪警告。
- Checkpoint C1 回滚基线：`a4c7354`。

### Milestone 2 / Checkpoint B1 完成

- Vercel Magic Link Session 已建立，刷新 `/me` 后仍保持登录。
- 登录用户从首页生成“蒜蓉虾仁蒸蛋”，自动跳转 `/recipe/steamed-egg-with-garlic-shrimp`。
- Supabase 验证为 1 条 owner recipe、8 条 ingredients、5 条 steps 和 1 条已完成且正确关联的 generation task。
- 动态详情刷新后仍可读取；`/me` 云端菜谱从 3 道增加到 4 道。
- 云端收藏写入成功，favorite 与 recipe owner 一致。
- Checkpoint B1 回滚基线：`75dd3d3`。

### Vercel / Netlify 双平台兼容

- Vercel Production 已部署 GitHub `main` 提交 `b058dab`，页面、Supabase、DeepSeek、yt-dlp、FFmpeg 和火山 ASR 运行信号通过。
- Vercel 真实小红书样本在 24.9 秒内完成 `yt-dlp -> FFmpeg -> 火山 ASR -> DeepSeek`，返回“黄焖鸡”动态草稿。
- 首页在 Netlify Background Functions 不存在（404/405）时改走 Next.js `/api/parse-recipe`，保留 Netlify 后台任务路径且不重复创建业务实现。
- `/api/parse-recipe` 明确配置 60 秒最长运行时间，并补充双平台环境变量与部署策略文档。

### 小红书公开视频语音转菜谱 Working Release

- 新增小红书分享链接到 `yt-dlp` 的公开媒体解析，只支持小红书且不使用 Cookie。
- Netlify Linux 构建会下载固定版本的 yt-dlp 独立二进制并校验 SHA-256，不依赖函数运行时 Python。
- 媒体通过管道交给 FFmpeg，磁盘只产生随机临时 MP3；成功和失败都会删除临时目录。
- 新增统一 `transcribeAudio()`：火山 Seed ASR 主 Provider，明确失败后才调用阿里 Qwen ASR。
- 新增 transcript 来源一致性与菜谱质量校验；没有真实口播时不根据标题生成假菜谱。
- 新增 source hash 运行期去重和浏览器成功 slug 缓存，降低刷新或重复提交导致的重复付费。
- Loading 保持原设计并使用真实管线阶段数据，完成后跳转动态 recipe slug。
- 首页只负责创建待处理任务并立即进入 Loading；刷新 Loading 可恢复当前任务，不再先等待服务端完成后才展示动画。
- 待处理分享 URL 落盘前移除查询参数和 fragment，原始链接只用于当前内存请求。
- Supabase 表和 RLS 已只读复核，未关闭 RLS、未使用 service role、未修改 schema。

### 真实样本验收

- `一个神秘调料，让你的黄焖鸡有了灵魂！`：媒体和 FFmpeg 成功，Qwen ASR 备用成功，DeepSeek 生成 7 项食材、6 项调料和 9 个步骤。
- `省油版农家一碗香`：浏览器完整流程成功，生成动态 `/recipe/local-recipe-*`，刷新后仍存在，游客收藏页可读取。
- 火山主 ASR 使用真实样本成功：`provider=volcengine`、`model=seed-asr-2.0-turbo`、`usedFallback=false`，DeepSeek 生成“黄焖鸡”并通过质量校验。
- 该真实链路端到端约 16.5 秒；媒体约 5.6 秒，ASR 约 9.1 秒。
- 登录 Session 下普通正文生成已写入真实 `recipes / ingredients / recipe_steps / generation_tasks`，动态详情刷新后仍存在。
- Loading 回归生成 `/recipe/stir-fried-broccoli`；数据库包含 4 项食材、4 个步骤和 1 个已完成任务。
- 完整回归 60 项测试、lint 和 production build 通过；Build 仅保留 Next.js NFT 动态文件追踪警告。

## 2026-07-15

### Milestone 2 数据一致性基础 Checkpoint

- 建立 `Milestone → Phase → Checkpoint → Task` 四级推进与断点续作记录。
- Generation Task 使用当前创建的 Task ID 完成或失败，避免误更新历史任务。
- 解析失败、AI fallback 和云端保存失败会记录安全错误状态，同时保留可用详情页。
- 游客菜谱改为唯一 `local-recipe-*` slug，并在当前浏览器保留最多 50 道本地菜谱。
- 收藏、详情、“我的菜谱”和登录迁移按具体本地 slug 读取，避免新生成覆盖旧收藏。
- 菜谱详情读取到缺失食材或步骤的云端数据时不再视为完整菜谱。
- `/api/parse-recipe` 增加基础请求限流，生产环境默认隐藏开发测试入口。
- 本 Checkpoint 的回滚基线：`a1303b6`。

### 验证

- `npm test`：41 项通过。
- `npm run lint`：通过。
- `npm run build`：通过。
- 浏览器验证：游客正文生成进入唯一动态 slug，详情内容正确，收藏按钮可切换为“已收藏”。
- 下一 Checkpoint：公开小红书 / 抖音分享链接文字提取。

### 公开分享链接文字提取 Working Release

- 新增小红书、`xhslink`、抖音和 `v.douyin` 公开 HTTPS 链接识别。
- 支持最多 3 次同平台短链跳转，并在每一步重新执行域名和公网地址检查。
- 新增 SSRF 防护、8 秒超时、2 MB HTML 上限和 30000 字提取上限。
- 使用 `cheerio` 安全提取 Open Graph、description、JSON-LD、JSON script 和公开页面正文，不执行脚本或 `eval`。
- 支持从“说明文字 + 分享 URL”中提取干净链接，并在保存前移除查询参数和 fragment。
- `/api/parse-recipe` 只有在取得真实公开文字后才调用 DeepSeek；失败返回安全错误分类。
- 首页移除链接硬拦截；抓取失败时停留首页并显示内联中文提示，不生成无关 Mock 菜谱。
- 新增 URL、DNS、重定向、HTML、超时、超大响应和失败分类测试。
- Working Release 回滚基线：`07c54db`。
- 尚未完成：真实小红书 / 抖音分享短链验收。

## 2026-07-14

### AI Software Company 工作流

- 新增 `MASTER_PLAN.md`，作为产品使命、核心体验、设计语言和 MVP 边界的战略最高层。
- 新增 Architect、QA、Reviewer、Release Manager、Knowledge Manager 和 Product Analyst 职责文档。
- 将团队层级更新为：产品负责人 → MASTER_PLAN → ChatGPT（CTO + Product Director）→ Codex（Engineering Manager）。
- 固化十步开发闭环、Working Release、Stable Release、回滚记录和权限门槛。

### DeepSeek 真实解析优化

- 新增可配置的 DeepSeek 超时、受控重试和最大输出 Token。
- 使用 DeepSeek V4 非思考 JSON 模式，并识别 `finish_reason=length` 输出截断。
- 新增 Provider、模型、耗时、尝试次数、finish reason 和 Token usage 诊断。
- fallback 到 Mock 后继续保留真实 Provider 的失败诊断。
- 新增 `sourceUrl` 和 `rawText` 输入长度保护及 Prompt 注入隔离。
- `/dev/parse-test` 增加诊断展示和网络错误状态。

### 验证

- `npm run lint`：通过。
- `npm run build`：通过，包含 TypeScript 检查与应用路由构建。
- `/api/parse-recipe`：Mock 正常输入 200、空输入 400、非法 JSON 400、超长输入 413。
- DeepSeek 不可达模拟：成功 fallback 到 Mock，并保留 diagnostics。
- `/dev/parse-test`：浏览器 Preview 通过。
- Netlify Production `/api/parse-recipe`：HTTP 200，`provider=deepseek`，`usedFallback=false`。
- Netlify Production `/dev/parse-test`：HTTP 200，页面可用于同一接口的开发验证。
- Secret Scan：Netlify 部署记录无 Secret 命中；本地扫描仅发现空值示例、变量名和测试用 `test-key`。

### 解析样本测试体系

- 新增解析质量评分工具，覆盖食材、调料、步骤、火候、时间、标签、描述和置信度。
- 新增 16 条本地解析样本，覆盖详细文本、短文本、噪声文本、口语输入、缺失信息、重复步骤和 Prompt 注入。
- 新增 `npm run test:ai`，用于运行 DeepSeek Provider fallback、Prompt、结构校验和样本质量测试。
- 当前 `npm run test:ai`：23 项通过，不调用真实 DeepSeek API。

## 2026-07-13

### 新增

- 新增 `docs/AI_PROJECT_DIRECTOR.md`，建立项目级永久 AI Project Director 工作流。
- 新增 `docs/ROADMAP.md`，汇总已完成阶段、当前阶段、验收标准和人工依赖。
- 新增 `docs/CHANGELOG.md`，用于持续记录每轮交付。

### 更新

- 在 `README.md` 增加开发前强制阅读入口。
- 在根目录 `AGENTS.md` 增加 Project Director 强制启动规则，使支持仓库指令的 AI 工具进入项目后先读取工作流。
- 修正 `README.md` 中与当前 Supabase 和真实 AI 基础版状态不一致的旧描述。
- 根据产品负责人决策，将当前项目阶段更新为 `Phase 12`。
- 在 `docs/ROADMAP.md` 建立 10 项有序 `Next Queue`，首项为 DeepSeek 真实解析优化，末项为正式上线。
- 在 Project Director 工作流中加入 ROADMAP 队列自动维护规则；完成项保留记录并自动推进下一项，AI 不得擅自重排。

### 验证

- 本轮仅修改 Markdown 文档；Build、Lint、TypeScript、API、Database 和 Preview 不适用。
- 已检查文档路径、相互链接、工作流边界和 Git diff。
