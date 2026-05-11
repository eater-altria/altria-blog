# CF Edge Blog

一个部署在 Cloudflare Workers 上的 Next.js 16 博客系统，使用 D1 持久化数据，支持：

- 公开浏览已发布文章
- 用户注册/登录与评论
- 文章详情页展示阅读数与评论数
- 首页展示热门文章（按阅读数 Top 3）
- 文章详情页左侧目录（由 Markdown 标题生成）、顶部阅读进度条，正文与评论区同宽居中布局
- `super_admin` 后台写作、预览草稿、发布快照
- RSS 与站点地图自动输出

本文档重点是后续维护，便于快速理解项目结构和日常操作。

## 技术栈

- Next.js 16 + App Router
- React 19
- Cloudflare Workers（通过 `@opennextjs/cloudflare`）
- Cloudflare D1 + Drizzle ORM
- TypeScript + ESLint + Tailwind CSS 4

## 目录结构（维护视角）

```txt
cf-edge-blog/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                      # 首页
│  │  ├─ writing/                      # 前台文章列表与详情
│  │  ├─ posts/                        # 兼容旧链接，跳转到 /writing
│  │  ├─ admin/                        # 后台管理页面（super_admin）
│  │  ├─ login/ register/              # 登录/注册页面
│  │  ├─ api/
│  │  │  ├─ auth/                      # 注册/登录/退出
│  │  │  ├─ posts/[slug]/comments/     # 评论接口
│  │  │  └─ admin/posts/               # 文章增改与发布接口
│  │  ├─ rss.xml/route.ts              # RSS 输出（仅已发布）
│  │  └─ sitemap.ts                    # Sitemap 输出（仅已发布）
│  ├─ components/
│  │  ├─ forms/                        # 各页面表单组件
│  │  ├─ post/                         # 文章目录与阅读进度（ArticleTocProgress）
│  │  ├─ Nav.tsx
│  │  └─ LogoutButton.tsx
│  ├─ db/
│  │  ├─ schema.ts                     # Drizzle 表结构映射
│  │  └─ index.ts                      # D1 绑定与 DB 实例
│  └─ lib/
│     ├─ auth/                         # 密码、会话、权限守卫
│     ├─ markdown.ts render-post.ts    # Markdown 渲染逻辑
│     ├─ site.ts                       # 站点 URL 工具
│     └─ constants.ts                  # 业务常量（如 cookie 名）
├─ migrations/
│  └─ 0001_init.sql                    # D1 初始结构
├─ wrangler.jsonc                      # Workers + D1 绑定配置
├─ open-next.config.ts                 # OpenNext 打包配置
└─ package.json                        # 脚本与依赖入口
```

## 核心业务规则

- 注册接口只会创建 `user` 角色，不能通过 API 提升权限。
- `super_admin` 必须通过 D1 手动写入。
- 游客只能浏览已发布文章，不能评论。
- 已登录 `user` 只能在“已发布”文章下评论。
- 后台发布模型是“草稿 -> 发布快照”：
  - 草稿可持续编辑；
  - 前台始终读取 `post_published` 快照；
  - 重新发布才会更新线上内容。

## 数据模型说明

`migrations/0001_init.sql` 与后续增量迁移定义了核心表结构：

- `users`：账号与角色（`user` / `super_admin`）
- `sessions`：登录会话
- `posts`：文章基础信息（标题、slug）
- `post_drafts`：草稿正文
- `post_published`：线上发布快照
  - `read_count`：文章阅读次数（默认 0，用于热门排序）
- `comments`：评论

这个“草稿和发布分离”的设计，是维护时最重要的业务前提。

## 本地开发

前置条件：

- Node.js 18+
- 已安装并登录 `wrangler`

初始化步骤：

```bash
npm install
npx wrangler d1 create cf-edge-blog-db
```

把返回的 `database_id` 填到 `wrangler.jsonc` 的 `d1_databases[0].database_id`。

应用本地迁移：

```bash
npm run d1:migrate:local
```

启动开发：

```bash
npm run dev
```

可选：更新 Cloudflare 绑定类型

```bash
npm run cf-typegen
```

## 部署相关命令

- `npm run build`：常规 Next.js 构建
- `npm run build:worker`：构建 OpenNext Workers 产物
- `npm run preview:worker`：本地预览 Worker 产物
- `npm run deploy:worker`：部署到 Cloudflare
- 生产环境的 **`NEXT_PUBLIC_SITE_URL`** 在 `wrangler.jsonc` 的 **`vars`** 中设置（当前为 `https://docs.altriayu.uk`），供 RSS、sitemap 与绝对链接使用。若你在 [Cloudflare Workers 仪表盘](https://dash.cloudflare.com/) 为同一 Worker 配置了同名环境变量，部署时会以仪表盘为准。
- 新增用户中心/风控相关配置：
  - `r2_buckets.AVATAR_R2`：头像对象存储桶绑定（例如 `cf-edge-blog-avatars`）。
  - `NEXT_PUBLIC_AVATAR_BASE_URL`：头像公开访问基地址（用于拼接 `avatar_url`）。
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`：前端 Turnstile Site Key。
  - `TURNSTILE_SECRET_KEY`：服务端 Turnstile Secret（建议通过 `wrangler secret put TURNSTILE_SECRET_KEY` 注入）。

生产库迁移示例：

```bash
npx wrangler d1 migrations apply cf-edge-blog-db --remote
```

## 初始化 super_admin

先生成 bcrypt hash：

```bash
node -e "require('bcryptjs').hash('choose-a-strong-password', 10).then(console.log)"
```

再手动写入 D1（示例）：

```sql
INSERT INTO users (id, email, password_hash, role, created_at)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'you@example.com',
  '<paste-bcrypt-hash-here>',
  'super_admin',
  (strftime('%s','now') * 1000)
);
```

## 维护建议（建议长期保留）

- 配置与环境
  - `NEXT_PUBLIC_SITE_URL` 需与线上域名一致（RSS/Sitemap 依赖它生成绝对链接）；本仓库在生产侧默认写在 `wrangler.jsonc` → `vars`。
  - 每次新建环境都先确认 `wrangler.jsonc` 的 D1 绑定是否正确。
- 安全
  - 注册与评论接口已接入 Turnstile 校验；若线上出现异常大量失败，先检查 `TURNSTILE_SECRET_KEY` 与站点域名白名单配置。
  - 给登录、注册、评论接口加速率限制。
  - 定期清理过期会话，轮换会话密钥策略。
- 数据与发布
  - 头像上传策略：仅支持 PNG/JPEG/WEBP，最大 2MB；同一用户上传新头像会删除旧 `avatar_key` 对象，减少 R2 垃圾文件。
  - 发布前先用后台预览确认 Markdown 渲染结果。
  - 迁移文件只增不改，避免环境漂移。
- 工程协作
  - 修改 API 或数据结构时同步更新本 README。
  - 新增目录时在“目录结构”补充职责说明，降低新人理解成本。

## 风控/头像故障回滚清单

1. 临时关闭前端注册/评论入口或在 UI 上提示“稍后再试”，防止用户陷入重复失败。
2. 核对 Workers 环境变量与 Secret：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、`NEXT_PUBLIC_AVATAR_BASE_URL`。
3. 若 R2 写入异常，优先保留用户名编辑功能，并暂时禁用头像上传按钮（保持核心功能可用）。
4. 如需紧急回滚，回退到上一版本 Worker，并保留 `username/avatar_*` 列（数据向后兼容，无需回滚迁移）。
