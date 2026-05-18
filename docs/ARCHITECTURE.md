# 다독다독 아키텍처

## 1. 전체 구조 개요
다독다독은 Next.js App Router 기반 단일 페이지 데모이며, 아래 영역으로 역할을 분리했습니다.

- `app`: 화면 진입점과 API Route
- `components`: Step별 UI 컴포넌트
- `hooks`: 브라우저 오디오 기능 추상화
- `lib`: Kanana 호출/프롬프트/타입/유틸
- `data`: 그림책 라이브러리와 fallback 데이터
- `docs`: 기술 문서

## 2. 폴더별 역할

### `src/app`
- `page.tsx`: 전체 상태 오케스트레이션, Step 전환, 버튼 핸들러
- `layout.tsx`: 메타데이터/공통 레이아웃
- `api/kanana/route.ts`: Kanana 외부 API와 통신하는 서버 라우트

### `src/components`
- `StepNavigation.tsx`: 상단 Step 네비게이션
- `steps/*`: Step 1~5 화면 구성
- `MessageBubble.tsx`: 대화 말풍선 UI
- `ApiKeyInput.tsx`, `ErrorMessage.tsx`, `LoadingState.tsx`: 공통 UI

### `src/hooks`
- `useRecorder.ts`: 마이크 녹음(MediaRecorder)
- `useSpeechRecognition.ts`: 브라우저 STT(Web Speech)
- `useSpeechSynthesis.ts`: 브라우저 TTS + 오디오 재생
- `useLocalStorage.ts`: API Key 저장 상태

### `src/lib`
- `kanana.ts`: 클라이언트 API 호출 래퍼
- `prompt.ts`: action별 프롬프트 템플릿
- `types.ts`: 공용 타입
- `json.ts`: JSON 텍스트 추출/파싱 유틸
- `audio.ts`: Blob→Base64, 오디오 포맷 유틸
- `storage.ts`: localStorage key 상수

### `src/data`
- `sampleStory.ts`: 3권 그림책 메타데이터 + fallback 분석 결과

### `docs`
- 아키텍처, API 흐름, 운영/설계 문서

## 3. 사용자 흐름 기준 파일 연결

| 사용자 단계 | 핵심 파일 | 설명 |
|---|---|---|
| 1. 책 선택 | `src/components/steps/StorySelectStep.tsx`, `src/data/sampleStory.ts`, `src/app/page.tsx` | 라이브러리 카드 선택 후 `selectedStoryId` 갱신 |
| 2. 그림책 보기 | `src/components/steps/StoryViewStep.tsx`, `src/app/page.tsx` | 원문/장면 확인, 이야기 살펴보기 실행 |
| 3. 아이 수준에 맞게 바꾸기 | `src/components/steps/StoryViewStep.tsx`, `src/lib/kanana.ts`, `src/app/api/kanana/route.ts` | `adapt_level_text` 호출 후 `levelAdaptation` 반영 |
| 4. 이야기 듣기 | `src/components/steps/StoryListenStep.tsx`, `src/hooks/useSpeechSynthesis.ts`, `src/app/page.tsx` | 원문/쉬운 글 듣기, Kanana TTS 실패 시 브라우저 음성 fallback |
| 5. 말하기 | `src/components/steps/ConversationStep.tsx`, `src/hooks/useRecorder.ts`, `src/hooks/useSpeechRecognition.ts`, `src/lib/kanana.ts` | 녹음/STT, `conversation_turn` 호출, 멀티턴 메시지 누적 |
| 6. 리포트 생성 | `src/components/steps/ParentReportStep.tsx`, `src/lib/kanana.ts`, `src/app/page.tsx` | `parent_report` 호출 및 fallback 리포트 생성 |

## 4. 상태 흐름
`src/app/page.tsx`를 기준으로 핵심 상태는 아래와 같습니다.

- `selectedStory`
  - 실제 state는 `selectedStoryId`이며, `useMemo`로 `selectedStory`를 파생합니다.
  - 책 선택 단계의 기준 값이며 이후 모든 Step의 콘텐츠 기준이 됩니다.

- `step`
  - 현재 진행 단계(1~5)입니다.
  - Step 네비게이션 클릭/버튼 동작으로 변경됩니다.

- `analysis`
  - `analyze_story` 결과 저장 상태입니다.
  - 없으면 `sampleStory`의 fallback 데이터를 `activeStoryAnalysis`로 사용합니다.

- `levelAdaptation`
  - `adapt_level_text` 결과(기초/표준/심화 변환 문장) 저장 상태입니다.

- `selectedLevelText`
  - 실제로 Step 3/4에서 우선 사용할 문장 텍스트입니다.
  - `levelAdaptation`을 적용하면 이 값에 반영됩니다.

- `conversation`
  - `{ messages, currentQuestion, turnCount, isFinished }` 구조로 멀티턴 대화 상태를 관리합니다.

- `report`
  - `parent_report` 결과를 저장합니다.
  - API 실패/대화 없음 상황에서는 fallback 리포트로 대체됩니다.

## 5. 오디오 구조

### `useRecorder`
- 마이크 권한 요청 후 녹음 시작/중지
- `audioBlob`, `audioUrl`, `mimeType` 제공
- Step 4에서 음성 답변 원본 확보

### `useSpeechRecognition`
- Web Speech API 기반 실시간 인식
- 인식 텍스트를 `draftAnswerText`에 반영
- 브라우저 미지원 시 텍스트 직접 입력으로 진행

### `useSpeechSynthesis`
- Kanana TTS audioDataUrl 재생 또는 브라우저 음성 합성 실행
- 긴 문장은 문장 단위 chunk 재생
- 실행 중 cancel/재생 상태 관리

## 6. fallback 설계

- `analyze_story` 실패/미실행
  - `sampleStory.ts`의 `fallbackData`로 화면 진행

- `adapt_level_text` 실패
  - `levelFallbackTexts`(basic/standard/advanced) 사용

- `conversation_turn` 오디오 처리 실패
  - STT 결과/텍스트 답변 기반으로 대화 지속

- `parent_report` 실패 또는 대화 없음
  - `createFallbackReport()` 결과 표시

- `tts` 실패
  - `useSpeechSynthesis`의 브라우저 음성으로 fallback

이 설계 덕분에 외부 API 오류가 있어도 데모 흐름이 끊기지 않도록 유지합니다.
