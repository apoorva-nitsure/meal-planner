"use client";

import { useState, useEffect, useCallback } from "react";
import WeekGrid from "@/components/plan/WeekGrid";
import WeekNavigator from "@/components/plan/WeekNavigator";
import AiSuggestButton from "@/components/ai/AiSuggestButton";
import { getCurrentWeekStart, shiftWeek } from "@/lib/week-utils";
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

export default function PlanPage() {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    // Ensure plan exists for this week
    const planRes = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
    const planData = await planRes.json();

    // Fetch full plan with slots
    const fullRes = await fetch(`/api/plans/${planData.id}`);
    setPlan(await fullRes.json());
    if (showLoading) setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchPlan();
    fetch("/api/meals")
      .then((r) => r.json())
      .then(setMeals);
  }, [fetchPlan]);

  const assignMeal = async (dayOfWeek: number, mealType: string, mealId: number | null) => {
    if (!plan) return;
    await fetch(`/api/plans/${plan.id}/slots`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, mealType, mealId }),
    });
    fetchPlan(false);
  };

  const handleAiAccept = async (slots: { dayOfWeek: number; mealType: string; mealId: number }[]) => {
    if (!plan) return;
    for (const slot of slots) {
      await fetch(`/api/plans/${plan.id}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });
    }
    fetchPlan(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Meal Plan</h1>
          <AiSuggestButton meals={meals} onAccept={handleAiAccept} />
        </div>
        <WeekNavigator
          weekStart={weekStart}
          onNavigate={(dir) => setWeekStart(shiftWeek(weekStart, dir))}
          onToday={() => setWeekStart(getCurrentWeekStart())}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading plan...</div>
      ) : plan ? (
        <WeekGrid
          slots={plan.slots}
          meals={meals}
          weekStart={weekStart}
          onAssign={assignMeal}
        />
      ) : null}
    </div>
  );
}
