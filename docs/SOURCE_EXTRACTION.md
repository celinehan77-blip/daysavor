# Public Source Extraction

## 当前目标

公开分享链接提取层负责把公开小红书或抖音做饭视频转换成真实口播或画面菜谱文字，再交给现有 DeepSeek 菜谱解析管线。HTML 文案提取继续作为错误分类辅助，不再把标题当成完整菜谱来源。

```text
分享文字或 URL
→ URL 规范化
→ 平台域名与短链检查
→ ALAPI 解析公开媒体 URL
→ 火山 ASR 直接读取远程媒体
→ 语音不足时由 Qwen-VL 读取画面中的真实菜谱文字
→ 远程通路失败时才使用 FFmpeg 临时音频与 Qwen ASR
→ DeepSeek
→ ParsedRecipeDraft
```

## 支持范围

- 当前媒体链路支持小红书与抖音公开视频，两者优先使用 ALAPI；小红书保留 `yt-dlp` 末级兼容路径。
- 只允许 HTTPS，不接受账号密码 URL 或自定义端口。
- 不使用登录 Cookie、不模拟登录、不绕过验证码。
- 不永久保存完整视频；仅在语音不足时调用 Qwen-VL 读取公开视频画面中的菜谱文字。

## 媒体与语音顺序

1. ALAPI 返回公开作品媒体数据并完成 URL、域名、协议和公网 DNS 安全校验。
2. 火山录音文件极速识别直接读取远程媒体 URL，取得明确菜谱口播即结束。
3. 语音为空、纯音乐或缺少菜谱特征时，Qwen-VL 以低抽帧率读取画面中的真实字幕和菜谱信息。
4. 两个远程 Provider 均失败时，才使用原有 FFmpeg 临时音频与 Qwen ASR 兼容路径。
5. 语音和画面都没有真实菜谱内容时停止，不调用 DeepSeek 保存正式菜谱。
6. DeepSeek 输出还需通过食材、步骤、来源一致性和质量评分；标题估算不能单独通过。

临时目录使用随机名称，并在成功或失败的 `finally` 中递归删除。

## 安全边界

- 规范化 URL 后移除查询参数和 fragment，并生成 SHA-256 source hash。
- 不记录签名媒体 URL、Authorization、Secret 或原始 Provider 响应。
- 媒体子进程 60 秒超时，ASR 请求 35 秒超时。
- 同一运行实例复用相同 source hash 的进行中或已完成任务；浏览器保存成功 slug，避免刷新后重复进入付费链路。

## 失败策略

失败只返回以下安全分类：

- `unsupported_url`
- `unsafe_redirect`
- `fetch_blocked`
- `timeout`
- `response_too_large`
- `no_text`
- `invalid_html`

没有取得真实语音或画面菜谱文字时不会调用 DeepSeek，也不会生成无关菜谱。首页保留接口返回的具体安全错误。

## 当前验收结果

已使用 12 条新增真实小红书做饭视频验收 ALAPI：12 / 12 返回公开视频；7 条由火山 Seed ASR 取得可用菜谱口播，5 条无口播、纯音乐或 ASR 超时样本由 Qwen-VL 取得真实画面菜谱文字。完整 DeepSeek 结构化与线上生成结果以当次发布验收记录为准。

抖音 ALAPI 适配器和无付费测试已完成。抖音图文作品当前无音轨时返回安全错误，OCR 留到后续 Checkpoint。
