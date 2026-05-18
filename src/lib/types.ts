export type ChildLevel = "beginner" | "standard" | "advanced";
export type ReadingLevel = "basic" | "standard" | "advanced";

export const CHILD_LEVEL_OPTIONS: { value: ChildLevel; label: string; description: string }[] = [
  {
    value: "beginner",
    label: "기초",
    description: "아주 짧고 쉬운 문장",
  },
  {
    value: "standard",
    label: "표준",
    description: "짧은 원인-결과 설명",
  },
  {
    value: "advanced",
    label: "심화",
    description: "감정 이유를 조금 더 자세히",
  },
];

export interface StoryAnalysisResult {
  extractedText: string;
  sceneDescription: string;
  easyText: string;
  emotion: string;
  emotionReason: string;
  childQuestion: string;
  hint: string;
  activity: string;
}

export interface StoryAnalysisInput {
  apiKey: string;
  imageBase64: string;
  childLevel: ChildLevel;
  ocrCorrectionText?: string;
  sceneCorrectionText?: string;
}

export interface LevelAdaptation {
  level: ReadingLevel;
  title: string;
  description: string;
  adaptedText: string;
}

export interface LevelAdaptationInput {
  apiKey: string;
  extractedText: string;
  storyTitle: string;
  storyDescription: string;
  readingLevel: ReadingLevel;
}

export type ConversationRole = "kanana" | "child";

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  text: string;
  createdAt: string;
}

export interface ConversationState {
  messages: ConversationMessage[];
  currentQuestion: string;
  turnCount: number;
  isFinished: boolean;
}

export interface ConversationTurnInput {
  apiKey: string;
  childLevel: ChildLevel;
  selectedReadingLevel?: ReadingLevel;
  selectedLevelText?: string;
  analysis: StoryAnalysisResult;
  conversationMessages: ConversationMessage[];
  currentQuestion: string;
  childAnswerText: string;
  turnCount: number;
  audioBase64?: string;
  audioFormat?: string;
}

export interface ConversationTurnResult {
  feedbackForChild: string;
  nextQuestion: string;
  parentObservation: string;
  shouldContinue: boolean;
}

export interface ConversationTurnResponse {
  result: ConversationTurnResult;
  transcriptFromAudio?: string;
  usedAudioInput: boolean;
  usedTextFallback: boolean;
}

export interface ParentReportInput {
  apiKey: string;
  storyTitle?: string;
  selectedReadingLevel?: ReadingLevel;
  selectedLevelText?: string;
  analysis: StoryAnalysisResult;
  conversationMessages: ConversationMessage[];
  parentObservations: string[];
}

export interface ParentReportResult {
  sessionSummary: string;
  readingLevelUsed?: string;
  childAnswerSummary: string;
  childStrength: string;
  nextGuide: string;
  recommendedQuestions: string[];
  notice: string;
  // Backward-compatible optional fields.
  extractedOriginalText?: string;
  easyTextUsed?: string;
  childAnswer?: string;
  difficulty?: string;
}

export interface TtsInput {
  apiKey: string;
  text: string;
}

export interface TtsResult {
  text: string;
  audioDataUrl: string | null;
}

export type KananaAction =
  | "analyze_story"
  | "adapt_level_text"
  | "conversation_turn"
  | "parent_report"
  | "tts";

export interface StoryLibraryItem {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  themes: string[];
  levelFallbackTexts: Record<ReadingLevel, string>;
  intendedScene: string;
  intendedText: string;
  fallbackData?: StoryAnalysisResult;
}

export type SampleStoryData = StoryLibraryItem;
export type StoryBook = StoryLibraryItem;
