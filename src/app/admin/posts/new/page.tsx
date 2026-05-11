import Link from "next/link";
import { NewPostForm } from "@/components/forms/NewPostForm";

export default function AdminNewPostPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="cyber-link text-sm"
        >
          ← 返回后台首页
        </Link>
      </div>
      <div>
        <h1 className="cyber-title text-3xl font-semibold tracking-tight">上传 Markdown</h1>
        <p className="cyber-muted mt-2 text-sm">
          草稿在你点击<strong>发布</strong>前仅管理员可见，访客始终读取最新的已发布快照。
        </p>
      </div>
      <NewPostForm />
    </div>
  );
}
