"use client";

import { useState } from "react";
import type { Meal, Ingredient } from "@/db/schema";

type MealWithIngredients = Meal & { ingredients?: Ingredient[] };

const categoryColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800",
  lunch: "bg-green-100 text-green-800",
  dinner: "bg-blue-100 text-blue-800",
  snack: "bg-purple-100 text-purple-800",
};

function MacroBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function MealList({
  meals,
  onEdit,
  onDelete,
}: {
  meals: MealWithIngredients[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loadedIngredients, setLoadedIngredients] = useState<Record<number, Ingredient[]>>({});

  const toggleExpand = async (mealId: number) => {
    if (expanded === mealId) {
      setExpanded(null);
      return;
    }
    // Fetch full meal with ingredients if not already loaded
    if (!loadedIngredients[mealId]) {
      const res = await fetch(`/api/meals/${mealId}`);
      const data = await res.json();
      setLoadedIngredients((prev) => ({ ...prev, [mealId]: data.ingredients || [] }));
    }
    setExpanded(mealId);
  };

  if (!meals.length) {
    return <p className="text-text-muted text-center py-12">No meals found. Add your first meal!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {meals.map((meal) => {
        const isExpanded = expanded === meal.id;
        const ingredients = loadedIngredients[meal.id] || [];

        return (
          <div
            key={meal.id}
            className="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">{meal.name}</h3>
              <div className="flex gap-1 flex-wrap">
                {meal.category.split(",").map((cat) => (
                  <span
                    key={cat}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      categoryColors[cat] || ""
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Total macros */}
            <div className="flex gap-3 text-xs text-text-muted mb-2">
              <span className="text-calories font-medium">{Math.round(meal.calories || 0)} cal</span>
              <span className="text-protein font-medium">{Number(meal.proteinG || 0).toFixed(1)}g P</span>
              <span className="text-carbs font-medium">{Number(meal.carbsG || 0).toFixed(1)}g C</span>
              <span className="text-fat font-medium">{Number(meal.fatG || 0).toFixed(1)}g F</span>
            </div>

            {meal.prepTimeMin && (
              <p className="text-xs text-text-muted mb-2">{meal.prepTimeMin} min prep</p>
            )}

            {/* Expand/collapse button */}
            <button
              onClick={() => toggleExpand(meal.id)}
              className="text-xs text-primary hover:underline mb-2 flex items-center gap-1"
            >
              <span className="text-[10px]">{isExpanded ? "▼" : "▶"}</span>
              {isExpanded ? "Hide breakdown" : "Show macro breakdown"}
            </button>

            {/* Ingredient-level macro breakdown */}
            {isExpanded && ingredients.length > 0 && (
              <div className="border-t border-border pt-2 mt-1 space-y-2">
                {ingredients.map((ing) => {
                  const ingCal = ing.calories || 0;
                  const ingP = ing.proteinG || 0;
                  const ingC = ing.carbsG || 0;
                  const ingF = ing.fatG || 0;
                  const mealCal = meal.calories || 1;
                  const mealP = meal.proteinG || 1;
                  const mealC = meal.carbsG || 1;
                  const mealF = meal.fatG || 1;

                  return (
                    <div key={ing.id} className="text-xs">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-medium text-text truncate mr-2">
                          {ing.name}
                          <span className="text-text-muted font-normal ml-1">
                            {ing.quantity} {ing.unit}
                          </span>
                        </span>
                        <span className="text-text-muted whitespace-nowrap text-[10px]">
                          {Math.round(ingCal)} cal
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-protein">P: {Number(ingP).toFixed(1)}g</span>
                            <span className="text-text-muted">{Math.round((ingP / mealP) * 100)}%</span>
                          </div>
                          <MacroBar value={ingP} max={mealP} color="#3b82f6" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-carbs">C: {Number(ingC).toFixed(1)}g</span>
                            <span className="text-text-muted">{Math.round((ingC / mealC) * 100)}%</span>
                          </div>
                          <MacroBar value={ingC} max={mealC} color="#f59e0b" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-fat">F: {Number(ingF).toFixed(1)}g</span>
                            <span className="text-text-muted">{Math.round((ingF / mealF) * 100)}%</span>
                          </div>
                          <MacroBar value={ingF} max={mealF} color="#ef4444" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Source summary - top protein sources */}
                <div className="border-t border-dashed border-border pt-1.5 mt-1.5">
                  <p className="text-[10px] text-text-muted font-medium mb-1">Top protein sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {[...ingredients]
                      .sort((a, b) => (b.proteinG || 0) - (a.proteinG || 0))
                      .slice(0, 3)
                      .filter((i) => (i.proteinG || 0) > 0)
                      .map((ing) => (
                        <span
                          key={ing.id}
                          className="text-[10px] bg-blue-50 text-protein px-1.5 py-0.5 rounded"
                        >
                          {ing.name}: {Number(ing.proteinG || 0).toFixed(1)}g
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {isExpanded && ingredients.length === 0 && (
              <p className="text-[10px] text-text-muted border-t border-border pt-2 mt-1">
                No ingredient data. Edit this meal to add per-ingredient macros.
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={() => onEdit(meal.id)} className="text-xs text-primary hover:underline">
                Edit
              </button>
              <button onClick={() => onDelete(meal.id)} className="text-xs text-danger hover:underline">
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
