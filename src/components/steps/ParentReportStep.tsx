import LoadingState from "@/components/LoadingState";
import { ParentReportResult, ReadingLevel } from "@/lib/types";

interface ParentReportStepProps {
  report: ParentReportResult | null;
  selectedReadingLevel: ReadingLevel;
  isGeneratingReport: boolean;
  onGenerateReport: () => void;
  onCopyReport: () => void;
  isCopied: boolean;
  onBackToConversation: () => void;
  onResetSession: () => void;
}

export default function ParentReportStep({
  report,
  selectedReadingLevel,
  isGeneratingReport,
  onGenerateReport,
  onCopyReport,
  isCopied,
  onBackToConversation,
  onResetSession,
}: ParentReportStepProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">보호자 리포트</h2>
      <p className="mt-1 text-sm text-slate-600">필요할 때 오늘 이야기를 간단히 정리해 볼 수 있어요.</p>

      <button
        type="button"
        onClick={onGenerateReport}
        disabled={isGeneratingReport}
        aria-label="오늘 이야기 정리하기"
        className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isGeneratingReport ? "정리하는 중..." : report ? "오늘 이야기 다시 정리하기" : "오늘 이야기 정리하기"}
      </button>

      {isGeneratingReport ? (
        <div className="mt-3">
          <LoadingState message="리포트를 만들고 있어요" />
        </div>
      ) : null}

      {report ? (
        <div className="mt-4 space-y-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">오늘 읽은 장면</p>
            <p className="mt-1 text-sm leading-6">{report.sessionSummary}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">오늘 사용한 읽기 수준</p>
            <p className="mt-1 text-sm leading-6">{report.readingLevelUsed || selectedReadingLevel}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">아이가 말한 내용 요약</p>
            <p className="mt-1 text-sm leading-6">{report.childAnswerSummary}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">잘한 점</p>
            <p className="mt-1 text-sm leading-6">{report.childStrength}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">다음에 함께 해볼 질문</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
              {report.recommendedQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">다음 지도 방향</p>
            <p className="mt-1 text-sm leading-6">{report.nextGuide}</p>
          </article>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{report.notice}</div>

          <button
            type="button"
            onClick={onCopyReport}
            aria-label="리포트 복사"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            {isCopied ? "복사 완료" : "결과 복사"}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          아직 정리된 내용이 없어요. 대화가 없어도 정리 버튼을 누르면 기본 리포트를 만들 수 있어요.
        </div>
      )}

      <button
        type="button"
        onClick={onBackToConversation}
        aria-label="대화 단계로 돌아가기"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
      >
        대화로 돌아가기
      </button>

      <button
        type="button"
        onClick={onResetSession}
        aria-label="처음으로 돌아가기"
        className="mt-2 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
      >
        처음으로
      </button>
    </section>
  );
}
