"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor/nohighlight"), {
  ssr: false,
  loading: () => (
    <div className="surface-card flex min-h-[420px] items-center justify-center text-sm text-[var(--muted)]">
      编辑器加载中...
    </div>
  ),
});

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

type UploadedImageMarkdown = {
  imageUrl: string;
  markdown: string;
  previewUrl: string;
};

type MarkdownPreviewImageProps = ComponentPropsWithoutRef<"img"> & {
  node?: unknown;
  previewUrls: Record<string, string>;
};

function MarkdownPreviewImage({
  alt = "",
  node,
  previewUrls,
  src,
  ...props
}: MarkdownPreviewImageProps) {
  void node;
  const resolvedSrc = typeof src === "string" ? previewUrls[src] ?? src : src;

  // next/image is not a fit here: markdown previews need to render arbitrary and blob URLs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} src={resolvedSrc} />;
}

let mermaidIdCounter = 0;

function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (cancelled) return;
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        const id = `mermaid-editor-${++mermaidIdCounter}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          el.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Mermaid render error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="mermaid-error rounded-lg border border-[var(--danger)] bg-red-50 p-3 text-xs text-[var(--danger)]">
        <code>{code}</code>
      </pre>
    );
  }

  return <div ref={containerRef} className="mermaid-container" />;
}

function deriveImageAlt(fileName: string): string {
  const raw = fileName.replace(/\.[^.]+$/, "").trim();
  return raw || "image";
}

function buildImageMarkdown(url: string, fileName: string): string {
  return `![${deriveImageAlt(fileName)}](${url})`;
}

function getEditorHeight(minHeightClassName: string): number {
  const matched = minHeightClassName.match(/min-h-\[(\d+)px\]/);
  return matched ? Number(matched[1]) : 420;
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Record<string, string>>({});
  const imagePreviewUrlsRef = useRef<Record<string, string>>({});
  const inputId = useId();

  useEffect(() => {
    return () => {
      Object.values(imagePreviewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const uploadImageFile = useCallback(async (file: File): Promise<UploadedImageMarkdown> => {
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

    return {
      imageUrl: data.imageUrl,
      markdown: buildImageMarkdown(data.imageUrl, file.name),
      previewUrl: URL.createObjectURL(file),
    };
  }, []);

  const handleImageInsertion = useCallback(
    async (textarea: HTMLTextAreaElement, file: File) => {
      setUploading(true);
      setUploadError(null);

      try {
        const uploaded = await uploadImageFile(file);
        const blockPrefix = value && !value.endsWith("\n") ? "\n\n" : value ? "\n" : "";
        setImagePreviewUrls((current) => {
          const previousPreviewUrl = current[uploaded.imageUrl];
          if (previousPreviewUrl) {
            URL.revokeObjectURL(previousPreviewUrl);
          }

          const next = {
            ...current,
            [uploaded.imageUrl]: uploaded.previewUrl,
          };
          imagePreviewUrlsRef.current = next;
          return next;
        });
        insertAtSelection(textarea, value, `${blockPrefix}${uploaded.markdown}\n`, onChange);
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
      await handleImageInsertion(event.currentTarget, imageFile);
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
      await handleImageInsertion(event.currentTarget, imageFile);
    },
    [handleImageInsertion],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label id={inputId} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
        <span className="text-xs text-[var(--muted)]">
          {uploading ? "图片上传中..." : "支持粘贴图片上传"}
        </span>
      </div>

      <div
        className={`blog-md-editor ${disabled || uploading ? "pointer-events-none opacity-70" : ""}`}
        data-color-mode="light"
      >
        <MDEditor
          value={value}
          onChange={(nextValue) => onChange(nextValue ?? "")}
          height={getEditorHeight(minHeightClassName)}
          preview="live"
          visibleDragbar={false}
          previewOptions={{
            components: {
              img: (props: ComponentPropsWithoutRef<"img">) => (
                <MarkdownPreviewImage {...props} previewUrls={imagePreviewUrls} />
              ),
              code: (props: ComponentPropsWithoutRef<"code"> & { node?: unknown }) => {
                const { children, className, node, ...rest } = props;
                void node;
                if (className === "language-mermaid") {
                  return <MermaidBlock code={String(children).replace(/\n$/, "")} />;
                }
                return <code className={className} {...rest}>{children}</code>;
              },
            },
          }}
          textareaProps={{
            ...textareaProps,
            "aria-labelledby": inputId,
            placeholder,
            disabled: disabled || uploading,
            spellCheck: false,
            onPaste: handlePaste,
            onDrop: handleDrop,
            onDragOver: (event) => event.preventDefault(),
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <p>可直接粘贴截图或拖拽图片，系统会自动上传并插入 Markdown 图片链接。</p>
        {uploadError ? <p className="text-[var(--danger)]">{uploadError}</p> : null}
      </div>
      {footer}
    </div>
  );
}
