import { NextResponse } from "next/server";

import { parseJsonFromText } from "@/lib/json";
import {
  buildConversationTurnPrompt,
  buildLevelAdaptationPrompt,
  buildParentReportPrompt,
  buildStoryAnalysisPrompt,
  buildTtsPrompt,
  TRANSCRIBE_PROMPT,
} from "@/lib/prompt";
import {
  ConversationTurnInput,
  ConversationTurnResponse,
  ConversationTurnResult,
  KananaAction,
  LevelAdaptation,
  LevelAdaptationInput,
  ParentReportInput,
  ParentReportResult,
  StoryAnalysisInput,
  StoryAnalysisResult,
  TtsInput,
  TtsResult,
} from "@/lib/types";

export const runtime = "nodejs";

const KANANA_BASE_URL = "https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1";
const CHAT_COMPLETIONS_URL = `${KANANA_BASE_URL}/chat/completions`;
const MODEL = "kanana-o";

function createHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

function normalizeAudioFormat(format: string | undefined): string {
  if (!format) return "wav";
  const lower = format.toLowerCase();
  if (lower.includes("wav")) return "wav";
  if (lower.includes("mp3") || lower.includes("mpeg")) return "mp3";
  if (lower.includes("ogg")) return "ogg";
  if (lower.includes("webm")) return "webm";
  return "wav";
}

function normalizeBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function getMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const texts = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";

        const maybeItem = item as { text?: unknown; output_text?: unknown };
        if (typeof maybeItem.text === "string") return maybeItem.text;
        if (typeof maybeItem.output_text === "string") return maybeItem.output_text;
        return "";
      })
      .filter(Boolean);

    return texts.join(" ").trim();
  }

  return "";
}

async function callKananaTextCompletion(
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: createHeaders(apiKey),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Kanana API 오류 (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const text = getMessageText(data.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error("Kanana 응답에서 텍스트를 찾지 못했습니다.");
  }

  return text;
}

function createWavBufferFromPcm16Mono(pcm: Buffer, sampleRate = 24000): Buffer {
  // TODO: 문서 예시는 24kHz/mono/16bit PCM WAV 변환을 제시한다. 추후 공식 응답 스펙 확정 시 sampleRate/채널 자동 판별 로직으로 교체.
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

function extractTextFromDeltaContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const maybeItem = item as { text?: unknown; output_text?: unknown };
        if (typeof maybeItem.text === "string") return maybeItem.text;
        if (typeof maybeItem.output_text === "string") return maybeItem.output_text;
        return "";
      })
      .join("");
  }

  return "";
}

function extractAudioBase64FromDelta(delta: Record<string, unknown>): string {
  const audio = delta.audio;
  if (typeof audio === "string") return audio;

  if (audio && typeof audio === "object") {
    const maybe = audio as { data?: unknown; audio?: unknown };
    if (typeof maybe.data === "string") return maybe.data;
    if (typeof maybe.audio === "string") return maybe.audio;
  }

  return "";
}

