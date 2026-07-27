# AI Release Manager

## 职责

RELEASE_MANAGER 以 Working Release 为单位管理版本，而不是把每个 Commit 都视为可发布版本。

## 版本规则

- `MAJOR`：不兼容的产品或数据变化。
- `MINOR`：向后兼容的新功能或完成一个重要 Phase。
- `PATCH`：向后兼容的 Bug、安全或稳定性修复。
- 未通过发布门槛的改动使用 `<version>-working`，不创建 Git Tag。

## 发布门槛

只有同时满足以下条件才能准备 Stable Release：

- QA_AGENT：PASS。
- REVIEW_AGENT：PASS。
- README、ROADMAP、CHANGELOG 和相关 docs 已同步。
- 已记录回滚版本与迁移风险。
- 用户已授权 Git commit、tag、push 和正式 release 操作。

## Release 记录字段

每个 Stable Release 必须记录：Version、Commit Hash、Phase、日期、功能、QA、Reviewer、Rollback Version 和 Release Note。

## 当前版本登记

| Version | Commit | Phase | 状态 | Rollback |
| --- | --- | --- | --- | --- |
| `0.3.0-beta.4` | 发布候选工作区 | Milestone 4 / A2 | 全屏移动端、自动分类、风味地图票根与 3D Cover Flow；等待签名 Prerelease | `android-v0.2.1-beta.3` |
| `0.2.0-beta.1` | `b23e24d` | Milestone 4 / A2 | 长期签名 APK/AAB 与 GitHub Prerelease 已发布；待 Android 真机验收 | `81e75b8` |
| `0.2.0-working.17` | `24330c9` | Milestone 4 / A1 | Capacitor Android 与 GitHub Actions debug APK 构建已验证 | `81e75b8` |
| `0.2.0-working.16` | 当前工作区 | Milestone 3 / D1 | Beta MVP 生产闭环验收完成；等待真实用户反馈，不创建 Stable Tag | `61deaff` |
| `0.2.0-working.15` | `61deaff` | Milestone 3 / B1 | ALAPI 生产样本、短视频质量门槛修复；79 tests、lint、build 通过 | `76a6463` |
| `0.2.0-working.14` | 当前工作区 | Milestone 3 / B1 | ALAPI 替换 TikHub；待抖音生产样本验收 | `483afad` |
| `0.2.0-working.13` | 当前工作区 | Milestone 3 / B1 | 抖音公开媒体适配器与安全测试通过；待真实 TikHub Key 验收 | `0c7fa85` |
| `0.2.0-working.12` | 当前 Checkpoint Commit | Milestone 3 / A3 | 新增小红书真实样本 7 / 7，合并完成率 83.3%，达到 Beta 门槛 | `c5d0c2d` |
| `0.2.0-working.11` | `c5d0c2d` | Milestone 3 / A2 | 10 条正文基线、来源事实校验与透明用量估算规则；Vercel READY | `87362ef` |
| `0.2.0-working.10` | `301ee90` | Milestone 3 / A2 | 真实样本首轮、重点提醒、失败分类与 yt-dlp 升级；Vercel READY | `001463e` |
| `0.2.0-working.9` | 当前工作区 | Milestone 3 / A1 | 正文与小红书生产 diagnostics 写入、RLS 与动态菜谱完整性验收通过 | `4911230` |
| `0.2.0-working.8` | 当前工作区 | Milestone 2 / C2 | 过期任务恢复、孤儿数据审计与 Milestone 2 收口；66 tests、lint、build 通过 | `51303c6` |
| `0.2.0-working.7` | 当前工作区 | Milestone 2 / C1 | 同来源云端任务复用、重复付费防护与缓存命中导航修复；64 tests、lint、build 通过 | `a4c7354` |
| `0.2.0-working.6` | 当前工作区 | Milestone 2 / C1 | B1 生产登录、四表写入、动态详情与云端收藏验收通过 | `75dd3d3` |
| `0.2.0-working.5` | 当前工作区 | Milestone 2 / B1 | Vercel 真实样本、61 tests、lint、build、Secret Scan 通过 | `b058dab` |
| `0.2.0-working.4` | 未提交工作区 | Milestone 2 / A1 | 小红书视频语音链路本地验收完成；待 Git/Netlify 发布 | 最近安全提交 `0a35bb1` |

当前 Android Beta 使用 `android-v<version>` Prerelease Tag；`0.3.0-beta.4` 必须在 QA、Reviewer、生产 migration、同提交 Web 部署和 GitHub 签名资产验证通过后才能标记为已发布。
