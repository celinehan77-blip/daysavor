# AI Parse Pipeline

## 1. 当前阶段目标

- 普通正文继续使用 DeepSeek 结构化解析，并保留 Mock fallback。
- 小红书公开做饭视频先由 yt-dlp 与 FFmpeg 提取语音，再使用火山 ASR；火山明确失败后才使用 Qwen ASR。
- 视频链路只接受真实 transcript，不允许根据标题生成常见菜谱。
- `ParsedRecipeDraft` 可以保存到本地，登录后可以尝试写入 Supabase recipe。
- 抖音公开视频已接入 ALAPI 媒体解析适配器；当前不支持 B 站、YouTube、用户上传或视频画面分析。

## 2. 输入

`POST /api/parse-recipe` 接收 JSON：

```json
{
  "sourceUrl": "https://example.com/mock-note",
  "rawText": "宫保鸡丁，鸡腿肉切丁，花生，大葱，酸甜微辣。",
  "sourcePlatform": "manual"
}
```

字段说明：

- `sourceUrl`：可选，用户粘贴的来源链接。
- `rawText`：可选，用户粘贴的普通菜谱文本。
- `sourcePlatform`：可选，支持 `xiaohongshu`、`douyin`、`manual`、`mock`。

`sourceUrl` 和 `rawText` 不能同时为空。

输入边界：

- `sourceUrl` 最多 2048 个字符。
- `rawText` 最多 30000 个字符。
- 超限请求会直接拒绝，不会进入付费 Provider。

## 3. 输出

接口返回 `RecipeParseResult`，其中核心结果是 `ParsedRecipeDraft`：

- `titleZh`
- `titleEn`
- `description`
- `timeMinutes`
- `difficulty`
- `flavor`
- `mainIngredient`
- `primaryIngredientTags`（可选，仅用于视觉检索）
- `ingredientImageTags`（可选，仅用于视觉检索）
- `seasoningImageTags`（可选，仅用于视觉检索）
- `stepActionTags`（可选，仅用于视觉检索）
- `heroImagePromptData`（可选，仅用于离线 Hero 生成提示）
- `heroVisualTags`（可选，本地推导的 Hero 语义标签）
- `visualAssets`（可选，已经分配的静态素材地址与匹配级别）
- `tags`
- `ingredients`
- `seasonings`
- `steps`
- `confidence`
- `warnings`

视觉语义字段不属于菜谱事实，不能反向修改食材、用量、步骤、时间或火候。校验器会去重并限制长度；旧输出缺失这些字段时返回空数组或 `null`。当前没有为视觉字段增加 Supabase Schema 或 migration，本地动态菜谱会保留这些可选字段，云端旧菜谱由详情页匹配器根据现有内容安全回退。

Hero 不在解析请求或浏览器页面中生成。解析完成后，视觉适配层只根据现有菜谱事实推导标签，并在 24 张静态 Hero 中按“精确菜名 → 别名 → 同分类近似语义 → 分类 fallback → 全局 fallback”选择。分类冲突候选在评分前排除，失败只降级图片，不会阻塞菜谱结构化和保存。

## 4. 当前流程

普通正文：

```text
POST /api/parse-recipe
-> parseRecipeInput()
-> 根据 AI_PROVIDER 选择 provider
-> AI_PROVIDER=deepseek 且 DEEPSEEK_API_KEY 存在时调用 DeepSeek
-> 使用 JSON Output + 非思考模式，记录 finish reason 和 Token usage
-> 对 408 / 429 / 5xx、网络失败、超时、空内容、截断和非法 JSON 做受控重试
-> DeepSeek 成功时返回 ParsedRecipeDraft
-> DeepSeek 失败、超时、未配置 key 或输出不合法时 fallback 到 mockRecipeParser()
-> 本地视觉适配层从已有字段推导 Hero 标签并分配静态视觉素材
-> 返回结构化草稿
```

公开小红书或抖音链接：

```text
POST /api/parse-recipe
-> normalizeShareUrl()
-> extractAudioWithYtDlp()
-> 小红书由 yt-dlp、抖音由 ALAPI 取得公开媒体流
-> 媒体流直接管道到 FFmpeg
-> 临时 16kHz 单声道 MP3
-> transcribeAudio()
-> 火山 Seed ASR 成功则结束；明确失败后调用 Qwen ASR
-> parseRecipeWithDeepSeek(transcript)
-> 来源一致性与质量校验
-> 本地视觉适配层分配静态 Hero、食材、调味和步骤图片
-> 返回 ParsedRecipeDraft 与 ASR/阶段诊断
-> finally 删除临时音频
```

当前 DeepSeek Provider 使用官方 OpenAI-compatible Chat Completions 接口。

Mock Parser 会根据输入文本中的关键词返回稳定草稿：

- `宫保`、`鸡丁`、`kung pao`：宫保鸡丁。
- `牛肉`、`beef`：土豆炖牛肉。
- `鱼`、`fish`：清蒸鱼。
- 无法识别时：默认宫保鸡丁，并在 `warnings` 中说明当前使用 Mock Parser。

## 5. 媒体提取边界

- 小红书调用 yt-dlp；抖音调用一个最小 ALAPI 服务端适配器，不增加 Playwright。
- 只处理无需登录即可读取的公开小红书与抖音内容。
- 不使用用户 Cookie，不模拟登录，不绕过验证码或访问控制。
- 不永久保存视频；临时音频在成功或失败后删除。
- 单条视频最多 5 分钟、媒体最多 100 MB、音频最多 8 MB。
- 没有真实 transcript 时返回中文提示，不调用 DeepSeek 生成无关内容。

