export default function MacroTargetBar({
  label,
  actual,
  target,
  unit,
  color,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-text-muted">
          {Math.round(actual)} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
