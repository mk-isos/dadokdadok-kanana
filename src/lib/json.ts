export function extractJsonObject(rawText: string): string {
  const trimmed = rawText.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error("응답에서 JSON 객체를 찾지 못했습니다.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

export function parseJsonFromText<T>(rawText: string): T {
  const candidate = extractJsonObject(rawText);

  try {
    return JSON.parse(candidate) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 파싱 오류";
    throw new Error(`JSON 파싱에 실패했습니다: ${message}`);
  }
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
