# Recipe Ticket / 日食笔记

把小红书、抖音美食视频和菜谱文字整理成干净菜谱，并支持收藏、自动分类和风味地图浏览。

## Android 下载与安装

> **普通用户请下载 `.apk` 文件。不要下载 `.aab`，它是应用市场使用的文件，不能直接安装到手机。**

### 推荐：从最新版页面下载

[**点击进入：日食笔记最新版下载页面**](https://github.com/celinehan77-blip/daysavor/releases)

这个入口会始终显示最新发布版本，不需要记住版本号。请打开页面最上方的版本，在 **Assets** 中下载文件名以 `.apk` 结尾的安装包。

当前最新版是 **Android 0.3.0-beta.8**，安装包名称：

```text
rishibiji-0.3.0-beta.8.apk
```

### 安装步骤

1. 在 Android 手机上点击上面的下载链接。
2. 下载完成后，打开 `.apk` 文件。
3. 如果系统提示“不允许安装未知应用”，按照页面提示临时允许当前浏览器安装应用。
4. 点击“安装”，完成后打开“日食笔记”。

GitHub 或浏览器可能提示 APK 来自应用商店之外。这是因为当前 Beta 版本通过 GitHub 分发，不代表文件损坏。请只从本仓库的 Releases 页面下载。

### 更新到新版本

新版本发布后，重新下载新的 `.apk` 并直接覆盖安装即可。通常不需要先卸载旧版本；先卸载可能清除只保存在本机的数据。

### iPhone 用户

目前没有可直接安装的 iOS 安装包。iPhone 用户可以先使用 [日食笔记网页版](https://app.recipetix.top)，并通过 Safari 的“添加到主屏幕”创建桌面入口。

## 主要功能

- 粘贴菜谱正文、字幕或公开美食视频链接，生成结构化菜谱
- 收藏和再次查找菜谱
- 按鸡、鸭、猪、牛、羊、鱼、虾、蟹等主要食材自动分类
- 风味地图与师傅分类入口
- 菜谱详情、食材和步骤展示
- Android 全屏移动端体验
- 未登录时可本地使用，登录后支持云端同步

## 使用说明

1. 打开首页，粘贴菜谱文字、字幕或支持的公开视频链接。
2. 点击“生成菜谱”，等待解析完成。
3. 在菜谱详情页查看食材和步骤，并按需收藏。
4. 在“风味地图”中按主要食材查找已生成或收藏的菜谱。

当前主要支持菜谱正文、字幕、公开小红书做饭视频和部分公开抖音视频。私密内容、需要登录或验证码的内容暂不支持。

## 当前状态

日食笔记目前处于 Android Beta 阶段，核心生成、收藏、分类和浏览流程已经可以使用。若遇到无法安装或页面异常，请在 [GitHub Issues](https://github.com/celinehan77-blip/daysavor/issues) 中反馈，并附上手机型号、Android 版本和问题截图。

---

## 开发者说明（普通用户无需阅读）

<details>
<summary>展开简要开发说明</summary>

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。真实服务变量按 `.env.example` 创建本地 `.env.local`；密钥只能保存在本地或部署平台 Secret 中，禁止提交到 GitHub。

数据库结构与迁移位于 `supabase/`。不配置外部服务时，项目仍可使用本地或 Mock fallback。其余配置请查看：

- [Supabase 手动配置](docs/SUPABASE_MANUAL_SETUP.md)
- [双平台部署](docs/DUAL_PLATFORM_DEPLOYMENT.md)
- [部署检查清单](docs/DEPLOYMENT_CHECKLIST.md)

</details>

## 项目文档

- [产品与开发总则](MASTER_PLAN.md)
- [项目路线图](docs/ROADMAP.md)
- [变更记录](docs/CHANGELOG.md)
- [AI 项目协作规则](docs/AI_PROJECT_DIRECTOR.md)
- [菜谱视觉素材库](docs/RECIPE_VISUAL_LIBRARY.md)

## 常用开发命令

```bash
npm run dev
npm run test
npm run lint
npm run build
```
