import { ConversationMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ConversationMessage;
  isLatestKanana: boolean;
  onSpeak: (text: string) => void;
}

export default function MessageBubble({ message, isLatestKanana, onSpeak }: MessageBubbleProps) {
  const isKanana = message.role === "kanana";

  return (
    <div
      className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
        isKanana ? "mr-8 bg-white text-slate-800" : "ml-8 bg-slate-900 text-white"
      } ${isLatestKanana ? "ring-2 ring-sky-200" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold opacity-70">{isKanana ? "Kanana" : "아이"}</p>
        {isLatestKanana ? (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">최신 질문</span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap">{message.text}</p>
      {isKanana ? (
        <button
          type="button"
          onClick={() => onSpeak(message.text)}
          aria-label="Kanana 메시지 읽어주기"
          className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
        >
          읽어주기
        </button>
      ) : null}
    </div>
  );
}
