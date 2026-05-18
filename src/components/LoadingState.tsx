interface LoadingStateProps {
  message: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
      {message}
    </div>
  );
}