## 6. 为什么 AI key 不能用 NEXT_PUBLIC

- `NEXT_PUBLIC_` 环境变量会暴露到浏览器。
- AI key 是服务端密钥，不能被用户看到。
- 真实 AI Provider 只能在服务端 API route 中调用。

当前预留环境变量：

```env
AI_PROVIDER=mock

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=30000
DEEPSEEK_MAX_RETRIES=1
DEEPSEEK_MAX_TOKENS=3000

ASR_PROVIDER=volcengine
ASR_FALLBACK_PROVIDER=aliyun_qwen
VOLC_ASR_API_KEY=
VOLC_ASR_APP_ID=
ALIBABA_ASR_API_KEY=
ALIBABA_ASR_BASE_URL=
ALIBABA_ASR_MODEL=qwen3-asr-flash
```

说明：

- 默认 `AI_PROVIDER=mock`，不需要真实 AI key。
- 如果设置 `AI_PROVIDER=deepseek`，并填写 `DEEPSEEK_API_KEY`，服务端会尝试调用 DeepSeek。
- `DEEPSEEK_BASE_URL` 和 `DEEPSEEK_MODEL` 可根据 DeepSeek 官方文档调整。
- `DEEPSEEK_TIMEOUT_MS` 限制单次请求等待时间，代码会约束在 5–60 秒。
- `DEEPSEEK_MAX_RETRIES` 默认 1，代码会约束在 0–2；重试可能增加费用。
- `DEEPSEEK_MAX_TOKENS` 默认 3000，代码会约束在 1000–8000。
- 所有 AI key 都是服务端密钥，不能使用 `NEXT_PUBLIC_` 前缀。
- Netlify 部署时需要在 Netlify Environment Variables 中添加这些服务端环境变量。

## 7. 当前真实验收

- 两条公开小红书做饭视频已通过 yt-dlp 与 FFmpeg。
- 火山主 ASR 已使用真实样本成功返回口播：`provider=volcengine`、`usedFallback=false`；Qwen ASR 备用也已在火山明确失败场景通过。
- DeepSeek 已生成“黄焖鸡”和“农家一碗香”动态菜谱，不是固定 Mock。
- 游客动态详情、刷新持久化和本地收藏已通过浏览器验证。
- 登录 Session 下 `recipes / ingredients / recipe_steps / generation_tasks` 真实写入、动态详情和刷新持久化已通过。
- 首页现在会立即进入 Loading，在后台完成解析和保存后跳转真实动态 slug；失败会回到首页显示内联提示。

## 8. 首页生成流程接入 parse API

当前首页生成流程已经接入解析接口，并会尝试把 draft 保存为真实 Supabase recipe：

```text
首页输入
-> POST /api/parse-recipe
-> 保存 latest parsed draft
-> 创建 generation task
-> 尝试写入 Supabase recipes / ingredients / recipe_steps
-> 保存 latestGeneratedRecipeSlug
-> loading
-> 进入 /recipe/[latestGeneratedRecipeSlug]
```

说明：

- 普通正文仍保留 Mock Parser fallback；视频链接没有真实 transcript 时不使用 Mock 生成假菜谱。
- 如果 DeepSeek 与 ASR 服务端变量配置正确，可以基于真实口播创建动态菜谱。
- 当前会尝试写入 Supabase `recipes / ingredients / recipe_steps`。
- 当前视频链路会在火山失败时调用 Qwen ASR，但不会调用 OpenAI。
- 当前解析公开小红书与抖音视频；ALAPI Token 只在服务端读取，不进入浏览器代码。
- 当前 `ParsedRecipeDraft` 仍会保存在当前浏览器的 `localStorage`，作为 fallback。
- 本地生成菜谱会随草稿保存 `heroVisualTags / visualAssets`；旧本地草稿首次读取时补齐并回写。
- 云端菜谱因本阶段不新增 Supabase 字段，在详情读取时确定性推导视觉素材，不做额外数据库查询。
- 视频媒体、ASR 或 DeepSeek 失败时不会生成无关 Mock 菜谱；Supabase 保存失败时保留本地动态菜谱。
- 后续阶段会继续复用同一套保存流程，并增强真实 AI 输出质量。

## 9. 稳定性与诊断

`RecipeParseResult.diagnostics` 在尝试真实 Provider 时包含：

- `attemptedProvider`：实际尝试的 Provider，即使最终 fallback 到 Mock 也会保留。
- `model`：请求或响应使用的模型名。
- `durationMs`：从开始尝试到返回结果的总耗时。
- `attemptCount`：实际调用次数。
- `finishReason`：模型停止输出的原因；`length` 会被视为截断失败。
- `usage`：prompt、completion 和 total Token 数，用于成本观察。

DeepSeek 官方说明 JSON Output 仍可能偶发返回空内容，因此当前实现会在配置范围内重试，然后安全 fallback。Prompt 会把用户内容标记为数据，忽略其中改变角色、泄露提示词或输出非菜谱内容的指令。

开发页 `/dev/parse-test` 会展示上述诊断信息。生产首页只消费稳定的 `draft / provider / usedFallback / error` 合约，不暴露 Secret。
