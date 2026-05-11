---
title: "用 Cloudflare + Next.js 从零做一个带后台的博客"
slug: "build-your-own-cf-blog"
description: "一份 Vibe Coding 实录 + 入门教程：用 Cloudflare Workers / D1 / R2 / Turnstile 和 Next.js 16 完整复刻一个带后台、评论、风控、RSS 的个人博客系统。"
author: "Altria"
authorUrl: "https://docs.altriayu.uk"
createdAt: "2026-05-10"
updatedAt: "2026-05-10"
status: "published"
language: "zh-CN"
license: "CC BY-NC-SA 4.0"
category: "engineering"
tags:
  - cloudflare
  - workers
  - nextjs
  - d1
  - r2
  - turnstile
  - opennext
  - drizzle
  - blog
  - tutorial
  - vibe-coding
keywords:
  - Cloudflare Workers 博客
  - Next.js 16 部署 Cloudflare
  - OpenNext Cloudflare
  - D1 Drizzle 教程
  - R2 图片上传
  - Turnstile 接入
  - 个人博客全栈
audience: "对 Cloudflare 不熟悉、有一点前端基础的开发者"
prerequisites:
  - "Node.js 18+ 与 npm 基础"
  - "用过任意一个前端框架（React 优先）"
  - "拥有一个 Cloudflare 账号（免费即可）"
readingMinutes: 25
wordCount: 5800
toc: true
canonical: "https://docs.altriayu.uk/writing/build-your-own-cf-blog"
repository: "https://github.com/altriayu/cf-edge-blog"
relatedSpecs:
  - "openspec/specs/post-engagement-metrics/spec.md"
  - "openspec/specs/registration-comment-risk-control/spec.md"
  - "openspec/specs/user-profile-customization/spec.md"
techStack:
  framework: "Next.js 16 (App Router) + React 19"
  runtime: "Cloudflare Workers via @opennextjs/cloudflare"
  database: "Cloudflare D1 + Drizzle ORM"
  storage: "Cloudflare R2"
  riskControl: "Cloudflare Turnstile"
  styling: "Tailwind CSS 4"
  language: "TypeScript"
---

# 用 Cloudflare + Next.js 从零做一个带后台的博客

> 这是一份「Vibe Coding 实录 + 入门教程」，不是冷冰冰的 API 文档。
> 目标读者：**没怎么碰过 Cloudflare、但写过一点点前端**的人。
> 看完之后，你应该能理解我们这套博客系统每一块为什么这样选、长什么样，并且能照着自己复刻一个。

---

## 0. 这个项目到底是个什么

一句话：**一个 Next.js 16 写的个人博客，整套部署在 Cloudflare 上，没有任何一台传统服务器。**

它具备一个"现代博客"该有的几乎所有功能：

- 公开浏览已发布文章（`/`、`/writing`、`/writing/[slug]`）
- 文章详情页带左侧目录、顶部阅读进度条、阅读数、评论数
- 首页有"最近更新 + 热门 Top 3"
- 用户可以注册、登录、改用户名、传头像
- 已登录用户能在已发布文章下评论
- 注册和评论接入 **Cloudflare Turnstile** 反爬反刷
- 管理员（`super_admin`）后台写 Markdown，**草稿 / 发布快照分离**，支持预览
- Markdown 编辑器内 **粘贴图片直接上传到 R2**，自动插入图片链接
- 自动输出 `/rss.xml` 和 `/sitemap.xml`

技术栈极度收敛：

| 层级       | 选择                                              | 角色                                  |
| ---------- | ------------------------------------------------- | ------------------------------------- |
| 框架       | Next.js 16（App Router）+ React 19                 | UI、路由、Server Components、API     |
| 运行时     | Cloudflare Workers（通过 `@opennextjs/cloudflare`）| 全部 SSR / API 跑在 Workers 上       |
| 数据库     | Cloudflare D1（基于 SQLite）+ Drizzle ORM         | 文章、用户、评论、会话                |
| 对象存储   | Cloudflare R2                                     | 头像和文章插图                        |
| 风控       | Cloudflare Turnstile                              | 注册 / 评论的人机验证                 |
| 静态资产   | Workers Assets                                    | Next.js 构建出的静态资源              |
| 工具链     | Wrangler CLI                                      | 本地开发、迁移、部署                  |

