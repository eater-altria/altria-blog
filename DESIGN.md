# Altria Journal — 界面设计说明

本文档描述本博客前端的视觉语言与实现约定，便于新增页面时与现有风格保持一致。

## 整体气质

- **暖色纸本 + 轻玻璃**：米杏背景（`--background`）、细网格与纵向渐变叠加，阅读区安静、偏编辑室而非高对比「控制台」。
- **主色为墨绿强调**（`--accent`）：用于悬停链接、描边强调、代码浅底、回复按钮等；避免用大色块铺满整屏。
- **圆角偏大**：卡片约 `1.25rem`，主按钮为全圆角药丸形，与柔和阴影一起形成「可拾起的纸片」感。
- **动效克制**：全局 `a` 与按钮类有过渡；主按钮悬停轻微上移（见 `globals.css`）。

## 设计令牌（CSS 变量）

定义位置：`src/app/globals.css` 的 `:root`。

| 令牌 | 用途 |
|------|------|
| `--background` | 页面底色 |
| `--foreground` | 主标题、正文强调色 |
| `--surface` / `--surface-strong` | 卡片玻璃底、内层衬底 |
| `--surface-border` / `--line-soft` / `--line-strong` | 边框层级：弱分割线、卡片边、强调边 |
| `--muted` / `--muted-strong` | 副文案、导航次要链接、标签 |
| `--accent` / `--accent-soft` | 品牌绿、浅绿背景块 |
| `--accent-rose` | 备用强调（当前少用） |
| `--danger` | 表单错误、危险操作文案 |

深色方案：完整的暗色调色板见 `:root[data-theme="dark"]`。`<html>` 上的 `data-theme` 由 `layout.tsx` 顶部的预水合内联脚本根据 `localStorage.theme`（`light` / `dark` / `system`，缺省 `system`）解析后写入，因此 CSS 只需匹配 `light` 或 `dark` 两个具体值。无 JS 时回退到 `@media (prefers-color-scheme: dark)`。新增颜色时同时为两套主题写入新的令牌，避免页面在切换时出现穿帮的硬编码色值——若需要添加半透明白色叠层等过渡色，请走 `--surface-raised` / `--surface-raised-strong` / `--input-bg` 等已经分别为亮/暗模式定义过的令牌，不要直接写 `bg-white/60` 或 `rgba(255,255,255,…)`。

## 字体

- **正文 UI**：`Geist Sans`（`layout.tsx` 注入 `--font-geist-sans`）。
- **等宽**：`Geist Mono`，用于 Markdown 编辑区等。

## 布局与留白

- **主容器**：根布局 `max-w-7xl`、`mx-auto`、`px-4 sm:px-6`；主内容区 `py-10 sm:py-12`。
- **顶栏**：`sticky`、底部分割线 `--line-soft`、半透明底与 `backdrop-blur`，与正文容器同宽约束。
- **分栏**：营销/账户页常用 `lg:grid-cols-[文案列_表单列]`（参考 `AuthShell`、`/me`）。

## 排版层级

1. **英文小标题（eyebrow）**  
   `text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-strong)]`  
   用于区块上方一行说明（写作归档、管理后台、账户页等）。

2. **首页首屏 eyebrow**  
   可略放宽字距：`tracking-[0.28em]`，与首屏大标题配套。

3. **页面主标题**  
   `text-3xl`～`text-5xl`（视页面而定）、`font-semibold`、`tracking-tight`、`text-[var(--foreground)]`。

4. **段落说明**  
   `text-base` / `text-sm`、`leading-7` 或 `leading-8`、`text-[var(--muted)]`。

5. **文章内排版**  
   使用 `article-prose` 容器；正文内链、引用、代码块等由页面或组件上的 Tailwind 任意选择器修饰（见 `/writing/[slug]` 与后台预览）。

## 组件类名（请在 TSX 中优先使用）

这些类在 `globals.css` 中实现；`cyber-*` 为历史别名，**与新代码请用左侧名称**。

| 语义名 | 作用 |
|--------|------|
| `surface-card` | 卡片面板：边框、圆角、玻璃底、阴影 |
| `story-link` | 正文/列表内链接：默认前景色，悬停 `--accent` |
| `button-primary` | 主按钮（深色填充） |
| `button-secondary` | 次按钮（浅底描边） |
| `soft-pill` | 浅绿描边标签/小徽章 |
| `input-shell` | 表单输入框样式 |
| `article-prose` | Markdown 渲染区基础排版 |

**状态色（无单独 utility 类时）**  

- 错误文案：`text-sm text-[var(--danger)]`（或 `text-xs` 视场景）。  
- 成功/提示可用：`text-[var(--accent)]`。

## 重复出现的模式

- **返回链接**：`text-sm text-[var(--muted)] hover:text-[var(--accent)]`，可加 `inline-flex` 与箭头符号。  
- **表格后台**：表格外层包一层 `surface-card`，表头 `border-b border-[var(--line-soft)] bg-white/60`。  
- **评论树**：顶层评论 `surface-card` 系圆角与浅底；嵌套回复左侧强调线用 `accent` 透明度区分（见 `ArticleCommentSection`）。  
- **Markdown 编辑器**：双栏均为 `surface-card`；栏目标题条使用与 eyebrow 一致的 `tracking-[0.24em]`。

## 与 Tailwind 的配合

- 颜色除上述组件类外，多用任意值 `text-[var(--muted)]`、`border-[var(--line-soft)]` 等，避免引入第二套调色板。  
- `@theme inline` 仅映射少量颜色与字体到 Tailwind；扩展主题时保持与 `:root` 同步。

## 检查清单（新页面）

- [ ] 是否复用 `surface-card` / `button-*` / `input-shell` / `story-link`？  
- [ ] 区块标题是否具备 eyebrow + 主标题 + 说明的层级之一？  
- [ ] 是否与 `layout.tsx` 的 `max-w-7xl` 内边距对齐？  
- [ ] 错误与禁用态是否有对比度与 `disabled:opacity-60` 等一致处理？
