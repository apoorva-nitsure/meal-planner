"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DailyData {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function DailyMacroChart({
  data,
  targets,
}: {
  data: DailyData[];
  targets: { calories: number; protein: number; carbs: number; fat: number };
}) {
  if (data.every((d) => d.calories === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        No meals assigned yet. Add meals to your plan to see macro data.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <ReferenceLine y={targets.protein} stroke="#3b82f6" strokeDasharray="3 3" label="" />
          <Bar dataKey="protein" fill="#3b82f6" name="Protein (g)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="carbs" fill="#f59e0b" name="Carbs (g)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="fat" fill="#ef4444" name="Fat (g)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
