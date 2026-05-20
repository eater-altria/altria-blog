/**
 * Doubao (火山引擎) V3 TTS HTTP Chunked client (new-console auth).
 *
 * Endpoint:   POST https://openspeech.bytedance.com/api/v3/tts/unidirectional
 * Auth:       X-Api-Key: <api-key>
 *             X-Api-Resource-Id: <resource-id, e.g. seed-tts-2.0>
 *             X-Api-Request-Id: <uuid>   (optional, useful for tracing)
 *
 * Request body (JSON):
 *   {
 *     "user": { "uid": "..." },
 *     "req_params": {
 *       "text": "...",
 *       "speaker": "zh_female_..._bigtts",
 *       "audio_params": { "format": "mp3", "sample_rate": 24000 }
 *     }
 *   }
 *
 * Response: HTTP chunked stream of newline-delimited JSON objects.
 *   - {"code":0,"message":"","data":"<base64 mp3 chunk>"}     audio frame
 *   - {"code":0,"message":"","data":null,"sentence":{...}}    subtitle frame (ignored)
 *   - {"code":20000000,"message":"ok","data":null,"usage":..} end frame
 *   - {"code":<other>,"message":"..."}                         error frame
 *
 * V3 supports one-shot full-text input. We still chunk very long articles upstream
 * (`chunkForTts`) as a safety net for the implicit per-request text length cap
 * (error 40402003 TTSExceededTextLimit).
 */

const ENDPOINT = "https://openspeech.bytedance.com/api/v3/tts/unidirectional";

export type DoubaoConfig = {
  apiKey: string;
  resourceId: string;
  voice: string;
};

