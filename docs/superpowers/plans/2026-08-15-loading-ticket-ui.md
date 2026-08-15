# 收藏票根生成页 UI 精修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改生成业务逻辑的前提下，将现有 `/loading` 页面精修为统一尺寸、自然错落、严格压叠的四张收藏票根。

**Architecture:** 保留 `TicketLoadingScreen` 的现有 effect 与导航流程，只替换 JSX 视觉层，并把 Loading 专属样式从全局 CSS 收敛到独立 CSS Module。票根配置使用组件内固定数组，所有内容均为通用生成状态，不读取历史菜名。

**Tech Stack:** Next.js 16、React 19、TypeScript、Framer Motion、CSS Modules、Node Test。

## Global Constraints

- 不修改后台任务、数据库、API、路由、菜谱保存和解析逻辑。
- 不覆盖当前工作区中收藏页与风味地图的未提交动画优化。
- 不创建第二套 Loading 页面。

---

### Task 1: 锁定票根视觉结构

**Files:**
- Create: `tests/ui/loadingTicketVisual.test.ts`
- Modify: `src/components/loading/TicketLoadingScreen.tsx`
- Create: `src/components/loading/TicketLoadingScreen.module.css`

**Interfaces:**
- Consumes: existing `loadingSteps`, pending generation helpers, and router behavior.
- Produces: one existing `TicketLoadingScreen` with four uniform visual tickets.

- [x] 写失败测试，检查四张票根统一结构、固定层级、固定错位、阶段文案和印章。
- [x] 运行定向测试并确认因新结构尚不存在而失败。
- [x] 用固定配置数组渲染四张票根，保持 effect 和导航逻辑不变。
- [x] 增加独立 CSS Module，实现统一尺寸、压叠、纸张纹理、字体层级和响应式安全边距。
- [x] 运行测试并确认通过。

### Task 2: 精修进度与底部提示

**Files:**
- Modify: `src/components/loading/TicketLoadingScreen.tsx`
- Modify: `src/components/loading/TicketLoadingScreen.module.css`
- Modify: `tests/ui/loadingTicketVisual.test.ts`

**Interfaces:**
- Consumes: current `currentStep` state.
- Produces: five-step status list, subtle active pulse, and non-misleading AI generation hint.

- [x] 写失败测试，检查五步进度和 AI 提示卡。
- [x] 实现完成、当前、待处理三种视觉状态。
- [x] 实现减弱动画偏好和 320px 窄屏样式。
- [x] 运行测试、lint 和 build。

### Task 3: 浏览器验收与文档同步

**Files:**
- Modify: `docs/CHANGELOG.md`

**Interfaces:**
- Consumes: completed `/loading` page.
- Produces: browser-verified delivery at 320px and 390px.

- [x] 在真实浏览器打开 `/loading`，检查层级、溢出、控制台和页面完整性。
- [x] 复核生成结束后的原有跳转仍工作。
- [x] 更新 Changelog，仅记录已完成的 UI 能力。
