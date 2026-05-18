"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ErrorMessage from "@/components/ErrorMessage";
import StepNavigation, { StepItem } from "@/components/StepNavigation";
import ConversationStep from "@/components/steps/ConversationStep";
import ParentReportStep from "@/components/steps/ParentReportStep";
import StoryListenStep from "@/components/steps/StoryListenStep";
import StorySelectStep from "@/components/steps/StorySelectStep";
import StoryViewStep from "@/components/steps/StoryViewStep";
import { DEFAULT_FALLBACK_ANALYSIS, DEFAULT_STORY, STORY_LIBRARY } from "@/data/sampleStory";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRecorder } from "@/hooks/useRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { blobToBase64, guessAudioFormatFromMime } from "@/lib/audio";
import { adaptLevelText, analyzeStory, requestConversationTurn, requestParentReport, requestTts } from "@/lib/kanana";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  ChildLevel,
  ConversationMessage,
  ConversationState,
  LevelAdaptation,
  ParentReportResult,
  ReadingLevel,
  StoryAnalysisResult,
} from "@/lib/types";

type AppStep = 1 | 2 | 3 | 4 | 5;

const STEP_ITEMS: StepItem[] = [
  { id: 1, label: "책 고르기" },
  { id: 2, label: "그림 보기" },
  { id: 3, label: "이야기 듣기" },
  { id: 4, label: "말하기" },
  { id: 5, label: "리포트" },
];

const READING_LEVEL_OPTIONS: Array<{
  value: ReadingLevel;
  title: string;
  description: string;
}> = [
  { value: "basic", title: "기초", description: "아주 짧고 쉬운 문장" },
  { value: "standard", title: "표준", description: "감정과 이유를 함께 설명" },
  { value: "advanced", title: "심화", description: "원문의 느낌을 살리며 쉽게 설명" },
];

const INITIAL_CONVERSATION: ConversationState = {
  messages: [],
  currentQuestion: "",
  turnCount: 0,
  isFinished: false,
};

const MAX_TURNS = 5;

function createMessage(role: ConversationMessage["role"], text: string): ConversationMessage {
  const hasRandomUuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
  return {
    id: hasRandomUuid ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

function mergeReportText(report: ParentReportResult): string {
  return [
    `오늘 읽은 장면: ${report.sessionSummary}`,
    `오늘 사용한 읽기 수준: ${report.readingLevelUsed || "standard"}`,
    `아이가 말한 내용 요약: ${report.childAnswerSummary}`,
    `잘한 점: ${report.childStrength}`,
    `다음 지도 방향: ${report.nextGuide}`,
    "다음에 함께 해볼 질문:",
    ...report.recommendedQuestions.map((question) => `- ${question}`),
    `주의 문구: ${report.notice}`,
  ].join("\n");
}

function getLatestKananaMessage(messages: ConversationMessage[]): ConversationMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "kanana") {
      return messages[index];
    }
  }
  return null;
}

