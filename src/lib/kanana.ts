import {
  ConversationTurnInput,
  ConversationTurnResponse,
  LevelAdaptation,
  LevelAdaptationInput,
  ParentReportInput,
  ParentReportResult,
  StoryAnalysisInput,
  StoryAnalysisResult,
  TtsInput,
  TtsResult,
} from "@/lib/types";

async function callKanana<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/kanana", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: (T & { message?: string; detail?: string }) | null = null;

  try {
    data = raw ? (JSON.parse(raw) as T & { message?: string; detail?: string }) : ({} as T & { message?: string; detail?: string });
  } catch {
    if (!response.ok) {
      throw new Error(raw || `Kanana API 호출에 실패했습니다. (HTTP ${response.status})`);
    }
    throw new Error("서버 응답 형식을 해석하지 못했습니다.");
  }

  if (!response.ok) {
    throw new Error(data?.message ?? data?.detail ?? `Kanana API 호출에 실패했습니다. (HTTP ${response.status})`);
  }

  return data as T;
}

export function analyzeStory(input: StoryAnalysisInput) {
  return callKanana<StoryAnalysisResult>({ action: "analyze_story", ...input });
}

export function adaptLevelText(input: LevelAdaptationInput) {
  return callKanana<LevelAdaptation>({ action: "adapt_level_text", ...input });
}

export function requestConversationTurn(input: ConversationTurnInput) {
  return callKanana<ConversationTurnResponse>({ action: "conversation_turn", ...input });
}

export function requestParentReport(input: ParentReportInput) {
  return callKanana<ParentReportResult>({ action: "parent_report", ...input });
}

export function requestTts(input: TtsInput) {
  return callKanana<TtsResult>({ action: "tts", ...input });
}
