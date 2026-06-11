import { getWeekDates } from "@/lib/week-utils";

export default function WeekNavigator({
  weekStart,
  onNavigate,
  onToday,
}: {
  weekStart: string;
  onNavigate: (direction: number) => void;
  onToday: () => void;
}) {
  const dates = getWeekDates(weekStart);
  const startStr = dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = dates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onNavigate(-1)}
        className="px-2 py-1 border border-border rounded-lg hover:bg-surface-hover text-sm"
      >
        &larr;
      </button>
      <div className="text-sm font-medium min-w-[180px] text-center">
        {startStr} - {endStr}
      </div>
      <button
        onClick={() => onNavigate(1)}
        className="px-2 py-1 border border-border rounded-lg hover:bg-surface-hover text-sm"
      >
        &rarr;
      </button>
      <button
        onClick={onToday}
        className="text-xs text-primary hover:underline ml-2"
      >
        Today
      </button>
    </div>
  );
}