async function callKananaTts(apiKey: string, payload: Record<string, unknown>): Promise<TtsResult> {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: createHeaders(apiKey),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Kanana TTS 오류 (${response.status}): ${detail}`);
  }

  if (!response.body) {
    throw new Error("Kanana TTS 스트림 응답 본문이 비어 있습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let rawBuffer = "";
  let collectedText = "";
  const pcmChunks: Buffer[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    rawBuffer += decoder.decode(value, { stream: true });
    const lines = rawBuffer.split("\n");
    rawBuffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const chunk = trimmed.slice(5).trim();
      if (!chunk || chunk === "[DONE]") continue;

      try {
        const event = JSON.parse(chunk) as {
          choices?: Array<{ delta?: Record<string, unknown> }>;
        };

        const delta = event.choices?.[0]?.delta ?? {};
        const textDelta = extractTextFromDeltaContent(delta.content);
        if (textDelta) collectedText += textDelta;

        const audioBase64 = extractAudioBase64FromDelta(delta);
        if (audioBase64) pcmChunks.push(Buffer.from(audioBase64, "base64"));
      } catch {
        // SSE 파편 라인 무시
      }
    }
  }

  const mergedPcm = Buffer.concat(pcmChunks);
  const audioDataUrl =
    mergedPcm.length > 0
      ? `data:audio/wav;base64,${createWavBufferFromPcm16Mono(mergedPcm).toString("base64")}`
      : null;

  return {
    text: collectedText.trim(),
    audioDataUrl,
  };
}

async function transcribeAudioWithKanana(
  apiKey: string,
  audioBase64: string,
  audioFormat: string,
): Promise<string> {
  return callKananaTextCompletion(apiKey, {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          // TODO: 공식 예시는 wav 중심이다. webm/ogg 포맷 호환성은 추후 공식 가이드에 맞춰 보완 필요.
          { type: "input_audio", input_audio: { data: audioBase64, format: normalizeAudioFormat(audioFormat) } },
          { type: "text", text: TRANSCRIBE_PROMPT },
        ],
      },
    ],
    modalities: ["text"],
  });
}

async function handleAnalyzeStory(input: StoryAnalysisInput): Promise<StoryAnalysisResult> {
  const prompt = buildStoryAnalysisPrompt(input);

  const responseText = await callKananaTextCompletion(input.apiKey, {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          // TODO: 문서 예시는 image_url.url에 raw base64를 넣는다. data URL 접두어 필요 여부는 후속 문서 업데이트 시 재검증 필요.
          { type: "image_url", image_url: { url: input.imageBase64 } },
          { type: "text", text: prompt },
        ],
      },
    ],
    modalities: ["text"],
  });

  return parseJsonFromText<StoryAnalysisResult>(responseText);
}

async function handleLevelAdaptation(input: LevelAdaptationInput): Promise<LevelAdaptation> {
  const prompt = buildLevelAdaptationPrompt(input);

  const responseText = await callKananaTextCompletion(input.apiKey, {
    model: MODEL,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    modalities: ["text"],
  });

  const parsed = parseJsonFromText<LevelAdaptation>(responseText);

  return {
    level: parsed.level || input.readingLevel,
    title: parsed.title?.trim() || "수준별 재구성",
    description: parsed.description?.trim() || "아이 수준에 맞춰 다시 정리한 문장입니다.",
    adaptedText: parsed.adaptedText?.trim() || input.extractedText,
  };
}

async function handleConversationTurn(input: ConversationTurnInput): Promise<ConversationTurnResponse> {
  let transcriptFromAudio = "";
  let usedAudioInput = false;
  let usedTextFallback = false;

  if (input.audioBase64) {
    try {
      transcriptFromAudio = await transcribeAudioWithKanana(
        input.apiKey,
        input.audioBase64,
        input.audioFormat || "wav",
      );
      usedAudioInput = true;
    } catch {
      usedTextFallback = true;
    }
  }

  const mergedAnswer = [input.childAnswerText.trim(), transcriptFromAudio.trim()]
    .filter(Boolean)
    .join("\n");

  const prompt = buildConversationTurnPrompt({
    ...input,
    childAnswerText: mergedAnswer,
  });

  const responseText = await callKananaTextCompletion(input.apiKey, {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
    modalities: ["text"],
  });

  const parsed = parseJsonFromText<ConversationTurnResult>(responseText);

  return {
    result: {
      feedbackForChild: parsed.feedbackForChild?.trim() || "좋은 생각이야. 같이 한 번 더 생각해 보자.",
      nextQuestion: parsed.nextQuestion?.trim() || "너는 이 장면에서 어떤 마음이 들었니?",
      parentObservation: parsed.parentObservation?.trim() || "아이가 자신의 말로 감정을 표현하려고 시도했습니다.",
      shouldContinue: normalizeBoolean(parsed.shouldContinue, true),
    },
    transcriptFromAudio: transcriptFromAudio || undefined,
    usedAudioInput,
    usedTextFallback,
  };
}

async function handleParentReport(input: ParentReportInput): Promise<ParentReportResult> {
  const prompt = buildParentReportPrompt(input);

  const responseText = await callKananaTextCompletion(input.apiKey, {
    model: MODEL,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    modalities: ["text"],
  });

  return parseJsonFromText<ParentReportResult>(responseText);
}

async function handleTts(input: TtsInput): Promise<TtsResult> {
  const ttsPrompt = buildTtsPrompt(input.text);

  // TODO: Kanana TTS의 비스트리밍 응답 포맷은 문서가 제한적이라, 현재는 streaming SSE 파싱을 사용.
  return callKananaTts(input.apiKey, {
    model: MODEL,
    messages: [{ role: "user", content: [{ type: "text", text: ttsPrompt }] }],
    modalities: ["text", "audio"],
    extra_body: { latency_first: true },
    audio: { voice: "preset_spk_1" },
    stream: true,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: KananaAction; apiKey?: string } & Record<
      string,
      unknown
    >;

    if (!body.apiKey || typeof body.apiKey !== "string") {
      return NextResponse.json({ message: "Kanana API Key가 필요합니다." }, { status: 400 });
    }

    if (!body.action) {
      return NextResponse.json({ message: "action 파라미터가 필요합니다." }, { status: 400 });
    }

    switch (body.action) {
      case "analyze_story":
        return NextResponse.json(await handleAnalyzeStory(body as unknown as StoryAnalysisInput));
      case "adapt_level_text":
        return NextResponse.json(await handleLevelAdaptation(body as unknown as LevelAdaptationInput));
      case "conversation_turn":
        return NextResponse.json(await handleConversationTurn(body as unknown as ConversationTurnInput));
      case "parent_report":
        return NextResponse.json(await handleParentReport(body as unknown as ParentReportInput));
      case "tts":
        return NextResponse.json(await handleTts(body as unknown as TtsInput));
      default:
        return NextResponse.json({ message: "지원하지 않는 action 입니다." }, { status: 400 });
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ message: "Kanana 처리 중 오류가 발생했습니다.", detail }, { status: 500 });
  }
}
