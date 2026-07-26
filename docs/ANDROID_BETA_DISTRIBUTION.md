# Android Beta 分发

## 当前目标

将“日食笔记”作为可安装 Android App 提供给小群用户，不改变现有 Web UI、Supabase、Auth 或 AI 服务。

当前 App 使用 Capacitor（把现有网页运行在 Android 原生容器中的工具），包名固定为：

```text
com.rishibiji.app
```

App 需要联网，业务由 `https://app.recipetix.top` 的阿里云中国大陆生产线路提供，数据和 AI 继续使用现有 Supabase 与服务端 API。GitHub APK 不包含任何服务端 Secret。

## 为什么先做 Android

- GitHub Releases 可以免费托管 APK，用户下载后可直接安装。
- Android 官方允许通过网站直接分发签名 APK，但用户需要允许浏览器安装未知来源应用。
- Google Play 开发者账号为一次性 25 美元，等 Beta 证明需求后再决定。
- Apple Developer Program 为每年 99 美元，因此当前不做 App Store 和 TestFlight 正式分发。

## GitHub Actions

工作流：`.github/workflows/android-beta.yml`

移动端相关文件推送到 `main` 后，工作流会自动：

1. 安装 Node.js 24 和 Java 21；
2. 同步 Capacitor Android 项目；
3. 构建可安装的 debug APK；
4. 将 APK 保存为 14 天有效的 GitHub Actions Artifact。

首轮云端构建已于 2026-07-17 通过：

- Workflow run：`29582168527`
- Commit：`24330c9`
- Artifact：`rishibiji-android-debug`
- 大小：`3,755,975 bytes`
- SHA-256：`3231fd1c06160e36a5daf48a759d20828d52226d722e49868a9e2c58cf8d928e`

该结果证明 Android 工程能在干净的 GitHub Runner 中同步、编译并产出 APK。它仍是短期 debug 构建，不直接发给 Beta 用户。

配置长期签名后，可以从 `Actions -> Android Beta -> Run workflow` 选择 `publish_release=true`，生成：

- `rishibiji-<version>.apk`：用户直接安装；
- `rishibiji-<version>.aab`：以后提交应用市场；
- GitHub Prerelease 下载页面。

## 长期签名

Android 每个安装包都必须签名。为了让用户以后直接覆盖升级，所有版本必须使用同一份 PKCS12 证书。

GitHub 仓库需要以下 Actions Secrets：

```text
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

禁止把 keystore、密码或 Base64 内容提交到 Git。签名证书必须单独备份；丢失后，GitHub 直装版本无法继续原地升级。

## 用户安装步骤

Beta 3 发布后的下载页：

```text
https://github.com/celinehan77-blip/recipe-ticket-app-v2/releases/tag/android-v0.2.1-beta.3
```

Beta 2 签名发布验证：

- GitHub Actions run：`29646310937`
- Commit：`dc0b55a`
- APK：`rishibiji-0.2.0-beta.2.apk`
- AAB：`rishibiji-0.2.0-beta.2.aab`
- APK 大小：约 `3.02 MB`
- APK SHA-256：`0c32fac2ec640b0fde38efbcc0466e9e9f7febf1f1bd5b90e385c64d6ce15e9f`
- 发布步骤：签名配置校验、release APK/AAB 构建和 GitHub Prerelease 均通过。
- 本地完整下载后 SHA-256 与 GitHub Release 一致，APK 压缩结构无错误。

长期证书和恢复信息只备份在本机：

```text
/Users/celine/Documents/日食笔记/mobile-signing-backup/android
```

该目录不属于 Git 仓库，文件权限为仅当前 macOS 用户可读。必须另做离线备份；不要把证书或密码发送到群聊、提交 Git 或放入公开云盘。

1. 用 Android 手机打开 GitHub Prerelease 下载页；
2. 下载 `.apk` 文件；
3. 系统提示时，仅为当前浏览器开启“允许安装未知应用”；
4. 安装“日食笔记”；
5. 打开 App，游客可直接生成、浏览和本地收藏。

## 当前边界

- 第一版 Android App 本质上复用线上产品，因此必须联网。
- Magic Link 从外部邮件 App 打开时，可能在系统浏览器建立登录状态，而不是回到 App；首轮 Beta 以游客主流程为准。
- GitHub Actions 的 debug APK 只用于构建验证，不作为公开长期版本；公开给用户的版本必须使用长期证书签名。
- `0.2.0-beta.1` 与 `0.2.0-beta.2` 已使用同一长期证书签名，可直接覆盖升级；后续版本必须继续使用同一证书。
- `0.2.0-beta.1` 首轮真机出现启动白屏；`0.2.0-beta.2` 将浏览器兼容目标下调到 Chrome 90，并增加网络/WebView 加载失败页。若仍失败，需记录错误页代码、手机 Android 版本和 Android System WebView/Chrome 版本。
- `0.2.1-beta.3` 保留相同包名和长期证书，将远程入口切换到阿里云中国大陆线路 `https://app.recipetix.top`，用于解决 Vercel 在部分大陆网络下加载不稳定的问题。
- 中国大陆应用市场通常还涉及实名认证、软件著作权、隐私政策或其他资质，本阶段不提前投入。
