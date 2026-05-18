import StoryCard from "@/components/StoryCard";
import { StoryLibraryItem } from "@/lib/types";

interface StorySelectStepProps {
  stories: StoryLibraryItem[];
  selectedStoryId: string | null;
  onSelectStory: (storyId: string) => void;
  onNext: () => void;
  hasSelectedStory: boolean;
}

export default function StorySelectStep({
  stories,
  selectedStoryId,
  onSelectStory,
  onNext,
  hasSelectedStory,
}: StorySelectStepProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">오늘 읽을 그림책을 골라볼까요?</h2>
      <p className="mt-1 text-sm text-slate-600">읽고 싶은 이야기를 하나 골라주세요.</p>
      <p className="mt-1 text-xs text-slate-500">책을 골라야 다음 단계로 갈 수 있어요.</p>

      <div className="mt-4 space-y-3">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            isSelected={selectedStoryId === story.id}
            onSelect={() => onSelectStory(story.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasSelectedStory}
        aria-label="선택한 책으로 다음 단계 이동"
        className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        선택하고 다음으로
      </button>
    </section>
  );
}