function createFallbackReport(
  storyAnalysis: StoryAnalysisResult,
  conversationMessages: ConversationMessage[],
  readingLevel: ReadingLevel,
): ParentReportResult {
  const childMessages = conversationMessages
    .filter((message) => message.role === "child")
    .map((message) => message.text.trim())
    .filter(Boolean);

  const hasConversation = childMessages.length > 0;
  const childSummary = hasConversation
    ? childMessages.join(" / ")
    : "아직 대화 기록이 없습니다. 다음에는 한두 문장으로 느낌을 말해보면 좋아요.";

  const emotion = storyAnalysis.emotion.trim();
  const isWorryStory = /(걱정|불안|긴장|위로)/.test(emotion);
  const isBrightStory = /(기쁨|자신감|용기|도전|응원)/.test(emotion);

  const recommendedQuestions = isWorryStory
    ? [storyAnalysis.childQuestion, "응원을 들으면 마음이 어떻게 바뀔까?", "긴장될 때 어떤 말을 해주면 좋을까?"]
    : isBrightStory
      ? [storyAnalysis.childQuestion, "친구들이 응원해주면 어떤 기분이 들까?", "너도 용기를 내본 순간이 있었니?"]
      : [storyAnalysis.childQuestion, "토끼는 어떤 표정을 하고 있었을까?", "친구가 돌아오면 기분이 어떻게 달라질까?"];

  const nextGuide = isWorryStory
    ? "긴장되는 상황을 떠올린 뒤, 위로 문장과 다시 해보는 행동을 짧게 반복해 주세요."
    : isBrightStory
      ? "아이의 도전 경험을 짧게 떠올리게 하며 응원 문장을 함께 만들어 보세요."
      : "짧은 질문 하나씩 천천히 반복하며 감정과 이유를 연결해 주세요.";

  const childStrength = hasConversation
    ? isWorryStory
      ? "아이는 걱정되는 마음과 위로받은 뒤의 변화를 자신의 말로 표현하려고 시도했습니다."
      : isBrightStory
        ? "아이는 응원과 용기의 연결을 자신의 말로 표현하려고 시도했습니다."
        : "아이는 외로움과 친구 관계를 자신의 말로 설명하려고 시도했습니다."
    : "그림을 보고 느낌을 말해보려는 시도 자체가 좋은 시작입니다.";

  return {
    sessionSummary: storyAnalysis.sceneDescription,
    readingLevelUsed: readingLevel,
    childAnswerSummary: childSummary,
    childStrength,
    nextGuide,
    recommendedQuestions,
    notice: "이 리포트는 독서 활동 관찰을 돕기 위한 참고 자료이며, 진단이나 치료 효과를 의미하지 않습니다.",
  };
}

function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const match = normalized.match(/^(.*?[.!?？。])/);
  return (match?.[1] || normalized).trim();
}

function toShortQuestion(text: string, fallback: string): string {
  const base = firstSentence(text).replace(/["'“”]/g, "").trim();
  const trimmed = base.length > 60 ? `${base.slice(0, 58).trim()}?` : base;
  if (!trimmed) return fallback;
  return trimmed.endsWith("?") || trimmed.endsWith("？") ? trimmed : `${trimmed.replace(/[.!。]+$/, "")}?`;
}

function limitSentences(text: string, count = 2): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const pieces = normalized.match(/[^.!?？。]+[.!?？。]?/g) || [normalized];
  return pieces.slice(0, count).join(" ").trim();
}

function buildQuestionForReadingLevel(storyId: string, storyAnalysis: StoryAnalysisResult, readingLevel: ReadingLevel): string {
  const storyQuestions: Record<string, string> = {
    "dadokdadok-story-1": "토끼는 왜 슬펐을까?",
    "dadokdadok-story-2": "원숭이는 왜 신났을까?",
    "dadokdadok-story-3": "하율이는 왜 걱정됐을까?",
  };
  const byStory = storyQuestions[storyId] || storyAnalysis.childQuestion;

  if (readingLevel === "basic") {
    return toShortQuestion(byStory, "주인공은 어떤 마음이었을까?");
  }

  if (readingLevel === "advanced") {
    const advancedByStory: Record<string, string> = {
      "dadokdadok-story-1": "토끼는 왜 슬펐고, 친구가 오면 마음이 어떻게 달라질까?",
      "dadokdadok-story-2": "원숭이는 응원을 듣고 왜 더 용감해졌을까?",
      "dadokdadok-story-3": "하율이는 응원을 듣고 어떻게 용기를 냈을까?",
    };
    return toShortQuestion(advancedByStory[storyId] || storyAnalysis.childQuestion, byStory);
  }

  return toShortQuestion(byStory, "주인공은 어떤 마음이었을까?");
}

function normalizeSpeechInput(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeSpeechInput(item))
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value).trim();
    }
  }
  return String(value).trim();
}

