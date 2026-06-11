"use client";

import { useState } from "react";
import type { Meal } from "@/db/schema";

export default function MealPicker({
  meals,
  mealType,
  onSelect,
  onClose,
}: {
  meals: Meal[];
  mealType: string;
  onSelect: (mealId: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = meals.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Sort: matching category first (category can be comma-separated)
  const sorted = [...filtered].sort((a, b) => {
    const aMatch = a.category.split(",").includes(mealType);
    const bMatch = b.category.split(",").includes(mealType);
    if (aMatch && !bMatch) return -1;
    if (bMatch && !aMatch) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-surface rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Choose a meal</h3>
            <button onClick={onClose} className="text-text-muted hover:text-text text-xl">
              &times;
            </button>
          </div>
          <input
            type="text"
            placeholder="Search meals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No meals found</p>
          ) : (
            sorted.map((meal) => (
              <button
                key={meal.id}
                onClick={() => onSelect(meal.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-surface-hover transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-text-muted capitalize">{meal.category.split(",").join(", ")}</p>
                </div>
                <div className="text-xs text-text-muted flex gap-2">
                  <span className="text-calories">{Math.round(meal.calories || 0)} cal</span>
                  <span className="text-protein">{Number(meal.proteinG || 0).toFixed(1)}P</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