export function readDoubaoConfig(env: CloudflareEnv): DoubaoConfig | null {
  const enabled = (env.DOUBAO_TTS_ENABLED ?? "").toLowerCase();
  if (enabled !== "true" && enabled !== "1") return null;

  const apiKey = env.DOUBAO_TTS_API_KEY?.trim();
  const resourceId = env.DOUBAO_TTS_RESOURCE_ID?.trim() || "seed-tts-2.0";
  const voice = env.DOUBAO_TTS_VOICE?.trim() || "zh_female_shuangkuaisisi_moon_bigtts";

  if (!apiKey) return null;
  return { apiKey, resourceId, voice };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** Iterate JSON objects from a newline-delimited stream. Tolerates the rare case where
 *  multiple objects share a line (split on `}{` boundary) or one object spans lines
 *  (buffer until `JSON.parse` succeeds). */
function* iterJsonObjects(buffer: string): Generator<unknown> {
  const lines = buffer.split(/\r?\n/);
  let pending = "";
  for (const line of lines) {
    if (!line.trim()) continue;
    pending = pending ? pending + line : line;
    // Greedy: try parsing the whole buffer first.
    try {
      yield JSON.parse(pending);
      pending = "";
      continue;
    } catch {
      /* keep buffering */
    }
  }
  if (pending.trim()) {
    // Last-ditch: try once more.
    try {
      yield JSON.parse(pending);
    } catch {
      /* drop a trailing incomplete frame */
    }
  }
}

export type DoubaoSynthesisError = {
  ok: false;
  status: number;
  code?: number;
  message: string;
};

export type DoubaoSynthesisOk = {
  ok: true;
  mp3: Uint8Array;
};

type V3Frame = {
  code?: number;
  message?: string;
  data?: string | null;
  sentence?: unknown;
  usage?: unknown;
};

/** Synthesize one text chunk via V3 HTTP Chunked endpoint. */
export async function synthesizeChunk(
  cfg: DoubaoConfig,
  text: string,
): Promise<DoubaoSynthesisOk | DoubaoSynthesisError> {
  const body = {
    user: { uid: "blog-reader" },
    req_params: {
      text,
      speaker: cfg.voice,
      audio_params: {
        format: "mp3",
        sample_rate: 24000,
      },
    },
  };

  let resp: Response;
  try {
    resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "X-Api-Key": cfg.apiKey,
        "X-Api-Resource-Id": cfg.resourceId,
        "X-Api-Request-Id": crypto.randomUUID(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, status: 502, message: `豆包 TTS 请求失败：${(e as Error).message}` };
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return {
      ok: false,
      status: resp.status,
      message: `豆包 TTS HTTP ${resp.status}：${txt.slice(0, 200)}`,
    };
  }

  const rawBody = await resp.text();
  const audioParts: Uint8Array[] = [];
  let sawEndFrame = false;
  let lastError: { code: number; message: string } | null = null;

  for (const obj of iterJsonObjects(rawBody)) {
    const frame = obj as V3Frame;
    const code = frame.code;
    if (typeof code !== "number") continue;

    // 0 = streaming/intermediate frame; 20000000 = ok terminal frame.
    if (code === 0) {
      if (typeof frame.data === "string" && frame.data.length > 0) {
        audioParts.push(base64ToBytes(frame.data));
      }
      continue;
    }
    if (code === 20000000) {
      sawEndFrame = true;
      continue;
    }
    lastError = { code, message: frame.message ?? `豆包错误码 ${code}` };
    break;
  }

  if (lastError) {
    return {
      ok: false,
      status: 502,
      code: lastError.code,
      message: `豆包 TTS 业务错误 ${lastError.code}：${lastError.message}`,
    };
  }

  if (audioParts.length === 0) {
    return {
      ok: false,
      status: 502,
      message: sawEndFrame
        ? "豆包返回 ok 但没有音频数据"
        : "豆包响应未包含可识别的音频帧",
    };
  }

  const total = audioParts.reduce((n, p) => n + p.length, 0);
  const mp3 = new Uint8Array(total);
  let offset = 0;
  for (const p of audioParts) {
    mp3.set(p, offset);
    offset += p.length;
  }
  return { ok: true, mp3 };
}

/** Kick off all chunks in parallel and stream MP3 bytes to the client in chunk order.
 *
 *  Returns:
 *    - `stream`: ReadableStream<Uint8Array> for the Response body. Emits chunk-1 bytes as
 *       soon as Doubao returns chunk-1, even while chunks 2..N are still synthesizing.
 *    - `whenComplete`: resolves after all chunks finish (or one fails). The route handler
 *       hands this to ctx.waitUntil so the R2 cache write survives past the response.
 *
 *  All chunks run in parallel — Cloudflare Workers allows up to 50 subrequests per request,
 *  and typical articles produce <10 chunks, so no explicit concurrency cap is needed.
 */
export function streamSynthesizedChunks(
  cfg: DoubaoConfig,
  chunks: string[],
): {
  stream: ReadableStream<Uint8Array>;
  whenComplete: Promise<DoubaoSynthesisOk | DoubaoSynthesisError>;
} {
  type ChunkResult = DoubaoSynthesisOk | DoubaoSynthesisError;
  const pending: Promise<ChunkResult>[] = chunks.map((chunk) =>
    synthesizeChunk(cfg, chunk),
  );

  let resolveComplete!: (r: ChunkResult) => void;
  const whenComplete = new Promise<ChunkResult>((res) => {
    resolveComplete = res;
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const parts: Uint8Array[] = [];
      try {
        // Await in chunk order so the byte stream is reconstructible into a valid MP3.
        for (let i = 0; i < pending.length; i += 1) {
          const r = await pending[i];
          if (!r.ok) {
            controller.error(new Error(r.message));
            resolveComplete(r);
            return;
          }
          parts.push(r.mp3);
          controller.enqueue(r.mp3);
        }
        controller.close();

        const total = parts.reduce((n, p) => n + p.length, 0);
        const mp3 = new Uint8Array(total);
        let offset = 0;
        for (const p of parts) {
          mp3.set(p, offset);
          offset += p.length;
        }
        resolveComplete({ ok: true, mp3 });
      } catch (e) {
        const err: DoubaoSynthesisError = {
          ok: false,
          status: 500,
          message: (e as Error).message,
        };
        controller.error(e);
        resolveComplete(err);
      }
    },
  });

  return { stream, whenComplete };
}