export default function Home() {
  const [apiKey, setApiKey] = useLocalStorage(STORAGE_KEYS.apiKey, "");
  const [step, setStep] = useState<AppStep>(1);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [childLevel, setChildLevel] = useState<ChildLevel>("standard");
  const [ocrCorrectionText, setOcrCorrectionText] = useState("");
  const [sceneCorrectionText, setSceneCorrectionText] = useState("");

  const [analysis, setAnalysis] = useState<StoryAnalysisResult | null>(null);
  const [conversation, setConversation] = useState<ConversationState>(INITIAL_CONVERSATION);
  const [parentObservations, setParentObservations] = useState<string[]>([]);
  const [draftAnswerText, setDraftAnswerText] = useState("");
  const [lastFeedbackText, setLastFeedbackText] = useState("");
  const [report, setReport] = useState<ParentReportResult | null>(null);
  const [selectedReadingLevel, setSelectedReadingLevel] = useState<ReadingLevel>("basic");
  const [levelAdaptation, setLevelAdaptation] = useState<LevelAdaptation | null>(null);
  const [selectedLevelText, setSelectedLevelText] = useState("");
  const [isEasyTextOpened, setIsEasyTextOpened] = useState(false);
  const [activeReadTarget, setActiveReadTarget] = useState<"original" | "easy" | null>(null);

  const [isAnalyzingStory, setIsAnalyzingStory] = useState(false);
  const [isAdaptingLevel, setIsAdaptingLevel] = useState(false);
  const [isSendingTurn, setIsSendingTurn] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const recorder = useRecorder();
  const speechRecognition = useSpeechRecognition();
  const speaker = useSpeechSynthesis();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const selectedStory = useMemo(() => STORY_LIBRARY.find((story) => story.id === selectedStoryId) ?? null, [selectedStoryId]);
  const displayStory = selectedStory ?? DEFAULT_STORY;
  const hasSelectedStory = Boolean(selectedStoryId);

  const latestKananaMessage = useMemo(() => getLatestKananaMessage(conversation.messages), [conversation.messages]);

  const activeStoryAnalysis = useMemo<StoryAnalysisResult>(
    () => analysis ?? displayStory.fallbackData ?? DEFAULT_FALLBACK_ANALYSIS,
    [analysis, displayStory],
  );

  const effectiveEasyText = useMemo(
    () => selectedLevelText.trim() || activeStoryAnalysis.easyText,
    [selectedLevelText, activeStoryAnalysis.easyText],
  );

  const levelAdjustedQuestion = useMemo(
    () => buildQuestionForReadingLevel(displayStory.id, activeStoryAnalysis, selectedReadingLevel),
    [displayStory.id, activeStoryAnalysis, selectedReadingLevel],
  );

  const progressWidth = `${(step / STEP_ITEMS.length) * 100}%`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.messages.length]);

  const clearMessages = () => {
    setErrorMessage("");
    setNoticeMessage("");
  };

  const ensureApiKey = () => {
    if (!apiKey.trim()) {
      throw new Error("먼저 Kanana API Key를 입력해 주세요.");
    }
  };

  const resetSessionStates = () => {
    setAnalysis(null);
    setConversation(INITIAL_CONVERSATION);
    setParentObservations([]);
    setDraftAnswerText("");
    setLastFeedbackText("");
    setReport(null);
    setSelectedReadingLevel("basic");
    setLevelAdaptation(null);
    setSelectedLevelText("");
    setIsEasyTextOpened(false);
    setActiveReadTarget(null);
    setShowAdvancedSettings(false);
    setOcrCorrectionText("");
    setSceneCorrectionText("");
    recorder.clearAudio();
    speechRecognition.resetTranscript();
  };

  const handleSelectStory = (storyId: string) => {
    clearMessages();
    if (selectedStoryId !== storyId) {
      setSelectedStoryId(storyId);
      resetSessionStates();
    }
  };

  const handleGoToStep2 = () => {
    if (!hasSelectedStory) {
      setErrorMessage("책을 고르면 다음 단계로 갈 수 있어요.");
      return;
    }
    clearMessages();
    setStep(2);
  };

  const canNavigateStep = (targetStep: AppStep) => (targetStep === 1 ? true : hasSelectedStory);

  const handleStepNavigation = (targetStep: AppStep) => {
    if (!canNavigateStep(targetStep)) {
      setErrorMessage("먼저 1단계에서 책을 골라주세요.");
      return;
    }
    clearMessages();
    setStep(targetStep);
  };

  const analyzeCurrentStory = async () => {
    try {
      clearMessages();
      ensureApiKey();
      setIsAnalyzingStory(true);

      const imageResponse = await fetch(displayStory.imagePath);
      if (!imageResponse.ok) {
        throw new Error("그림책 이미지를 불러오지 못했습니다.");
      }

      const imageBase64 = await blobToBase64(await imageResponse.blob());
      const result = await analyzeStory({
        apiKey,
        imageBase64,
        childLevel,
        ocrCorrectionText,
        sceneCorrectionText,
      });

      setAnalysis(result);
      setLevelAdaptation(null);
      setSelectedLevelText("");
      setIsEasyTextOpened(false);
      setActiveReadTarget(null);
      setStep(3);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "이야기를 살펴보는 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzingStory(false);
    }
  };

  const startConversation = () => {
    clearMessages();
    if (conversation.messages.length > 0) {
      setStep(4);
      return;
    }

    const firstQuestion = levelAdjustedQuestion.trim() || "주인공은 어떤 마음이었을까?";

    setConversation({
      messages: [createMessage("kanana", firstQuestion)],
      currentQuestion: firstQuestion,
      turnCount: 0,
      isFinished: false,
    });
    setParentObservations([]);
    setDraftAnswerText("");
    setLastFeedbackText(firstQuestion);
    recorder.clearAudio();
    speechRecognition.resetTranscript();
    setStep(4);
  };

  const speakWithFallback = async (
    text: unknown,
    options?: {
      rate?: number;
      pitch?: number;
      lang?: string;
    },
  ) => {
    const normalizedText = normalizeSpeechInput(text);
    if (!normalizedText) return;

    clearMessages();
    let audioDataUrl: string | null = null;

    if (apiKey.trim()) {
      try {
        const tts = await requestTts({ apiKey, text: normalizedText });
        audioDataUrl = tts.audioDataUrl;
        if (!audioDataUrl) {
          setNoticeMessage("Kanana 음성이 잠시 비어 있어 브라우저 음성으로 읽어줄게요.");
        }
      } catch {
        setNoticeMessage("Kanana 음성 연결이 잠시 불안정해 브라우저 음성으로 읽어줄게요.");
      }
    }

    await speaker.speak({ text: normalizedText, audioDataUrl, ...options });
  };

  const handleListenOriginalText = async () => {
    if (!activeStoryAnalysis.extractedText) return;
    setActiveReadTarget("original");
    await speakWithFallback(activeStoryAnalysis.extractedText, { rate: 0.92, pitch: 1 });
  };

  const handleListenEasyText = async () => {
    if (!effectiveEasyText) return;
    setActiveReadTarget("easy");
    await speakWithFallback(effectiveEasyText, { rate: 0.86, pitch: 1 });
  };

  const handleAdaptReadingLevel = async () => {
    clearMessages();
    setIsAdaptingLevel(true);

    const levelInfo = READING_LEVEL_OPTIONS.find((option) => option.value === selectedReadingLevel);
    const sourceText = activeStoryAnalysis.extractedText.trim() || displayStory.intendedText;
    const fallbackText = displayStory.levelFallbackTexts[selectedReadingLevel] || activeStoryAnalysis.easyText;

    try {
      if (!apiKey.trim()) {
        setLevelAdaptation({
          level: selectedReadingLevel,
          title: levelInfo?.title || "수준별 문장",
          description: "API 없이 기본 문장으로 보여드려요.",
          adaptedText: fallbackText,
        });
        setNoticeMessage("API Key가 없어도 괜찮아요. 기본 문장으로 따뜻하게 이어갈게요.");
        return;
      }

      const result = await adaptLevelText({
        apiKey,
        extractedText: sourceText,
        storyTitle: displayStory.title,
        storyDescription: displayStory.description,
        readingLevel: selectedReadingLevel,
      });
      setLevelAdaptation(result);
    } catch {
      setLevelAdaptation({
        level: selectedReadingLevel,
        title: levelInfo?.title || "수준별 문장",
        description: "API 실패로 기본 문장을 먼저 보여드려요.",
        adaptedText: fallbackText,
      });
      setNoticeMessage("문장 바꾸기 연결이 잠시 불안정해 기본 문장으로 보여드려요.");
    } finally {
      setIsAdaptingLevel(false);
    }
  };

  const handleUseAdaptedText = () => {
    const text = levelAdaptation?.adaptedText?.trim() || displayStory.levelFallbackTexts[selectedReadingLevel] || activeStoryAnalysis.easyText;
    setSelectedLevelText(text);
    setIsEasyTextOpened(true);
    setNoticeMessage("다음 단계부터 이 문장을 우선으로 들려드릴게요.");
  };

  const handleStartRecording = async () => {
    clearMessages();
    await recorder.startRecording();

    if (speechRecognition.isSupported) {
      speechRecognition.startListening("ko-KR", (text) => {
        setDraftAnswerText(text);
      });
    }
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
    if (speechRecognition.isListening) {
      speechRecognition.stopListening();
    }
  };

  const handleToggleRecording = () => {
    if (recorder.isRecording) {
      handleStopRecording();
      return;
    }
    void handleStartRecording();
  };

  const handleSendAnswer = async () => {
    try {
      clearMessages();
      ensureApiKey();

      if (conversation.isFinished || !conversation.currentQuestion) {
        throw new Error("대화가 이미 마무리되었어요. 리포트를 확인해 주세요.");
      }

      const answerText = draftAnswerText.trim();
      if (!answerText && !recorder.audioBlob) {
        throw new Error("답변 텍스트를 입력하거나 음성을 녹음해 주세요.");
      }

      setIsSendingTurn(true);
      if (speechRecognition.isListening) {
        speechRecognition.stopListening();
      }

      let audioBase64 = "";
      let audioFormat = "";
      if (recorder.audioBlob) {
        audioBase64 = await blobToBase64(recorder.audioBlob);
        audioFormat = guessAudioFormatFromMime(recorder.mimeType || recorder.audioBlob.type);
      }

      const childMessage = createMessage("child", answerText || "(음성 답변)");
      const snapshot = conversation;
      const requestMessages = [...snapshot.messages, childMessage];

      setConversation((prev) => ({ ...prev, messages: requestMessages }));

      const response = await requestConversationTurn({
        apiKey,
        childLevel,
        selectedReadingLevel,
        selectedLevelText: effectiveEasyText,
        analysis: activeStoryAnalysis,
        conversationMessages: requestMessages,
        currentQuestion: snapshot.currentQuestion,
        childAnswerText: answerText,
        turnCount: snapshot.turnCount + 1,
        audioBase64: audioBase64 || undefined,
        audioFormat: audioFormat || undefined,
      });

      if (response.transcriptFromAudio && !answerText) {
        setDraftAnswerText(response.transcriptFromAudio);
      } else {
        setDraftAnswerText("");
      }

      if (response.usedTextFallback) {
        setNoticeMessage("음성 이해가 불안정해 텍스트 중심으로 답변을 분석했어요.");
      }

      const nextTurn = snapshot.turnCount + 1;
      const shouldContinue = response.result.shouldContinue && nextTurn < MAX_TURNS;

      const conciseFeedback = limitSentences(response.result.feedbackForChild?.trim() || "좋은 생각이야. 같이 한 번 더 생각해보자.", 2);
      const conciseNextQuestion = toShortQuestion(response.result.nextQuestion?.trim() || levelAdjustedQuestion, levelAdjustedQuestion);

      const kananaText = shouldContinue ? `${conciseFeedback}\n\n${conciseNextQuestion}` : conciseFeedback;
      const feedbackSpeechText = [conciseFeedback, shouldContinue ? conciseNextQuestion : ""].filter(Boolean).join(" ");

      setConversation({
        messages: [...requestMessages, createMessage("kanana", kananaText)],
        currentQuestion: shouldContinue ? conciseNextQuestion : "",
        turnCount: nextTurn,
        isFinished: !shouldContinue,
      });

      setLastFeedbackText(feedbackSpeechText);
      setParentObservations((prev) => [...prev, response.result.parentObservation]);

      recorder.clearAudio();
      if (!shouldContinue) {
        setNoticeMessage("대화가 따뜻하게 마무리됐어요. 이제 오늘 이야기를 정리해볼까요?");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "답변 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSendingTurn(false);
    }
  };

  const generateReport = async () => {
    clearMessages();
    setIsGeneratingReport(true);

    try {
      const childMessages = conversation.messages.filter((message) => message.role === "child");
      if (childMessages.length === 0) {
        setReport(createFallbackReport(activeStoryAnalysis, conversation.messages, selectedReadingLevel));
        setNoticeMessage("대화 기록이 적어 기본 리포트로 보여드려요.");
        return;
      }

      if (!apiKey.trim()) {
        setReport(createFallbackReport(activeStoryAnalysis, conversation.messages, selectedReadingLevel));
        setNoticeMessage("API Key가 없어도 괜찮아요. 기본 리포트를 먼저 보여드릴게요.");
        return;
      }

      const result = await requestParentReport({
        apiKey,
        storyTitle: displayStory.title,
        selectedReadingLevel,
        selectedLevelText: effectiveEasyText,
        analysis: activeStoryAnalysis,
        conversationMessages: conversation.messages,
        parentObservations,
      });

      setReport({ ...result, readingLevelUsed: result.readingLevelUsed || selectedReadingLevel });
    } catch (error) {
      setReport(createFallbackReport(activeStoryAnalysis, conversation.messages, selectedReadingLevel));
      setNoticeMessage("리포트 연결이 불안정해 기본 리포트로 대체했어요.");
      setErrorMessage(error instanceof Error ? error.message : "리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const finishConversation = () => {
    setConversation((prev) => ({ ...prev, isFinished: true, currentQuestion: "" }));
    setStep(5);
  };

  const copyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(mergeReportText(report));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleStep2Next = () => {
    if (!analysis) {
      setNoticeMessage("이야기 살펴보기를 건너뛰어도 괜찮아요. 기본 설명과 질문으로 이어갈게요.");
    }
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] px-4 py-8 text-slate-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <StepNavigation
          items={STEP_ITEMS}
          currentStep={step}
          progressWidth={progressWidth}
          selectedStoryTitle={hasSelectedStory ? displayStory.title : "아직 선택 안 함"}
          selectedReadingLevel={selectedReadingLevel}
          showApiKeySettings={showApiKeySettings}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onToggleApiKeySettings={() => setShowApiKeySettings((prev) => !prev)}
          onStepClick={handleStepNavigation}
          canNavigateStep={canNavigateStep}
        />

        {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
        {speaker.error ? <ErrorMessage message={speaker.error} /> : null}
        {noticeMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{noticeMessage}</div>
        ) : null}

        {step === 1 ? (
          <StorySelectStep
            stories={STORY_LIBRARY}
            selectedStoryId={selectedStoryId}
            onSelectStory={handleSelectStory}
            onNext={handleGoToStep2}
            hasSelectedStory={hasSelectedStory}
          />
        ) : null}

        {step === 2 ? (
          <StoryViewStep
            story={displayStory}
            analysis={activeStoryAnalysis}
            hasAnalysis={Boolean(analysis)}
            isAnalyzingStory={isAnalyzingStory}
            onAnalyzeStory={analyzeCurrentStory}
            isSpeaking={speaker.isSpeaking}
            activeReadTarget={activeReadTarget}
            onListenOriginalText={handleListenOriginalText}
            selectedReadingLevel={selectedReadingLevel}
            readingLevelOptions={READING_LEVEL_OPTIONS}
            onSelectReadingLevel={setSelectedReadingLevel}
            isAdaptingLevel={isAdaptingLevel}
            onAdaptReadingLevel={handleAdaptReadingLevel}
            levelAdaptation={levelAdaptation}
            onUseAdaptedText={handleUseAdaptedText}
            selectedLevelText={selectedLevelText}
            showAdvancedSettings={showAdvancedSettings}
            onToggleAdvancedSettings={() => setShowAdvancedSettings((prev) => !prev)}
            childLevel={childLevel}
            onChildLevelChange={setChildLevel}
            ocrCorrectionText={ocrCorrectionText}
            onOcrCorrectionTextChange={setOcrCorrectionText}
            sceneCorrectionText={sceneCorrectionText}
            onSceneCorrectionTextChange={setSceneCorrectionText}
            onNext={handleStep2Next}
            onPrev={() => setStep(1)}
          />
        ) : null}

        {step === 3 ? (
          <StoryListenStep
            story={displayStory}
            readingLevel={selectedReadingLevel}
            analysis={activeStoryAnalysis}
            easyText={effectiveEasyText}
            isEasyTextOpened={isEasyTextOpened}
            onOpenEasyText={() => setIsEasyTextOpened(true)}
            isSpeaking={speaker.isSpeaking}
            activeReadTarget={activeReadTarget}
            onListenOriginalText={handleListenOriginalText}
            onListenEasyText={handleListenEasyText}
            onStartConversation={startConversation}
            onSkipToConversation={() => setStep(4)}
            onPrev={() => setStep(2)}
          />
        ) : null}

        {step === 4 ? (
          <ConversationStep
            story={displayStory}
            conversation={conversation}
            levelAdjustedQuestion={levelAdjustedQuestion}
            latestKananaMessage={latestKananaMessage}
            lastFeedbackText={lastFeedbackText}
            chatEndRef={chatEndRef}
            draftAnswerText={draftAnswerText}
            onDraftAnswerTextChange={setDraftAnswerText}
            isSendingTurn={isSendingTurn}
            onSendAnswer={handleSendAnswer}
            onFinishConversation={finishConversation}
            onViewReport={() => setStep(5)}
            onPrev={() => setStep(3)}
            onStartConversation={startConversation}
            onSpeakText={(text) => {
              void speakWithFallback(text);
            }}
            onToggleRecording={handleToggleRecording}
            isRecording={recorder.isRecording}
            recorderError={recorder.error}
            audioUrl={recorder.audioUrl}
            isSpeechRecognitionSupported={speechRecognition.isSupported}
            isSpeechListening={speechRecognition.isListening}
            speechError={speechRecognition.error}
          />
        ) : null}

        {step === 5 ? (
          <ParentReportStep
            report={report}
            selectedReadingLevel={selectedReadingLevel}
            isGeneratingReport={isGeneratingReport}
            onGenerateReport={generateReport}
            onCopyReport={() => {
              void copyReport();
            }}
            isCopied={isCopied}
            onBackToConversation={() => setStep(4)}
            onResetSession={() => {
              setStep(1);
              resetSessionStates();
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
