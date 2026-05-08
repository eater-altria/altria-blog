## Why

当前页面风格偏简洁通用，品牌辨识度弱，无法体现“边缘计算 + 云原生”产品调性。为提升第一印象与记忆点，需要将整体视觉升级为霓虹夜店风赛博科技感，并形成可评审、可落地的统一设计规范文档。

## What Changes

- 新增一份“霓虹夜店风”视觉规范，覆盖色彩、排版、组件语义、动效节奏与可访问性边界。
- 为站点关键页面定义统一样式策略：顶部导航、首页 Hero、文章卡片、表单与后台管理页面。
- 引入可复用设计令牌（tokens）与类名规范，作为后续实现阶段的唯一视觉基线。
- 增加评审清单，确保设计稿在可读性、品牌一致性和工程可实施性上可验收。

## Capabilities

### New Capabilities
- `cyberpunk-neon-theme-spec`: 定义霓虹夜店风设计系统（颜色、发光层级、组件风格、状态与动效规则）。
- `theme-review-documentation`: 定义可评审文档结构与验收标准，支持设计与前端共同评审。

### Modified Capabilities
- None.

## Impact

- Affected docs:
  - `openspec/changes/neon-nightclub-theme-doc/proposal.md`
  - `openspec/changes/neon-nightclub-theme-doc/design.md`
  - `openspec/changes/neon-nightclub-theme-doc/specs/**/spec.md`
  - `openspec/changes/neon-nightclub-theme-doc/tasks.md`
- Affected product surface (for later implementation):
  - `src/app/globals.css`
  - `src/components/Nav.tsx`
  - `src/app/page.tsx`
  - `src/components/forms/*`
  - `src/app/posts/*`
  - `src/app/admin/*`
