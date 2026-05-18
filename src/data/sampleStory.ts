import { StoryAnalysisResult, StoryLibraryItem } from "@/lib/types";

export const DEFAULT_FALLBACK_ANALYSIS: StoryAnalysisResult = {
  extractedText:
    "토끼는 친구들이 자기만 두고 간 줄 알고 슬퍼했어요. 비가 와서 더 외롭고 속상했어요. '나는 왜 혼자일까?' 토끼는 울고 싶었어요.",
  sceneDescription:
    "비 오는 숲속에서 토끼가 나무 아래에 혼자 앉아 있고, 친구들은 우산을 쓰고 멀리 걸어가고 있습니다.",
  easyText: "토끼는 친구들이 없어진 줄 알았어요. 그래서 마음이 슬펐어요.",
  emotion: "슬픔",
  emotionReason: "친구들이 자기만 두고 갔다고 생각했기 때문이에요.",
  childQuestion: "토끼는 왜 슬펐을까요?",
  hint: "친구들이 어디 갔는지 생각해 봐요.",
  activity: "슬픈 표정 따라하기",
};

export const MONKEY_FALLBACK_ANALYSIS: StoryAnalysisResult = {
  extractedText:
    "원숭이는 나무 위에서 신나게 흔들흔들 놀았어요. 친구들이 '와아! 멋지다!' 하고 박수를 쳤어요. 원숭이는 더 용기가 나서 더 높이, 더 멋지게 흔들렸어요.",
  sceneDescription:
    "햇살이 비치는 숲에서 원숭이가 덩굴을 타고 즐겁게 놀고 있고, 동물 친구들이 웃으며 응원하고 있습니다.",
  easyText: "원숭이는 친구들 응원을 듣고 신이 났어요. 그래서 더 용감하게 도전했어요.",
  emotion: "기쁨",
  emotionReason: "친구들이 크게 응원해줘서 자신감이 생겼기 때문이에요.",
  childQuestion: "원숭이는 왜 더 용감해졌을까요?",
  hint: "친구들이 뭐라고 말했는지 떠올려봐요.",
  activity: "응원 박수 따라하기",
};

export const HAYUL_FALLBACK_ANALYSIS: StoryAnalysisResult = {
  extractedText:
    "하율이는 내일 발표를 해야 했어요. 하율이는 열심히 준비했지만, 실수할까 봐 걱정이 되었어요. 발표 연습을 할 때마다 목소리가 작아지고, 손이 떨렸어요. 그때 엄마가 다가와 하율이를 안아주며 말했어요. '괜찮아. 네가 노력한 만큼 잘할 수 있어. 엄마는 항상 너를 응원해.' 하율이는 엄마의 말을 들으며 천천히 마음을 다잡고, 다시 연습을 시작했어요.",
  sceneDescription:
    "발표를 앞두고 걱정하는 하율이가 책상에 앉아 준비하다가, 엄마의 따뜻한 응원으로 마음을 가다듬고 다시 연습을 시작하는 장면",
  easyText:
    "하율이는 발표가 걱정됐어요. 그런데 엄마가 안아주고 응원해줬어요. 하율이는 용기를 내서 다시 연습했어요.",
  emotion: "걱정과 용기",
  emotionReason: "실수할까 봐 불안했지만, 엄마의 위로와 응원 덕분에 다시 도전할 힘이 생겼기 때문이에요.",
  childQuestion: "하율이는 왜 걱정됐을까요?",
  hint: "발표 전에 어떤 마음이 들었는지 떠올려봐요.",
  activity: "응원 문장 말해보기",
};