整套东西的好处在一句话里讲完：**几乎免运维、按需计费、全球边缘节点、配置只有一个 `wrangler.jsonc`。**

---

## 1. 一张图看懂架构

```
                       ┌────────────────────────────┐
            浏览器  ──▶ │  Cloudflare Edge (Workers) │
                       │  ─ Next.js 16 SSR / API     │
                       │  ─ /rss.xml /sitemap.xml    │
                       └─────┬───────────┬───────┬───┘
                             │           │       │
                       D1 (SQLite)    R2 桶   Turnstile siteverify
                       users/posts/   头像、    人机校验
                       comments…      插图
```

请求生命周期（举例：访问一篇文章）：

1. 浏览器请求 `https://your-domain/writing/hello-world`
2. Cloudflare 边缘节点把请求路由给你的 Worker
3. Worker 内运行的 Next.js 在 Server Component 里：
   - 通过 `getCloudflareContext()` 拿到 D1 binding
   - Drizzle 查 `posts` + `post_published` + `comments`
   - 把 Markdown 渲染成 HTML、提取目录
4. 服务端把渲染好的 HTML 流式返回
5. 客户端水合后，目录 / 进度条 / 评论表单等交互组件接管

**没有反向代理、没有 PM2、没有 Nginx、没有 Docker。** 你写的代码就是一个 Worker。

---

## 2. Cloudflare 这几样东西到底是什么

如果你只听过 Cloudflare 是个 CDN，下面这部分先把名词都讲清楚。

### 2.1 Workers — 你的"服务器"

可以理解成"**一个 V8 沙箱里运行的 JavaScript 函数**"，每个请求触发一次。它有几个关键特性：

- 全球 300+ 节点冷启动时间可以忽略
- **不是 Node.js**：默认是 V8 + Web 标准 API（`fetch`、`Request`、`Response`、`crypto.subtle`...）
- 通过 `compatibility_flags: ["nodejs_compat"]` 可以让一部分 Node API 可用（例如 `bcryptjs` 用到的 `Buffer`）
- 资源限制：CPU 时间一般几十毫秒、内存 128MB——所以你写的代码会被迫保持轻量

### 2.2 D1 — 跑在 Workers 旁边的 SQLite

