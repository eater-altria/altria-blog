## Context

当前站点以中性色和极简组件为主，信息可读但缺少品牌个性。此次变更目标不是直接改代码，而是产出一份可评审、可执行的视觉规范文档，为后续 UI 重构提供统一基线。约束包括：保持现有信息架构不变、确保正文可读性、兼顾暗色对比度与交互可访问性。

## Goals / Non-Goals

**Goals:**
- 定义霓虹夜店风（Neon Club Cyberpunk）统一视觉语言，包括色彩、发光层级、排版与动效。
- 明确关键页面（Nav、Home、Posts、Forms、Admin）的组件化样式规则，避免后续实现风格漂移。
- 提供评审检查项，使设计与前端可用同一标准验收。

**Non-Goals:**
- 不在本次变更中实现页面代码改动。
- 不调整业务流程、权限模型、数据结构与接口行为。
- 不引入新的设计系统依赖或第三方组件库。

## Decisions

### 1) 采用“暗底 + 双霓虹高亮”的主风格
- Decision: 使用深色背景（`bg-0`/`bg-1`）承载内容，青蓝与洋红作为主高亮。
- Rationale: 赛博朋克识别度高，并与 Cloudflare 技术博客定位匹配。
- Alternatives considered:
  - 单色高亮（仅青蓝）：一致性强但视觉层级不足。
  - 亮底霓虹：冲击力高但长文阅读疲劳明显。

### 2) 发光效果分层而非全局泛滥
- Decision: 将 glow 限制在标题、按钮、标签和交互焦点；正文不发光。
- Rationale: 维持可读性，避免视觉噪声。
- Alternatives considered:
  - 全站发光：风格强但可读性和性能风险高。
  - 无发光：失去“霓虹夜店风”核心特征。

### 3) 关键组件先标准化，再推广到全站
- Decision: 先定义 Nav、Hero、Card、Button、Input 的规则，再扩展到 posts/admin/forms 页面。
- Rationale: 样式语义集中，降低后续改造成本。
- Alternatives considered:
  - 页面逐个自由设计：短期快，但长期一致性差。

### 4) 将评审文档定义为“必须交付物”
- Decision: 提供文档模板与验收清单（品牌一致性、可读性、交互反馈、对比度）。
- Rationale: 保证多人协作时决策可追踪、可复查。
- Alternatives considered:
  - 仅口头描述：信息易丢失，难以形成工程标准。

## Risks / Trade-offs

- [Risk] 霓虹效果过强导致阅读疲劳 → Mitigation: 正文使用低饱和文本色，发光只用于强调元素。
- [Risk] 暗色背景下对比度不足 → Mitigation: 为主文本、次文本、边框、链接定义最小对比度阈值。
- [Risk] 动效过多影响性能与观感 → Mitigation: 动效限定在 hover/focus，使用短时长和低频背景呼吸。
- [Risk] 页面间风格不一致 → Mitigation: 用 token + 组件规则驱动，实现前先走评审清单。

## Migration Plan

1. 在设计评审阶段确认 token 和组件规则。
2. 由前端按模块分批落地（globals -> nav/home -> forms/posts/admin）。
3. 每一批次通过视觉检查清单后再进入下一批。
4. 如出现可读性问题，优先回退高亮与动效强度，不回退结构样式。

Rollback strategy:
- 若上线后反馈眩光或对比不足，可快速切回旧色彩变量并禁用 glow 类，保留结构性改造。

## Open Questions

- 是否需要为“高对比模式”提供可切换主题（针对阅读敏感用户）？
- 首页 Hero 是否引入轻量装饰图形（网格/噪点）还是纯 CSS 效果？
- Admin 页面是否采用独立强调色（如酸绿）以区分前台用户视图？