export const STORY_LIBRARY: StoryLibraryItem[] = [
  {
    id: "dadokdadok-story-1",
    title: "토끼 이야기",
    description: "비 오는 날, 토끼가 친구들을 기다리는 이야기",
    imagePath: "/samples/dadokdadok-story-1.png",
    themes: ["슬픔", "외로움", "친구 관계"],
    levelFallbackTexts: {
      basic: "토끼는 혼자라고 생각했어요. 그래서 슬펐어요.",
      standard: "토끼는 친구들이 자기만 두고 간 줄 알았어요. 그래서 외롭고 슬펐어요.",
      advanced: "토끼는 친구들이 자기만 두고 떠났다고 생각했어요. 비까지 내리자 마음이 더 외롭고 속상해졌어요.",
    },
    intendedScene:
      "비 오는 숲속에서 토끼가 나무 아래에 혼자 앉아 있고, 친구들은 우산을 쓰고 멀리 걸어가고 있다.",
    intendedText:
      "토끼는 친구들이 자기만 두고 간 줄 알고 슬퍼했어요. 비가 와서 더 외롭고 속상했어요. '나는 왜 혼자일까?' 토끼는 울고 싶었어요.",
    fallbackData: DEFAULT_FALLBACK_ANALYSIS,
  },
  {
    id: "dadokdadok-story-2",
    title: "원숭이 이야기",
    description: "원숭이가 친구들과 신나게 놀며 용기를 얻는 이야기",
    imagePath: "/samples/dadokdadok-story-2.png",
    themes: ["기쁨", "자신감", "도전", "응원"],
    levelFallbackTexts: {
      basic: "원숭이는 신나게 놀았어요. 친구들이 응원했어요.",
      standard: "원숭이는 덩굴을 타며 신나게 놀았어요. 친구들이 응원해줘서 더 기뻤어요.",
      advanced: "원숭이는 친구들의 응원을 들으며 용기를 냈어요. 그래서 더 높이, 더 자신 있게 덩굴을 흔들 수 있었어요.",
    },
    intendedScene:
      "숲속에서 원숭이가 덩굴을 타고 신나게 흔들고, 동물 친구들이 웃으며 박수치고 응원하는 장면",
    intendedText:
      "원숭이는 나무 위에서 신나게 흔들흔들 놀았어요. 친구들이 '와아! 멋지다!' 하고 박수를 쳤어요. 원숭이는 더 용기가 나서 더 높이, 더 멋지게 흔들렸어요.",
    fallbackData: MONKEY_FALLBACK_ANALYSIS,
  },
  {
    id: "dadokdadok-story-3",
    title: "하율 이야기",
    description: "발표 준비를 하며 걱정하던 하율이가 엄마의 응원을 통해 다시 용기를 내는 이야기",
    imagePath: "/samples/dadokdadok-story-3.png",
    themes: ["걱정", "불안", "위로", "용기", "노력"],
    levelFallbackTexts: {
      basic: "하율이는 발표가 걱정됐어요. 엄마가 응원해줘서 다시 해봤어요.",
      standard:
        "하율이는 발표를 앞두고 긴장했어요. 엄마가 따뜻하게 응원해주자 마음이 편해졌고 다시 연습했어요.",
      advanced:
        "하율이는 실수할까 걱정되어 목소리와 손이 떨렸어요. 하지만 엄마의 위로와 응원 덕분에 마음을 다잡고 다시 연습을 이어갔어요.",
    },
    intendedScene:
      "밤에 책상 앞에서 발표를 준비하던 하율이가 걱정하다가, 엄마의 응원을 떠올리며 다시 용기를 내는 장면",
    intendedText:
      "하율이는 내일 발표를 해야 했어요. 하율이는 열심히 준비했지만, 실수할까 봐 걱정이 되었어요. 발표 연습을 할 때마다 목소리가 작아지고, 손이 떨렸어요. 그때 엄마가 다가와 하율이를 안아주며 말했어요. '괜찮아. 네가 노력한 만큼 잘할 수 있어. 엄마는 항상 너를 응원해.' 하율이는 엄마의 말을 들으며 천천히 마음을 다잡고, 다시 연습을 시작했어요.",
    fallbackData: HAYUL_FALLBACK_ANALYSIS,
  },
];

export const DEFAULT_STORY = STORY_LIBRARY[0];
