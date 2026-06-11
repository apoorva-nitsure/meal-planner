"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#ef4444",
};

export default function WeeklyMacroSummary({
  totals,
  targets,
}: {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}) {
  const totalGrams = totals.protein + totals.carbs + totals.fat;

  if (totalGrams === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        No data yet
      </div>
    );
  }

  const data = [
    { name: "Protein", value: totals.protein, color: COLORS.protein },
    { name: "Carbs", value: totals.carbs, color: COLORS.carbs },
    { name: "Fat", value: totals.fat, color: COLORS.fat },
  ];

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${Math.round(Number(value))}g`, name]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <p className="text-lg font-bold text-calories">{Math.round(totals.calories)} kcal</p>
        <p className="text-xs text-text-muted">of {Math.round(targets.calories)} weekly target</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {data.map((d) => (
          <div key={d.name}>
            <p className="text-sm font-semibold" style={{ color: d.color }}>
              {Math.round(d.value)}g
            </p>
            <p className="text-[10px] text-text-muted">{d.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
