import Image from "next/image";

import { StoryLibraryItem } from "@/lib/types";

interface StoryCardProps {
  story: StoryLibraryItem;
  isSelected: boolean;
  onSelect: () => void;
}

export default function StoryCard({ story, isSelected, onSelect }: StoryCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white transition ${
        isSelected ? "border-slate-900 ring-2 ring-slate-200" : "border-slate-200"
      }`}
    >
      <Image src={story.imagePath} alt={`${story.title} 표지`} width={1200} height={800} className="h-52 w-full object-cover" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold">{story.title}</h3>
          {isSelected ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">선택됨</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-600">{story.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {story.themes.map((theme) => (
            <span key={`${story.id}-${theme}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {theme}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onSelect}
          aria-label={`${story.title} 선택`}
          className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-bold ${
            isSelected ? "border border-slate-200 bg-slate-50 text-slate-800" : "bg-slate-900 text-white"
          }`}
        >
          {isSelected ? "이 책 선택 완료" : "이 책 고르기"}
        </button>
      </div>
    </article>
  );
}
