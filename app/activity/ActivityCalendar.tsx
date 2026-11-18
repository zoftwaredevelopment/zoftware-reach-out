import Link from "next/link";

interface ActivityCalendarProps {
  year: number;
  monthIndex: number;
  dayCounts: Record<string, number>;
  selectedDay: string | null;
  monthParam: string;
}

export function ActivityCalendar({
  year,
  monthIndex,
  dayCounts,
  selectedDay,
  monthParam,
}: ActivityCalendarProps) {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<{ key: string; day: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ key: `pad-${i}`, day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ key, day: d });
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map((w) => (
          <div key={w} className="text-xs font-medium text-gray-500 text-center py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          if (cell.day == null) {
            return <div key={cell.key} className="min-h-[72px]" />;
          }
          const count = dayCounts[cell.key] || 0;
          const isSelected = selectedDay === cell.key;
          const hasActivity = count > 0;

          return (
            <Link
              key={cell.key}
              href={
                hasActivity
                  ? `/activity?month=${monthParam}&day=${cell.key}`
                  : `/activity?month=${monthParam}`
              }
              className={`min-h-[72px] rounded border p-2 flex flex-col items-start transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : hasActivity
                    ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                    : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium text-gray-800">{cell.day}</span>
              {hasActivity && (
                <span className="mt-auto text-lg font-bold text-amber-700">{count}</span>
              )}
              {hasActivity && (
                <span className="text-[10px] text-amber-600">
                  msg{count === 1 ? "" : "s"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
