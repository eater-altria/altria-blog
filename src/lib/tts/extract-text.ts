import { contentWithoutFrontmatter } from "@/lib/md-body";

/** Convert markdown to TTS-friendly plain text: strip frontmatter, code, images, formatting markers. */
export function markdownToTtsText(markdown: string): string {
  // Drop YAML frontmatter first — otherwise TTS reads "title: ... author: ..." aloud.
  let text = contentWithoutFrontmatter(markdown);

  // Drop fenced and inline code (unreadable when spoken).
  text = text.replace(/```[\s\S]*?```/g, "\n");
  text = text.replace(/`[^`\n]+`/g, "");

  // Drop images entirely; keep link text (humans will hear the visible label).
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Heading markers, list bullets, blockquote markers.
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^>\s?/gm, "");
  text = text.replace(/^[-*+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");

  // Emphasis markers (**bold**, *italic*, __bold__, _italic_).
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Horizontal rules.
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // Collapse 3+ newlines down to 2 (paragraph separator).
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/** Roughly count UTF-8 bytes — Doubao's text limit is in bytes, not chars. */
function utf8ByteLength(s: string): number {
  let bytes = 0;
  for (let i = 0; i < s.length; i += 1) {
    const code = s.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i += 1; // surrogate pair
    } else bytes += 3;
  }
  return bytes;
}

/** Split text into chunks under `maxBytes`, preferring sentence/paragraph boundaries. */
export function chunkForTts(text: string, maxBytes = 900): string[] {
  if (utf8ByteLength(text) <= maxBytes) return text ? [text] : [];

  // Split on paragraph blank-lines first, then sentence punctuation, then hard-break on length.
  const paragraphs = text.split(/\n{2,}/u).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];

  for (const para of paragraphs) {
    if (utf8ByteLength(para) <= maxBytes) {
      out.push(para);
      continue;
    }
    const sentences = para
      .split(/(?<=[。！？；…!?;])\s*|\n+/u)
      .map((s) => s.trim())
      .filter(Boolean);

    let buf = "";
    for (const s of sentences) {
      const candidate = buf ? `${buf}${s}` : s;
      if (utf8ByteLength(candidate) <= maxBytes) {
        buf = candidate;
        continue;
      }
      if (buf) out.push(buf);
      // A single sentence longer than maxBytes — hard split by chars.
      if (utf8ByteLength(s) > maxBytes) {
        let acc = "";
        for (const ch of s) {
          const next = acc + ch;
          if (utf8ByteLength(next) > maxBytes) {
            if (acc) out.push(acc);
            acc = ch;
          } else {
            acc = next;
          }
        }
        if (acc) {
          buf = acc;
        } else {
          buf = "";
        }
      } else {
        buf = s;
      }
    }
    if (buf) out.push(buf);
  }
  return out;
}

/** Produce a stable hex digest of arbitrary text, used as the cache fingerprint. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
