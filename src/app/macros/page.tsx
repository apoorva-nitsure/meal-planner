"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentWeekStart, shiftWeek, DAY_NAMES } from "@/lib/week-utils";
import WeekNavigator from "@/components/plan/WeekNavigator";
import DailyMacroChart from "@/components/macros/DailyMacroChart";
import WeeklyMacroSummary from "@/components/macros/WeeklyMacroSummary";
import MacroTargetBar from "@/components/macros/MacroTargetBar";
import FoodSourceBreakdown from "@/components/macros/FoodSourceBreakdown";
import type { Meal } from "@/db/schema";

interface FoodSource {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

interface SlotWithMeal {
  dayOfWeek: number;
  mealType: string;
  meal: Meal | null;
}

interface DailyData {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function MacrosPage() {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [targets, setTargets] = useState({ calories: 2200, protein: 150, carbs: 220, fat: 75 });
  const [editingTargets, setEditingTargets] = useState(false);
  const [proteinSources, setProteinSources] = useState<FoodSource[]>([]);
  const [carbSources, setCarbSources] = useState<FoodSource[]>([]);
  const [fatSources, setFatSources] = useState<FoodSource[]>([]);

  const fetchData = useCallback(async () => {
    // Get or create plan for this week
    const planRes = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
    const plan = await planRes.json();

    // Get full plan with slots
    const fullRes = await fetch(`/api/plans/${plan.id}`);
    const fullPlan = await fullRes.json();

    // Calculate daily macros
    const daily: DailyData[] = DAY_NAMES.map((day, i) => {
      const daySlots = (fullPlan.slots || []).filter((s: SlotWithMeal) => s.dayOfWeek === i);
      return {
        day,
        calories: daySlots.reduce((sum: number, s: SlotWithMeal) => sum + (s.meal?.calories || 0), 0),
        protein: daySlots.reduce((sum: number, s: SlotWithMeal) => sum + (s.meal?.proteinG || 0), 0),
        carbs: daySlots.reduce((sum: number, s: SlotWithMeal) => sum + (s.meal?.carbsG || 0), 0),
        fat: daySlots.reduce((sum: number, s: SlotWithMeal) => sum + (s.meal?.fatG || 0), 0),
      };
    });
    setDailyData(daily);

    // Fetch ingredient-level breakdown
    const breakdownRes = await fetch(`/api/plans/${plan.id}/breakdown`);
    const breakdown = await breakdownRes.json();
    setProteinSources(breakdown.proteinSources || []);
    setCarbSources(breakdown.carbSources || []);
    setFatSources(breakdown.fatSources || []);

    // Get user preferences
    const prefRes = await fetch("/api/preferences");
    const prefs = await prefRes.json();
    setTargets({
      calories: prefs.calorieTarget || 2200,
      protein: prefs.proteinTargetG || 150,
      carbs: prefs.carbsTargetG || 220,
      fat: prefs.fatTargetG || 75,
    });
  }, [weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weekTotals = dailyData.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const weeklyTargets = {
    calories: targets.calories * 7,
    protein: targets.protein * 7,
    carbs: targets.carbs * 7,
    fat: targets.fat * 7,
  };

  const avgDaily = {
    calories: Math.round(weekTotals.calories / 7),
    protein: Math.round(weekTotals.protein / 7),
    carbs: Math.round(weekTotals.carbs / 7),
    fat: Math.round(weekTotals.fat / 7),
  };

  const saveTargets = async () => {
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calorieTarget: targets.calories,
        proteinTargetG: targets.protein,
        carbsTargetG: targets.carbs,
        fatTargetG: targets.fat,
      }),
    });
    setEditingTargets(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Macro Dashboard</h1>
        <WeekNavigator
          weekStart={weekStart}
          onNavigate={(dir) => setWeekStart(shiftWeek(weekStart, dir))}
          onToday={() => setWeekStart(getCurrentWeekStart())}
        />
      </div>

      {/* Daily Targets */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Daily Targets vs Average</h2>
          <button
            onClick={() => editingTargets ? saveTargets() : setEditingTargets(true)}
            className="text-xs text-primary hover:underline"
          >
            {editingTargets ? "Save" : "Edit Targets"}
          </button>
        </div>
        {editingTargets ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium capitalize mb-1">{key}</label>
                <input
                  type="number"
                  value={targets[key]}
                  onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) })}
                  className="w-full border border-border rounded px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        ) : null}
        <div className="space-y-3">
          <MacroTargetBar label="Calories" actual={avgDaily.calories} target={targets.calories} unit="kcal" color="var(--color-calories)" />
          <MacroTargetBar label="Protein" actual={avgDaily.protein} target={targets.protein} unit="g" color="var(--color-protein)" />
          <MacroTargetBar label="Carbs" actual={avgDaily.carbs} target={targets.carbs} unit="g" color="var(--color-carbs)" />
          <MacroTargetBar label="Fat" actual={avgDaily.fat} target={targets.fat} unit="g" color="var(--color-fat)" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Daily Breakdown</h2>
          <DailyMacroChart data={dailyData} targets={targets} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Weekly Split</h2>
          <WeeklyMacroSummary totals={weekTotals} targets={weeklyTargets} />
        </div>
      </div>

      {/* Food Source Breakdown */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-4">Food Sources - Where Your Macros Come From</h2>
        <FoodSourceBreakdown
          proteinSources={proteinSources}
          carbSources={carbSources}
          fatSources={fatSources}
        />
      </div>
    </div>
  );
}