- 协议层兼容 SQLite，文件级数据库由 Cloudflare 托管
- 通过 **binding** 暴露给 Worker：`env.DB.prepare(...)`
- 适合中小型项目（博客、SaaS MVP、内部工具）。本项目所有写操作都走 D1
- 我们用 [Drizzle ORM](https://orm.drizzle.team) 包了一层，享受类型推导和 SQL builder

### 2.3 R2 — 兼容 S3 的对象存储

- 和 AWS S3 几乎同一种 API，但是 **不收"egress"出口流量费**
- 通过 binding 暴露：`env.AVATAR_R2.put(key, bytes, ...)`
- 我们一桶两用：用户头像 (`blog/{ts}-{uuid}.png`) + 文章插图 (`image/blog/YYYY/MM/{ts}-{uuid}.ext`)
- 想让别人能看到 R2 里的图，需要给桶绑一个公开访问的自定义域名（比如我把 `images.altriayu.uk` CNAME 到了 R2）

### 2.4 Turnstile — 不烦人的人机验证

- 是 Cloudflare 版的 reCAPTCHA，但默认是"无感"的
- 前端加一个 widget 拿到 token，后端拿 secret + token 去 `siteverify` 校验
- 我们把它放在了**注册和评论**两个最容易被刷的入口

### 2.5 Wrangler — Cloudflare 的命令行

- 本地开发、日志、迁移、部署都是它
- 关键命令：`wrangler dev` / `wrangler deploy` / `wrangler d1 migrations apply` / `wrangler secret put`
- 你的所有 binding（D1、R2、env vars）都写在 `wrangler.jsonc` 里

---

## 3. 为什么 Next.js + Workers 能搭上？答案是 OpenNext

Next.js 默认是冲着 Vercel / Node.js 跑的，并不直接支持 Workers 这种"非 Node 运行时"。

[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) 是社区项目，**把 Next.js 的构建产物适配成一个 Workers 入口**：

- 你照常写 App Router、Server Components、Route Handlers
- 它把 SSR、API、middleware 都打包到 `.open-next/worker.js`
- 把静态资产放到 `.open-next/assets/`，由 Workers Assets 提供
- 通过 `getCloudflareContext()` 让你在任何 Server 代码里访问 `env`（D1、R2、Vars 全在里面）

本仓库里相关的关键文件：

```12:14:next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ["@opennextjs/cloudflare"],
};
```

```1:3:open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
```

```1:13:wrangler.jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"main": ".open-next/worker.js",
	"name": "cf-edge-blog",
	"compatibility_date": "2025-05-01",
	"compatibility_flags": [
		"nodejs_compat",
		"global_fetch_strictly_public"
	],
	"assets": {
		"directory": ".open-next/assets",
		"binding": "ASSETS"
	},
```

> **Tip**：本项目的 `AGENTS.md` 警告了一句"This is NOT the Next.js you know"。Next.js 16 的 App Router 在 `params`、`cookies()`、`headers()` 等地方都改成了 **Promise-based API**。你照着教程写之前，建议先扫一眼 `node_modules/next/dist/docs/` 里相应的迁移说明。

---

## 4. 一步一步从零开始做你自己的版本

下面这一节，是**你跟着做就能完整上线**的版本。我会指明每一步是在干嘛，以及它对应到本仓库的哪个文件。

### 步骤 0：你需要准备

- Node.js 18+（推荐 20+）
- 一个 [Cloudflare 账号](https://dash.cloudflare.com)（免费即可起步）
- 一个域名，托管在 Cloudflare 上（域名不强制，但生产环境强烈推荐）
- 安装 Wrangler 并登录：

```bash
npm install -g wrangler
wrangler login
```

### 步骤 1：起一个 Next.js 项目并接 OpenNext

```bash
npx create-next-app@latest my-blog --ts --app --tailwind
cd my-blog
npm install @opennextjs/cloudflare wrangler
```

把 `next.config.ts`、`open-next.config.ts`、`wrangler.jsonc` 仿照本仓库的写法配上（见上一节的代码片段）。

加几条 npm script（参考 `package.json`）：

```json
{
  "scripts": {
    "dev": "next dev",
    "build:worker": "opennextjs-cloudflare build",
    "preview:worker": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy:worker": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

### 步骤 2：创建 D1 数据库

```bash
wrangler d1 create my-blog-db
```

它会输出一段 JSON，把 `database_id` 写到 `wrangler.jsonc`：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "my-blog-db",
    "database_id": "<paste-here>"
  }
]
```

跑一次 `npm run cf-typegen`，会生成 `cloudflare-env.d.ts`。从此 `env.DB`、`env.AVATAR_R2`、`env.NEXT_PUBLIC_SITE_URL` 这些都有 TS 类型了。

### 步骤 3：建表（迁移）

在 `migrations/0001_init.sql` 里写表结构，可以照抄本仓库的：

```1:48:migrations/0001_init.sql
-- Users: web registration creates role `user` only. Super admins are inserted via D1 (or wrangler d1 execute).
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'super_admin')),
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Draft markdown: edited by admins; publishing copies this into post_published.
CREATE TABLE post_drafts (
  post_id TEXT PRIMARY KEY NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  markdown TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

四张核心表 + `comments` + 后续迁移加上 `read_count`、`username/avatar_*` 三列。**关键设计点：草稿和发布完全分开两张表**——前台只读 `post_published`，后台改 `post_drafts`，发布动作 = 把草稿快照写到 `post_published`。这就是为什么前台永远不会看到"半成品"。

应用迁移：

```bash
# 本地 dev
npx wrangler d1 migrations apply my-blog-db --local

# 生产
npx wrangler d1 migrations apply my-blog-db --remote
```

### 步骤 4：把 D1 接进代码（Drizzle）

定义 schema（本仓库 `src/db/schema.ts`）和获取实例的辅助函数：

```1:12:src/db/index.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  const binding = env.DB;
  if (!binding) {
    throw new Error("D1 binding DB is not configured");
  }
  return drizzle(binding, { schema });
}
```

> 这里有一个非常重要的概念：**在 Workers 里没有"全局连接池"**。每个请求都重新拿 binding、重新构造 Drizzle 实例。`drizzle(binding)` 本身非常便宜，不要担心。

### 步骤 5：写第一个页面（首页 + 列表 + 详情）

App Router 的 Server Component 直接 `await getDb()` 就行——这是 Next.js + Cloudflare 这套组合最爽的地方：

```5:9:src/app/page.tsx
export default async function Home() {
  const db = await getDb();
  const publishedPosts = await listPublishedPostCards(db);
  const latestPosts = publishedPosts.slice(0, 5);
  const featuredPost = latestPosts[0] ?? null;
```

详情页的核心：查询 + 渲染 Markdown + 增加阅读数 + 拉评论：

```22:42:src/app/writing/[slug]/page.tsx
export default async function WritingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const db = await getDb();

  const postRow = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!postRow) notFound();

  const published = await db
    .select()
    .from(postPublished)
    .where(eq(postPublished.postId, postRow.id))
    .get();

  if (!published) notFound();

  await incrementPublishedPostReadCount(db, postRow.id);

  const { html, toc } = await markdownToTrustedArticle(published.markdown);
  const displayedReadCount = getDisplayedReadCount(published.readCount);
  const commentCount = await getPostCommentCount(db, postRow.id);
  const engagementSummary = getArticleEngagementSummary(displayedReadCount, commentCount);
```

注意 `params` 是 **Promise**，需要 `await`——这是 Next.js 16 的新约定。

### 步骤 6：账号体系（注册 / 登录 / 会话）

我们用了最朴素的方案：

- **密码**：`bcryptjs`（不是 `bcrypt`，因为 Workers 不支持原生 N-API）
- **会话**：自己生成 UUID 写 D1 + HttpOnly Cookie，30 天过期

```1:7:src/lib/auth/password.ts
import bcrypt from "bcryptjs";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);

