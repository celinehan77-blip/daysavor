# Chicken Station Cover Flow Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 Chicken Station 从离散轮播重构为连续、可拖动、带速度分级惯性和三维景深的 Cover Flow，同时保持业务功能和其他页面不变。

**Architecture:** 将手势判定与三维插值提取为无副作用运动模型，组件只负责把 MotionValue 映射到卡片样式、提交活动索引和导航。这样可以独立测试速度阈值与空间变换，并避免拖动期间 React 重渲染。

**Tech Stack:** Next.js、React、TypeScript、Motion、Node test runner、ESLint

---

### Task 1: 建立可测试的运动模型

**Files:**
- Create: `src/components/station/chickenStationMotion.ts`
- Test: `tests/ui/chickenStationMotion.test.ts`

1. 先写失败测试，覆盖连续偏移、中心/侧卡三维状态、慢拖单卡、快速甩动多卡和卡片数上限。
2. 单独运行测试并确认因运动模型尚不存在而失败。
3. 实现连续环形偏移、分段插值、速度投影和吸附时长计算。
4. 重跑测试，确认运动模型通过。

### Task 2: 接入连续 Cover Flow

**Files:**
- Modify: `src/components/station/ChickenStationScreen.tsx`

1. 用单一水平 MotionValue 表示实时拖动位移。
2. 让所有卡片从同一个连续进度派生三维空间和景深状态。
3. 为舞台加入 perspective，并为卡片启用 GPU 合成提示。
4. 保持现有卡片内容、数据和路由不变。

### Task 3: 实现速度分级惯性与无缝吸附

**Files:**
- Modify: `src/components/station/ChickenStationScreen.tsx`

1. 释放时综合拖动距离与速度计算目标卡数。
2. 慢拖最多一张，中速一至两张，高速两至三张。
3. 用带阻尼弹簧动画到目标进度，完成后提交索引并无缝归零。
4. 统一侧卡按钮和页码点的吸附动画，避免直接跳转。
5. 支持动画中重新抓取和 reduced motion。

### Task 4: 自动化验证与代码复核

1. 运行新增运动模型测试和项目完整测试。
2. 运行 `npm run lint` 和 `npm run build`。
3. 复核 React 生命周期、事件处理、无障碍和移动端性能。

### Task 5: 移动端交互验收

1. 复用本地开发服务器并打开三卡 Chicken Station 路由。
2. 在约 390px 宽视口检查中心卡、左右卡的空间层级。
3. 验证轻拖回弹、慢拖单卡、快速甩动多卡、侧卡点击和中心卡详情跳转。
4. 检查横向溢出与控制台错误；缺陷只在 Chicken Station 交互文件内迭代。

## 版本控制约束

本计划不自动提交、不 Push、不部署。只有获得产品负责人明确授权后才执行版本控制写操作。
