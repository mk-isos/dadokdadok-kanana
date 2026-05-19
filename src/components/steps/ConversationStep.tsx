import Image from "next/image";
import { RefObject } from "react";

import LoadingState from "@/components/LoadingState";
import MessageBubble from "@/components/MessageBubble";
import { ConversationMessage, ConversationState, StoryLibraryItem } from "@/lib/types";

interface ConversationStepProps {
  story: StoryLibraryItem;
  conversation: ConversationState;
  levelAdjustedQuestion: string;
  latestKananaMessage: ConversationMessage | null;
  lastFeedbackText: string;
  chatEndRef: RefObject<HTMLDivElement | null>;
  draftAnswerText: string;
  onDraftAnswerTextChange: (text: string) => void;
  isSendingTurn: boolean;
  onSendAnswer: () => void;
  onFinishConversation: () => void;
  onViewReport: () => void;
  onPrev: () => void;
  onStartConversation: () => void;
  onSpeakText: (text: unknown) => void;
  onToggleRecording: () => void;
  isRecording: boolean;
  recorderError: string | null;
  audioUrl: string;
  isSpeechRecognitionSupported: boolean;
  isSpeechListening: boolean;
  speechError: string | null;
}

export default function ConversationStep({
  story,
  conversation,
  levelAdjustedQuestion,
  latestKananaMessage,
  lastFeedbackText,
  chatEndRef,
  draftAnswerText,
  onDraftAnswerTextChange,
  isSendingTurn,
  onSendAnswer,
  onFinishConversation,
  onViewReport,
  onPrev,
  onStartConversation,
  onSpeakText,
  onToggleRecording,
  isRecording,
  recorderError,
  audioUrl,
  isSpeechRecognitionSupported,
  isSpeechListening,
  speechError,
}: ConversationStepProps) {
  type VoiceInputState = "idle" | "recording" | "recorded" | "sending";

  const currentQuestion =
    conversation.currentQuestion || (conversation.messages.length === 0 ? levelAdjustedQuestion : "대화를 마무리해도 괜찮아요.");

  const currentSpeechText =
    latestKananaMessage?.text || conversation.currentQuestion || (conversation.messages.length === 0 ? levelAdjustedQuestion : "") || lastFeedbackText;

  const trimmedDraft = draftAnswerText.trim();
  const hasRecordedAudio = Boolean(audioUrl);
  const hasRecordedAnswer = hasRecordedAudio || Boolean(trimmedDraft);
  const voiceInputState: VoiceInputState = isSendingTurn
    ? "sending"
    : isRecording
      ? "recording"
      : hasRecordedAnswer
        ? "recorded"
        : "idle";

  const micButtonLabel =
    voiceInputState === "recording"
      ? "🎙️ 듣고 있어요..."
      : voiceInputState === "sending"
        ? "⏳ Kanana가 듣고 있어요"
        : voiceInputState === "recorded"
          ? "🎤 다시 말해볼까요?"
          : "🎤 크게 말해볼까요?";

  const micButtonStyle =
    voiceInputState === "recording"
      ? "bg-rose-500 text-white ring-8 ring-rose-100 shadow-2xl animate-pulse"
      : voiceInputState === "sending"
        ? "bg-slate-400 text-white shadow-md"
        : voiceInputState === "recorded"
          ? "bg-emerald-500 text-white shadow-lg"
          : "bg-slate-900 text-white shadow-lg";

  const micStatusText =
    voiceInputState === "recording"
      ? "지금 목소리를 듣고 있어요. 다시 누르면 녹음이 끝나요."
      : voiceInputState === "sending"
        ? "답변을 보내는 중이에요."
        : voiceInputState === "recorded"
          ? "📝 이렇게 들었어요. 맞는지 확인하고 보내주세요."
          : "마이크 버튼을 한 번 눌러 말하고, 다시 눌러 마무리해요.";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black">Kanana와 말하기</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{conversation.turnCount}턴</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <article className="overflow-hidden rounded-3xl border border-slate-200">
            <Image src={story.imagePath} alt={`${story.title} 대화 장면`} width={1200} height={800} className="h-auto w-full object-cover" />
            <p className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">그림을 보면서 질문에 대답해보세요.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">현재 질문</p>
            <p className="mt-1 text-base font-bold leading-7">{currentQuestion}</p>
            <button
              type="button"
              onClick={() => onSpeakText(currentSpeechText)}
              disabled={!currentSpeechText}
              aria-label="현재 질문 읽어주기"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              현재 내용 읽어주기
            </button>
          </article>
        </aside>

        <div className="space-y-3">
          <div className="max-h-[24rem] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3" aria-label="대화 기록">
            {conversation.messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">아직 대화를 시작하지 않았어요.</p>
                <button
                  type="button"
                  onClick={onStartConversation}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  기본 질문으로 시작하기
                </button>
              </div>
            ) : (
              conversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLatestKanana={latestKananaMessage?.id === message.id}
                  onSpeak={onSpeakText}
                />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onToggleRecording}
                disabled={isSendingTurn}
                aria-label={isRecording ? "녹음 종료" : "녹음 시작"}
                className={`flex h-44 w-44 items-center justify-center rounded-full px-6 text-center text-lg font-black leading-7 transition disabled:cursor-not-allowed ${micButtonStyle}`}
              >
                {micButtonLabel}
              </button>
            </div>
            <p className="mt-4 text-center text-sm font-medium text-slate-700">{micStatusText}</p>
            <p className="mt-1 text-center text-xs text-slate-500">
              {isSpeechListening ? "실시간 음성 인식 중" : "음성 인식 대기 중"}
              {!isSpeechRecognitionSupported ? " · 이 브라우저는 실시간 음성 인식을 지원하지 않아요" : ""}
            </p>
          </article>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {audioUrl ? <audio controls src={audioUrl} className="w-full" /> : null}
            <div className="space-y-1">
              <label htmlFor="draft-answer" className="text-xs font-semibold text-slate-600">
                음성 인식 결과 (직접 입력/수정 가능)
              </label>
              <textarea
                id="draft-answer"
                rows={4}
                value={draftAnswerText}
                onChange={(event) => onDraftAnswerTextChange(event.target.value)}
                placeholder="마이크를 쓰지 않아도 여기에서 직접 답을 쓸 수 있어요"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          {recorderError ? <p className="text-xs text-rose-600">{recorderError}</p> : null}
          {speechError ? <p className="text-xs text-rose-600">{speechError}</p> : null}

          {isSendingTurn ? (
            <div>
              <LoadingState message="Kanana가 답변을 듣고 있어요" />
            </div>
          ) : null}

          {hasRecordedAnswer || isSendingTurn ? (
            <button
              type="button"
              onClick={onSendAnswer}
              disabled={isSendingTurn || conversation.isFinished || isRecording}
              aria-label="답변 보내기"
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              답변 보내기
            </button>
          ) : null}

          <button
            type="button"
            onClick={onFinishConversation}
            aria-label="대화 종료"
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white"
          >
            대화 마치기
          </button>

          <button
            type="button"
            onClick={onViewReport}
            aria-label="리포트 단계로 이동"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            리포트 보기
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onPrev}
        aria-label="이전 단계 이동"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
      >
        이전으로
      </button>
    </section>
  );
}