export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);
```

```7:17:src/lib/auth/session.ts
export const createSessionRecord = async (userId: string) => {
  const db = await getDb();
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt,
  });
  return { sessionId: id, expiresAt };
};
```

任何需要"当前登录用户"的地方就调一个 helper：

```6:10:src/lib/auth/guards.ts
export const getCurrentUser = async (): Promise<User | null> => {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  return findUserBySession(sid);
};
```

> **要不要换 NextAuth / Lucia？** 可以，但会增加心智负担。这种"自己写 50 行就够"的场景，反而最直观。

### 步骤 7：管理员后台（草稿 → 发布快照）

整个后台其实就是几张表的 CRUD + 一个发布动作：

- `POST /api/admin/posts` → 新建草稿
- `GET/PATCH/DELETE /api/admin/posts/[id]` → 单篇草稿读写删
- `POST /api/admin/posts/[id]/publish` → 把当前草稿快照写进 `post_published`

权限闸口很短，但卡得很死：

```12:18:src/lib/auth/guards.ts
export const requireSuperAdmin = async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return null;
  }
  return user;
};
```

每个 admin 路由的第一行都是它。注意 **`super_admin` 不能通过 API 创建**——必须人肉往 D1 里写一行（README 里有 SQL 模板）。

为什么这么设计？因为博客只有你一个作者，**反而不需要"角色提升"流程**。简化业务面 = 少一个攻击面。

### 步骤 8：Markdown 编辑器 + 图片上传到 R2

后台编辑器是一个客户端组件 (`src/components/forms/MarkdownEditor.tsx`)：

- 左 textarea + 右 marked 实时预览
- **粘贴图片**或**拖拽图片**会触发 `POST /api/admin/uploads/images`
- 服务端校验类型/大小，写到 R2，返回 `imageUrl` 和现成的 `![](url)` Markdown

服务端那一段非常短，它就是这套技术栈最像"魔法"的体现：

```32:48:src/app/api/admin/uploads/images/route.ts
  const { env } = await getCloudflareContext({ async: true });
  if (!env.AVATAR_R2) {
    return NextResponse.json({ error: "未配置图片存储桶" }, { status: 500 });
  }

  const now = new Date();
  const objectKey =
    `image/blog/${now.getUTCFullYear()}/` +
    `${String(now.getUTCMonth() + 1).padStart(2, "0")}/` +
    `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const bytes = await image.arrayBuffer();
  await env.AVATAR_R2.put(objectKey, bytes, {
    httpMetadata: {
      contentType: image.type,
    },
  });
```

