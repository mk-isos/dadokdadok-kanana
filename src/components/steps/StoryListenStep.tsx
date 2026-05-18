import Image from "next/image";

import { ReadingLevel, StoryAnalysisResult, StoryLibraryItem } from "@/lib/types";

interface StoryListenStepProps {
  story: StoryLibraryItem;
  readingLevel: ReadingLevel;
  analysis: StoryAnalysisResult;
  easyText: string;
  isEasyTextOpened: boolean;
  onOpenEasyText: () => void;
  isSpeaking: boolean;
  activeReadTarget: "original" | "easy" | null;
  onListenOriginalText: () => void;
  onListenEasyText: () => void;
  onStartConversation: () => void;
  onSkipToConversation: () => void;
  onPrev: () => void;
}

export default function StoryListenStep({
  story,
  readingLevel,
  analysis,
  easyText,
  isEasyTextOpened,
  onOpenEasyText,
  isSpeaking,
  activeReadTarget,
  onListenOriginalText,
  onListenEasyText,
  onStartConversation,
  onSkipToConversation,
  onPrev,
}: StoryListenStepProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">이야기 듣기</h2>
      <p className="mt-1 text-sm text-slate-600">아이가 글을 읽지 않아도 괜찮아요. 먼저 들으면서 이해해요.</p>
      <p className="mt-1 text-xs text-slate-500">현재 읽기 수준: {readingLevel}</p>

      <div className="mt-4 space-y-4">
        <article className="overflow-hidden rounded-3xl border border-slate-200">
          <Image src={story.imagePath} alt={`${story.title} 그림`} width={1200} height={800} className="h-auto w-full object-cover" />
          <p className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">원하면 이 단계는 건너뛰어도 돼요.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">먼저 원문을 들어볼까요?</p>
          <button
            type="button"
            onClick={onListenOriginalText}
            aria-label="원문 듣기"
            className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-black text-white"
          >
            {isSpeaking && activeReadTarget === "original" ? "📖 듣는 중..." : "📖 원문 듣기"}
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm text-slate-700">어려운 말은 쉬운 말로도 들어볼 수 있어요.</p>
          <button
            type="button"
            onClick={onOpenEasyText}
            aria-label="쉬운 말 보기"
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-black text-slate-800"
          >
            ✨ 쉬운 말 보기
          </button>
        </article>

        {isEasyTextOpened ? (
          <article className="rounded-2xl border border-slate-200 bg-sky-50/40 p-4">
            <p className="text-xs font-semibold text-slate-500">이렇게 쉽게 말할 수 있어요</p>
            <p className="mt-1 whitespace-pre-wrap text-base font-semibold leading-7">{easyText}</p>
            <button
              type="button"
              onClick={onListenEasyText}
              aria-label="쉬운 글 듣기"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-black text-slate-800"
            >
              {isSpeaking && activeReadTarget === "easy" ? "✨ 듣는 중..." : "✨ 쉬운 글 듣기"}
            </button>
          </article>
        ) : null}

        <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600">보호자 보기 (감정 설명)</summary>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">감정:</span> {analysis.emotion}
            </p>
            <p>
              <span className="font-semibold">이유:</span> {analysis.emotionReason}
            </p>
          </div>
        </details>

        <button
          type="button"
          onClick={onStartConversation}
          aria-label="대화하러 가기"
          className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-black text-white"
        >
          🎤 대화하러 가기
        </button>

        <p className="text-xs text-slate-500">추후 확장 예정: 표정 따라하기 활동</p>
      </div>

      <button
        type="button"
        onClick={onSkipToConversation}
        aria-label="듣기 건너뛰고 다음 단계"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
      >
        이 단계 건너뛰기
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
