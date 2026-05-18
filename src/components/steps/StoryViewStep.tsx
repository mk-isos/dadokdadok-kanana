import Image from "next/image";

import LoadingState from "@/components/LoadingState";
import { CHILD_LEVEL_OPTIONS, ChildLevel, LevelAdaptation, ReadingLevel, StoryAnalysisResult, StoryLibraryItem } from "@/lib/types";

interface ReadingLevelOption {
  value: ReadingLevel;
  title: string;
  description: string;
}

interface StoryViewStepProps {
  story: StoryLibraryItem;
  analysis: StoryAnalysisResult;
  hasAnalysis: boolean;
  isAnalyzingStory: boolean;
  onAnalyzeStory: () => void;
  isSpeaking: boolean;
  activeReadTarget: "original" | "easy" | null;
  onListenOriginalText: () => void;
  selectedReadingLevel: ReadingLevel;
  readingLevelOptions: ReadingLevelOption[];
  onSelectReadingLevel: (level: ReadingLevel) => void;
  isAdaptingLevel: boolean;
  onAdaptReadingLevel: () => void;
  levelAdaptation: LevelAdaptation | null;
  onUseAdaptedText: () => void;
  selectedLevelText: string;
  showAdvancedSettings: boolean;
  onToggleAdvancedSettings: () => void;
  childLevel: ChildLevel;
  onChildLevelChange: (value: ChildLevel) => void;
  ocrCorrectionText: string;
  onOcrCorrectionTextChange: (value: string) => void;
  sceneCorrectionText: string;
  onSceneCorrectionTextChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StoryViewStep({
  story,
  analysis,
  hasAnalysis,
  isAnalyzingStory,
  onAnalyzeStory,
  isSpeaking,
  activeReadTarget,
  onListenOriginalText,
  selectedReadingLevel,
  readingLevelOptions,
  onSelectReadingLevel,
  isAdaptingLevel,
  onAdaptReadingLevel,
  levelAdaptation,
  onUseAdaptedText,
  selectedLevelText,
  showAdvancedSettings,
  onToggleAdvancedSettings,
  childLevel,
  onChildLevelChange,
  ocrCorrectionText,
  onOcrCorrectionTextChange,
  sceneCorrectionText,
  onSceneCorrectionTextChange,
  onNext,
  onPrev,
}: StoryViewStepProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">그림책 보기</h2>
      <p className="mt-1 text-sm text-slate-600">{story.title}</p>
      <p className="mt-1 text-xs text-slate-500">먼저 그림과 글을 보고, 필요하면 아이에게 맞게 바꿔볼 수 있어요.</p>

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
        <Image src={story.imagePath} alt={`${story.title} 그림책 장면`} width={1200} height={800} className="h-auto w-full object-cover" />
      </div>

      {isAnalyzingStory ? (
        <div className="mt-4">
          <LoadingState message="다독다독이 이야기를 살펴보고 있어요" />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAnalyzeStory}
        disabled={isAnalyzingStory}
        aria-label="이야기 살펴보기"
        className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        이야기 살펴보기
      </button>

      <article className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-500">그림에서 읽은 원문</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{analysis.extractedText}</p>
        <button
          type="button"
          onClick={onListenOriginalText}
          aria-label="원문 듣기"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
        >
          {isSpeaking && activeReadTarget === "original" ? "📖 듣는 중..." : "📖 원문 듣기"}
        </button>
      </article>

      <article className="mt-3 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-800">조금 어렵다면 아이에게 맞는 문장으로 바꿔볼까요?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {readingLevelOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectReadingLevel(option.value)}
              aria-label={`${option.title} 수준 선택`}
              className={`rounded-xl border px-3 py-2 text-left ${
                selectedReadingLevel === option.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="text-sm font-bold">{option.title}</p>
              <p className="mt-0.5 text-xs opacity-90">{option.description}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onAdaptReadingLevel}
          disabled={isAdaptingLevel}
          aria-label="아이에게 맞게 문장 바꾸기"
          className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isAdaptingLevel ? "바꾸는 중..." : "아이에게 맞게 바꾸기"}
        </button>

        {levelAdaptation ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">
              {levelAdaptation.title} · {levelAdaptation.description}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{levelAdaptation.adaptedText}</p>
            <button
              type="button"
              onClick={onUseAdaptedText}
              aria-label="바꾼 문장 적용"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            >
              이 문장으로 이어서 듣기
            </button>
          </div>
        ) : null}

        {selectedLevelText ? <p className="mt-3 text-xs text-slate-600">다음 듣기 단계에 이 문장이 적용돼요.</p> : null}
      </article>

      <button
        type="button"
        onClick={onToggleAdvancedSettings}
        aria-label="보호자 설정 열기"
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
      >
        {showAdvancedSettings ? "보호자 설정 닫기" : "보호자 설정 (원문 보정)"}
      </button>

      {showAdvancedSettings ? (
        <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1">
            <label htmlFor="child-level" className="text-xs font-semibold text-slate-600">
              아동 수준
            </label>
            <select
              id="child-level"
              value={childLevel}
              onChange={(event) => onChildLevelChange(event.target.value as ChildLevel)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {CHILD_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="ocr-correction" className="text-xs font-semibold text-slate-600">
              원문 보정 (선택)
            </label>
            <textarea
              id="ocr-correction"
              rows={3}
              value={ocrCorrectionText}
              onChange={(event) => onOcrCorrectionTextChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="필요할 때만 입력해 주세요"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="scene-correction" className="text-xs font-semibold text-slate-600">
              장면 보정 (선택)
            </label>
            <textarea
              id="scene-correction"
              rows={3}
              value={sceneCorrectionText}
              onChange={(event) => onSceneCorrectionTextChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="필요할 때만 입력해 주세요"
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        aria-label="다음 단계 이동"
        className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
      >
        {hasAnalysis ? "다음으로" : "바로 다음으로"}
      </button>

      <button
        type="button"
        onClick={onPrev}
        aria-label="이전 단계 이동"
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
      >
        이전으로
      </button>
    </section>
  );
}