**没有 SDK、没有签名、没有 multipart 解析库。** Workers 自带的 `formData()` + `env.AVATAR_R2.put()` 就完事。

要让用户能在浏览器里看到这张图，去 Cloudflare 控制台 → R2 → 你的桶 → "Public access" → 绑一个自定义域名，然后把这个域名写到 `wrangler.jsonc` 的 `NEXT_PUBLIC_AVATAR_BASE_URL`。

```jsonc
"r2_buckets": [
  { "binding": "AVATAR_R2", "bucket_name": "images" }
],
"vars": {
  "NEXT_PUBLIC_AVATAR_BASE_URL": "https://images.your-domain.com"
}
```

### 步骤 9：评论 + Turnstile 反刷

评论本身是一张极简的表，重点在于**两道前置闸口**：

1. 必须是已登录的 `user` 角色（游客不能评论）
2. 必须通过 Turnstile

Turnstile 校验逻辑：

```14:51:src/lib/turnstile.ts
export const verifyTurnstileToken = async (
  req: Request,
  token: string,
): Promise<TurnstileResult> => {
  if (!token.trim()) {
    return { ok: false, message: "请先完成安全验证", status: 400 };
  }

  const { env } = await getCloudflareContext({ async: true });
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, message: "服务端未配置风控密钥", status: 500 };
  }
```

接入它要做的事情其实只有 4 步：

1. Cloudflare 控制台 → Turnstile → 新建 site，拿到 `Site Key` 和 `Secret Key`
2. `wrangler secret put TURNSTILE_SECRET_KEY` 把 secret 注入（**绝对不要写进 `vars`**）
3. `wrangler.jsonc` 的 `vars` 里加 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. 表单组件里挂一个 `<TurnstileWidget />`（参考 `src/components/forms/TurnstileWidget.tsx`），把它生成的 token 一起 `POST` 到后端

> 为什么 site key 用 `vars`、secret key 用 `secret`？**因为 secret 必须只在 Worker 内部可读，不会被 typegen 也不会出现在前端 bundle。** 这是一个非常常见但容易写反的安全细节。

### 步骤 10：RSS / Sitemap

App Router 里两个 Route Handler 直接出 XML，几乎不用写库：

```14:45:src/app/rss.xml/route.ts
export async function GET() {
  const db = await getDb();
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      publishedAt: postPublished.publishedAt,
    })
    .from(posts)
    .innerJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(postPublished.publishedAt))
    .limit(50);
```

注意末尾我们还顺手加了一个 CDN 缓存头：

```52:57:src/app/rss.xml/route.ts
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
```

`s-maxage=300` 让 Cloudflare 边缘缓存 5 分钟，哪怕 RSS 阅读器每分钟拉一次，**绝大多数请求根本到不了你的 Worker。**

### 步骤 11：本地开发 + 部署上线

```bash
# 本地开发（带 D1 / R2 模拟器）
npm run d1:migrate:local      # 同步迁移到本地 SQLite
npm run dev                   # next dev

# 部署
npm run deploy:worker         # opennextjs build + wrangler deploy
```

**部署之前的 checklist**：

- [ ] D1 远程库已经 `migrations apply --remote`
- [ ] R2 桶已经创建并绑了公网域名
- [ ] `wrangler secret put TURNSTILE_SECRET_KEY` 已经执行
- [ ] `wrangler.jsonc` 里的 `NEXT_PUBLIC_SITE_URL` 改成你自己的线上域名（RSS / sitemap 会用它生成绝对链接）
- [ ] Cloudflare 控制台为 Worker 绑了一个自定义域名（推荐通过 "Workers Routes" 或 "Custom Domains"）

第一次部署成功后，记得**手动写入第一个 `super_admin`**（参考 README 的 `INSERT INTO users` 段），不然你连后台都进不去。

---

