"use client";

import { marked } from "marked";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  minHeightClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  footer?: ReactNode;
} & Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, "aria-label" | "required">;

type UploadResult = {
  ok: true;
  imageUrl: string;
  objectKey: string;
  markdown: string;
};

const toolbarActions = [
  {
    label: "H2",
    run: (selected: string) => `## ${selected || "二级标题"}`,
  },
  {
    label: "B",
    run: (selected: string) => `**${selected || "加粗文本"}**`,
  },
  {
    label: "Quote",
    run: (selected: string) => `> ${selected || "引用内容"}`,
  },
  {
    label: "Code",
    run: (selected: string) => `\`\`\`\n${selected || "code"}\n\`\`\``,
  },
  {
    label: "Link",
    run: (selected: string) => `[${selected || "链接标题"}](https://example.com)`,
  },
] as const;

function deriveImageAlt(fileName: string): string {
  const raw = fileName.replace(/\.[^.]+$/, "").trim();
  return raw || "image";
}

function buildImageMarkdown(url: string, fileName: string): string {
  return `![${deriveImageAlt(fileName)}](${url})`;
}

function insertAtSelection(
  textarea: HTMLTextAreaElement,
  currentValue: string,
  insertedText: string,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;
  const nextValue = `${currentValue.slice(0, start)}${insertedText}${currentValue.slice(end)}`;
  onChange(nextValue);

  requestAnimationFrame(() => {
    const cursor = start + insertedText.length;
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });
}

export function MarkdownEditor({
  value,
  onChange,
  label,
  minHeightClassName = "min-h-[420px]",
  placeholder,
  disabled = false,
  footer,
  ...textareaProps
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputId = useId();

  const previewHtml = useMemo(
    () => marked.parse(value || "_预览区域会跟随 Markdown 内容实时更新。_"),
    [value],
  );

  const uploadImageFile = useCallback(
    async (file: File) => {
      const fd = new FormData();
      fd.set("image", file);

      const res = await fetch("/api/admin/uploads/images", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = (await res.json().catch(() => ({}))) as Partial<UploadResult> & {
        error?: string;
      };

      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error ?? "图片上传失败");
      }

      return buildImageMarkdown(data.imageUrl, file.name);
    },
    [],
  );

  const handleImageInsertion = useCallback(
    async (file: File) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      setUploading(true);
      setUploadError(null);

      try {
        const markdown = await uploadImageFile(file);
        const blockPrefix =
          value && !value.endsWith("\n") ? "\n\n" : value ? "\n" : "";
        insertAtSelection(textarea, value, `${blockPrefix}${markdown}\n`, onChange);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "图片上传失败");
      } finally {
        setUploading(false);
      }
    },
    [onChange, uploadImageFile, value],
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const imageFile = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile();

      if (!imageFile) return;

      event.preventDefault();
      await handleImageInsertion(imageFile);
    },
    [handleImageInsertion],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLTextAreaElement>) => {
      const imageFile = Array.from(event.dataTransfer?.files ?? []).find((file) =>
        file.type.startsWith("image/"),
      );

      if (!imageFile) return;

      event.preventDefault();
      await handleImageInsertion(imageFile);
    },
    [handleImageInsertion],
  );

  const handleToolbarInsert = useCallback(
    (builder: (selected: string) => string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selection = value.slice(textarea.selectionStart ?? 0, textarea.selectionEnd ?? 0);
      insertAtSelection(textarea, value, builder(selection), onChange);
    },
    [onChange, value],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="rounded-full border border-[var(--surface-border)] bg-white/70 px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
              onClick={() => handleToolbarInsert(action.run)}
              disabled={disabled || uploading}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-white/45 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
            <span>Editor</span>
            <span>{uploading ? "图片上传中..." : "支持粘贴图片上传"}</span>
          </div>
          <textarea
            {...textareaProps}
            id={inputId}
            ref={textareaRef}
            className={`cyber-input w-full rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-7 shadow-none focus:shadow-none ${minHeightClassName}`}
            value={value}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            placeholder={placeholder}
            disabled={disabled}
            spellCheck={false}
          />
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-[var(--line-soft)] bg-white/45 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
            Preview
          </div>
          <div
            className="article-prose min-h-[420px] max-w-none p-5 text-sm leading-7 [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--line-strong)] [&_blockquote]:pl-4 [&_code]:rounded-md [&_code]:bg-[rgba(31,106,93,0.08)] [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-[var(--surface-border)] [&_pre]:bg-[#1b2331] [&_pre]:p-4 [&_pre]:text-[#f8fafc]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <p>可直接粘贴截图或拖拽图片，系统会自动上传并插入 Markdown 图片链接。</p>
        {uploadError ? <p className="cyber-danger">{uploadError}</p> : null}
      </div>
      {footer}
    </div>
  );
}
