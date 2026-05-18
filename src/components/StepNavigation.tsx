import ApiKeyInput from "@/components/ApiKeyInput";
import { ReadingLevel } from "@/lib/types";

type StepId = 1 | 2 | 3 | 4 | 5;

export interface StepItem {
  id: StepId;
  label: string;
}

interface StepNavigationProps {
  items: StepItem[];
  currentStep: StepId;
  progressWidth: string;
  selectedStoryTitle: string;
  selectedReadingLevel: ReadingLevel;
  showApiKeySettings: boolean;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onToggleApiKeySettings: () => void;
  onStepClick: (step: StepId) => void;
  canNavigateStep: (step: StepId) => boolean;
}

export default function StepNavigation({
  items,
  currentStep,
  progressWidth,
  selectedStoryTitle,
  selectedReadingLevel,
  showApiKeySettings,
  apiKey,
  onApiKeyChange,
  onToggleApiKeySettings,
  onStepClick,
  canNavigateStep,
}: StepNavigationProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500">다독다독 데모</p>
          <h1 className="mt-1 text-2xl font-black">다독다독 × Kanana-o</h1>
          <p className="mt-1 text-sm text-slate-600">보고, 듣고, 말하며 마음을 다독이는 AI 독서 친구</p>
        </div>
        <button
          type="button"
          aria-label="API Key 설정 열기"
          onClick={onToggleApiKeySettings}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          API Key 설정
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: progressWidth }} />
      </div>

      <div className="mt-2 grid grid-cols-5 gap-2">
        {items.map((item) => {
          const isDisabled = !canNavigateStep(item.id);
          const isCurrent = item.id === currentStep;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onStepClick(item.id)}
              disabled={isDisabled}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${item.id}단계 ${item.label} 이동`}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isCurrent
                  ? "bg-slate-900 text-white"
                  : item.id < currentStep
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
              } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="block text-[11px]">{item.id}</span>
              <span className="block text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1">선택한 책: {selectedStoryTitle}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1">읽기 수준: {selectedReadingLevel}</span>
      </div>

      {showApiKeySettings ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <ApiKeyInput value={apiKey} onChange={onApiKeyChange} />
          <p className="mt-2 text-xs text-slate-500">입력한 키는 이 기기 브라우저에만 저장돼요.</p>
        </div>
      ) : null}
    </section>
  );
}
