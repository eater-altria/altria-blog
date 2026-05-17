"use client";

import { escape } from "html-escaper";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CommentForm } from "@/components/forms/CommentForm";
import { buildCommentTree, type CommentTreeNode, type FlatComment } from "@/lib/comment-thread";

export type ArticleCommentSectionProps = {
  slug: string;
  siteKey?: string;
  userLoggedIn: boolean;
  /** 超级管理员可删除任意评论（含子回复，数据库级联删除）。 */
  canDeleteComments?: boolean;
  /** 最近 30 分钟内已通过 Turnstile 并成功评论，本设备同账号可不再弹验证。 */
  skipCommentTurnstile?: boolean;
  initialComments: FlatComment[];
};

type ReplyTarget = { id: string; username: string };

function CommentBranch({
  node,
  depth,
  userLoggedIn,
  canDeleteComments,
  parentLabel,
  onReply,
  deletingId,
  onDelete,
}: {
  node: CommentTreeNode;
  depth: number;
  userLoggedIn: boolean;
  canDeleteComments: boolean;
  parentLabel: string | null;
  onReply: (t: ReplyTarget) => void;
  deletingId: string | null;
  onDelete: (commentId: string) => void;
}) {
  const displayName = escape(node.username ?? "匿名用户");

  return (
    <li
      id={`comment-${node.id}`}
      className={
        depth > 0
          ? "mt-3 rounded-[1.2rem] border border-[var(--line-soft)] bg-[var(--surface-raised)] p-4 sm:ml-6 sm:border-l-2 sm:border-l-[var(--accent)]/35 sm:pl-5"
          : "rounded-[1.2rem] border border-[var(--surface-border)] bg-[var(--surface-raised)] p-5"
      }
    >
      {parentLabel ? (
        <p className="mb-2 text-xs text-[var(--muted)]">
          回复 <span className="font-medium text-[var(--accent)]">@{escape(parentLabel)}</span>
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--surface-strong)]">
          {node.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={node.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--muted-strong)]">无</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">{displayName}</p>
          <p className="text-xs text-[var(--muted-strong)]">{new Date(node.createdAt).toLocaleString("zh-CN")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {userLoggedIn ? (
            <button
              type="button"
              onClick={() =>
                onReply({ id: node.id, username: (node.username ?? "匿名用户").trim() || "匿名用户" })
              }
              className="rounded-full border border-[var(--line-strong)] bg-[var(--surface-raised-strong)] px-3 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
            >
              回复
            </button>
          ) : null}
          {canDeleteComments ? (
            <button
              type="button"
              disabled={deletingId === node.id}
              onClick={() => onDelete(node.id)}
              className="rounded-full border border-[var(--danger)]/35 bg-[var(--surface-raised-strong)] px-3 py-1 text-xs font-medium text-[var(--danger)] transition-colors hover:bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] disabled:opacity-50"
            >
              {deletingId === node.id ? "删除中…" : "删除"}
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">{escape(node.body)}</p>
      {node.children.length > 0 ? (
        <ul className="mt-2 list-none space-y-0 p-0">
          {node.children.map((child) => (
            <CommentBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              userLoggedIn={userLoggedIn}
              canDeleteComments={canDeleteComments}
              parentLabel={(node.username ?? "匿名用户").trim() || "匿名用户"}
              onReply={onReply}
              deletingId={deletingId}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ArticleCommentSection({
  slug,
  siteKey,
  userLoggedIn,
  canDeleteComments = false,
  skipCommentTurnstile = false,
  initialComments,
}: ArticleCommentSectionProps) {
  const router = useRouter();
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const tree = useMemo(() => buildCommentTree(initialComments), [initialComments]);

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("确定删除这条评论吗？若有回复，也会一并删除。")) {
      return;
    }
    setDeletingId(commentId);
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "删除失败");
        return;
      }
      if (replyTo?.id === commentId) setReplyTo(null);
      router.refresh();
    } catch {
      window.alert("请求失败，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {userLoggedIn ? (
        <div className="mt-6">
          <CommentForm
            slug={slug}
            siteKey={siteKey}
            skipCommentTurnstile={skipCommentTurnstile}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onPosted={() => setReplyTo(null)}
          />
        </div>
      ) : null}
      <ul className="mt-8 list-none space-y-4 p-0">
        {tree.length === 0 ? (
          <li className="text-sm text-[var(--muted)]">还没有评论，第一条留言会很显眼。</li>
        ) : (
          tree.map((node) => (
            <CommentBranch
              key={node.id}
              node={node}
              depth={0}
              userLoggedIn={userLoggedIn}
              canDeleteComments={canDeleteComments}
              parentLabel={null}
              onReply={setReplyTo}
              deletingId={deletingId}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </ul>
    </>
  );
}
