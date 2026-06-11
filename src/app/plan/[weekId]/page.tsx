"use client";

import { useState, useEffect, useCallback, use } from "react";
import WeekGrid from "@/components/plan/WeekGrid";
import type { Meal } from "@/db/schema";

interface SlotWithMeal {
  id: number;
  planId: number;
  dayOfWeek: number;
  mealType: string;
  mealId: number | null;
  slotOrder: number | null;
  meal: Meal | null;
}

interface PlanData {
  id: number;
  weekStart: string;
  notes: string | null;
  slots: SlotWithMeal[];
}

export default function HistoricalPlanPage({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = use(params);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  const fetchPlan = useCallback(async () => {
    const res = await fetch(`/api/plans/${weekId}`);
    setPlan(await res.json());
  }, [weekId]);

  useEffect(() => {
    fetchPlan();
    fetch("/api/meals").then((r) => r.json()).then(setMeals);
  }, [fetchPlan]);

  const assignMeal = async (dayOfWeek: number, mealType: string, mealId: number | null) => {
    if (!plan) return;
    await fetch(`/api/plans/${plan.id}/slots`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, mealType, mealId }),
    });
    fetchPlan();
  };

  if (!plan) return <div className="text-center py-12 text-text-muted">Loading...</div>;

  const start = new Date(plan.weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Week of {start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </h1>
      <p className="text-sm text-text-muted mb-6">
        {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
        {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <WeekGrid slots={plan.slots} meals={meals} weekStart={plan.weekStart} onAssign={assignMeal} />
    </div>
  );
}