## 5. 复刻这套系统时常见的坑

按踩坑频率从高到低排：

1. **`params` / `cookies()` / `headers()` 全是 Promise**
   Next.js 16 的 App Router 在这些 API 上都改成了异步。忘记 `await` 不会有 TS 报错（因为类型本来就是 `Promise<...>`），但运行时会拿到一个 Promise 当成普通对象用。
2. **不要在 Workers 里用 `fs` / `path` / `crypto`（Node 版）**
   即使开了 `nodejs_compat`，也只是兼容一部分。优先用 Web 标准 API：`crypto.randomUUID()`、`crypto.subtle`、`fetch`、`FormData`。
3. **`getCloudflareContext()` 必须在请求生命周期内调用**
   不要在模块顶层 `await getCloudflareContext()`——那时候没有"请求"。所有用到 `env` 的地方都封装在函数里，请求触发时再调用。
4. **D1 是 SQLite，不是 Postgres**
   没有 `RETURNING *`（D1 已经支持但要看 compat date）、没有 `JSONB`、没有窗口函数的部分高级用法。设计 schema 时按 SQLite 的能力下界来。
5. **R2 公开访问要单独配域名**
   仅仅 `put()` 不会让别人能 `GET` 到。必须在 Cloudflare 控制台给桶配 Public bucket / 自定义域名。
6. **Secret 必须 `wrangler secret put`**
   写进 `wrangler.jsonc` 的 `vars` 会被 commit、会被 typegen、会泄漏。
7. **首次部署时 `compatibility_flags` 要包含 `nodejs_compat`**
   `bcryptjs`、`gray-matter` 等依赖会用到 `Buffer`。本仓库用了 `["nodejs_compat", "global_fetch_strictly_public"]`。
8. **Drizzle 在 D1 上用 `.get()` / `.all()`**
   不要用 `.execute()`，那是 Postgres 风格。

---

## 6. 这套架构的边界 / 它不适合做什么

诚实一点：

- **不适合长任务 / 大文件处理**：单个请求 CPU 时间有上限。要做视频转码？换 Workers + Queues + Container 或者干脆用别的 PaaS。
- **D1 不适合 OLAP**：查询 / 聚合一旦上千万行就别在 D1 里硬刚，搬到 R2 + DuckDB / ClickHouse。
- **没有"原生 cron"在每个 Worker 实例上跑**：定时任务要用 Cron Triggers（Workers 自带）+ 一个独立的 entry。
- **没有持久 WebSocket 状态**：要做聊天、协作编辑，请用 Durable Objects（Cloudflare 另一个产品）。

但对于"**博客 + 评论 + 后台**"这个场景，这套架构基本就是天花板了：写完即部署、按请求计费、出海速度全球均匀、几乎无运维。

---

## 7. 还可以往哪扩

如果你照着做完了一个 v1，下面这些是非常自然的下一步：

- **搜索**：用 `@cloudflare/d1-fts5`（SQLite FTS）做站内全文检索；或者上 Cloudflare Vectorize 做语义搜索。
- **图片优化**：把 R2 + Cloudflare Images 接起来，自动生成多尺寸 WebP/AVIF。
- **AI 摘要 / 推荐**：Workers AI 内置一堆模型，可以在发布快照时跑一次 summarization 写进 `post_published.summary`。
- **Webhook 通知**：发布时发个 Discord / Telegram 通知，10 行代码。
- **Analytics**：直接开 Cloudflare Web Analytics（无 Cookie，免费）。

---

## 8. 你只需要记住三件事

1. **Cloudflare 这套生态的核心抽象是 binding**——D1、R2、Vars、Secret、AI、Queue 全是一个 `env.XXX`。一旦你接受了这一点，所有的产品组合都是同一个心智模型。
2. **Next.js + OpenNext 是"框架兼容层"**——你写的还是普通 App Router，只是产物被翻译成了 Worker。
3. **草稿/发布快照分离 + super_admin 手动种子 + Turnstile 卡入口**——这三个业务约定让"博客后台"这个看似复杂的东西被压缩到了几百行代码。

剩下的，就是动手把上面 11 步走一遍。祝你也能用 Vibe Coding 的速度起一个属于自己的博客。
