# Kanana API 호출 흐름

## 1. 전체 호출 흐름
다독다독의 기본 API 흐름은 아래 순서로 동작합니다.

1. 사용자 버튼 클릭
2. `src/app/page.tsx` 핸들러 실행
3. `src/lib/kanana.ts` 호출 함수 실행
4. Next API Route(`src/app/api/kanana/route.ts`)로 요청 전달
5. Kanana 외부 API(`chat/completions`) 호출
6. 응답 텍스트/오디오 파싱
7. state 저장 (`analysis`, `levelAdaptation`, `conversation`, `report`)
8. Step UI에 즉시 반영

## 2. API Action별 설명

### analyze_story
- 사용 시점
  - Step 2에서 `이야기 살펴보기` 클릭
- 클라이언트 진입 함수
  - `analyzeCurrentStory()` in `src/app/page.tsx`
- 호출 함수
  - `analyzeStory()` in `src/lib/kanana.ts`
- API Route 처리
  - `handleAnalyzeStory()` in `src/app/api/kanana/route.ts`
- 입력 데이터
  - `apiKey`, `imageBase64`, `childLevel`, `ocrCorrectionText`, `sceneCorrectionText`
- 출력 데이터
  - `StoryAnalysisResult` (`extractedText`, `easyText`, `emotion`, `childQuestion` ...)
- state 저장
  - `analysis`
- 화면 반영
  - Step 2/3/4의 기본 텍스트/감정/첫 질문에 반영

### adapt_level_text
- 사용 시점
  - Step 2에서 읽기 수준 선택 후 `아이에게 맞게 바꾸기` 클릭
- 클라이언트 진입 함수
  - `handleAdaptReadingLevel()` in `src/app/page.tsx`
- 호출 함수
  - `adaptLevelText()` in `src/lib/kanana.ts`
- API Route 처리
  - `handleLevelAdaptation()`
- 입력 데이터
  - `apiKey`, `extractedText`, `storyTitle`, `storyDescription`, `readingLevel`
- 출력 데이터
  - `LevelAdaptation` (`level`, `title`, `description`, `adaptedText`)
- state 저장
  - `levelAdaptation`
- 화면 반영
  - Step 2 변환 카드, `selectedLevelText` 적용 시 Step 3/4 문장 기준 변경

### conversation_turn
- 사용 시점
  - Step 4에서 `답변 보내기` 클릭
- 클라이언트 진입 함수
  - `handleSendAnswer()`
- 호출 함수
  - `requestConversationTurn()`
- API Route 처리
  - `handleConversationTurn()`
- 입력 데이터
  - `apiKey`, `childLevel`, `selectedReadingLevel`, `selectedLevelText`, `analysis`, `conversationMessages`, `currentQuestion`, `childAnswerText`, `turnCount`, `audioBase64`, `audioFormat`
- 출력 데이터
  - `ConversationTurnResponse`
  - 내부 `result`: `feedbackForChild`, `nextQuestion`, `parentObservation`, `shouldContinue`
- state 저장
  - `conversation`, `lastFeedbackText`, `parentObservations`, `draftAnswerText`
- 화면 반영
  - Step 4 말풍선 대화, 현재 질문, 턴 진행 상태

### parent_report
- 사용 시점
  - Step 5에서 `오늘 이야기 정리하기` 클릭
- 클라이언트 진입 함수
  - `generateReport()`
- 호출 함수
  - `requestParentReport()`
- API Route 처리
  - `handleParentReport()`
- 입력 데이터
  - `apiKey`, `storyTitle`, `selectedReadingLevel`, `selectedLevelText`, `analysis`, `conversationMessages`, `parentObservations`
- 출력 데이터
  - `ParentReportResult`
- state 저장
  - `report`
- 화면 반영
  - Step 5 리포트 카드(요약/강점/다음 질문/주의 문구)

### tts
- 사용 시점
  - Step 3/4에서 읽어주기 버튼 클릭
- 클라이언트 진입 함수
  - `speakWithFallback()`
- 호출 함수
  - `requestTts()`
- API Route 처리
  - `handleTts()` + `callKananaTts()` (SSE 스트림 파싱)
- 입력 데이터
  - `apiKey`, `text`
- 출력 데이터
  - `TtsResult` (`text`, `audioDataUrl`)
- fallback 방식
  - TTS 실패/빈 오디오 시 `useSpeechSynthesis` 브라우저 음성으로 즉시 전환

## 3. Prompt 구조
`src/lib/prompt.ts`에는 action별 템플릿이 분리되어 있습니다.

- `buildStoryAnalysisPrompt`
  - 이미지 기반 OCR + 장면/감정/질문 생성
  - 아동 수준 가이드 + 안전 규칙 포함

- `buildLevelAdaptationPrompt`
  - 기초/표준/심화 기준으로 원문 의미를 유지하며 재구성

- `buildConversationTurnPrompt`
  - 멀티턴 대화 컨텍스트 포함
  - 피드백 1~2문장, 질문 1문장, 반복 방지 규칙 포함

- `buildParentReportPrompt`
  - 대화 이력 기반 보호자 리포트 생성
  - 진단/치료/평가/점수화 금지 규칙 포함

- `buildTtsPrompt`
  - 한국어로 다정하고 또박또박 읽는 톤 지시

## 4. JSON 파싱과 안정성

- JSON only를 강제하는 이유
  - LLM 응답은 설명 문장이 섞일 수 있어, 클라이언트 타입 안전성이 떨어질 수 있음
  - 필드 단위 상태 업데이트를 위해 구조화 응답이 필요함

- `json.ts`의 역할
  - `extractJsonObject()`: 텍스트 중 JSON 객체 구간 추출
  - `parseJsonFromText()`: 안전 파싱 및 에러 메시지 표준화

- 파싱 실패 시 처리
  - 각 단계에서 `try/catch`로 감싸고 사용자 친화 메시지 표시
  - 동시에 fallback 데이터로 화면 흐름 유지

## 5. fallback 전략

- Kanana 실패 시 `sampleStory` fallback
  - `analysis`가 없으면 `activeStoryAnalysis`가 fallbackData 사용

- TTS 실패 시 브라우저 음성 fallback
  - `requestTts` 실패 또는 `audioDataUrl` 없음 → `useSpeechSynthesis` 실행

- STT 실패 시 텍스트 입력 fallback
  - `useSpeechRecognition` 미지원/오류 시 `textarea` 수동 입력 가능

- audio 처리 실패 시 텍스트 기반 대화 fallback
  - `conversation_turn`에서 오디오 전사 실패 시 `usedTextFallback = true`
  - 텍스트 답변만으로 멀티턴 대화 지속

이 구조 덕분에 네트워크/브라우저 편차가 있어도 데모가 중단되지 않고 끝까지 진행됩니다.
