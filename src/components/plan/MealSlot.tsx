"use client";

import { useState } from "react";
import type { Meal, Ingredient } from "@/db/schema";

export default function MealSlot({
  meal,
  onClick,
  onClear,
  label,
}: {
  meal: Meal | null;
  onClick: () => void;
  onClear: () => void;
  label?: string;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);

  const loadIngredients = async () => {
    if (!meal || ingredients) return;
    const res = await fetch(`/api/meals/${meal.id}`);
    const data = await res.json();
    setIngredients(data.ingredients || []);
  };

  if (!meal) {
    return (
      <button
        onClick={onClick}
        className={`border border-dashed border-border rounded p-2 flex items-center text-text-muted hover:bg-surface-hover hover:border-primary transition-colors text-sm h-full justify-center ${
          label ? "!h-auto gap-2 !justify-start" : ""
        }`}
      >
        {label && <span className="text-xs font-medium capitalize text-text-muted w-16">{label}</span>}
        <span>+</span>
      </button>
    );
  }

  return (
    <div
      className={`bg-surface border border-border rounded p-2 relative group h-full flex flex-col justify-center ${
        label ? "!h-auto !flex-row items-center gap-2" : ""
      }`}
      onMouseEnter={() => { loadIngredients(); setShowDetail(true); }}
      onMouseLeave={() => setShowDetail(false)}
    >
      {label && <span className="text-xs font-medium capitalize text-text-muted w-16 shrink-0">{label}</span>}
      <div className={`min-w-0 overflow-hidden ${label ? "flex-1" : "text-center"}`}>
      <p className="text-sm font-medium leading-snug mb-1 line-clamp-2">{meal.name}</p>
      <div className="text-xs text-text-muted">
        <span className="text-calories font-medium">{Math.round(meal.calories || 0)} cal</span>
        <br />
        <span className="text-protein">{Math.round(meal.proteinG || 0)}P</span>{" "}
        <span className="text-carbs">{Math.round(meal.carbsG || 0)}C</span>{" "}
        <span className="text-fat">{Math.round(meal.fatG || 0)}F</span>
      </div>

      {/* Hover detail tooltip */}
      {showDetail && ingredients && ingredients.length > 0 && (
        <div className="absolute z-30 left-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg p-3 w-56">
          <p className="text-[11px] font-semibold mb-1.5">{meal.name}</p>
          <div className="space-y-1">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex justify-between text-[10px]">
                <span className="text-text truncate mr-2">{ing.name}</span>
                <span className="text-text-muted whitespace-nowrap">
                  <span className="text-protein">{Number(ing.proteinG || 0).toFixed(1)}P</span>
                  {" "}
                  <span className="text-carbs">{Number(ing.carbsG || 0).toFixed(1)}C</span>
                  {" "}
                  <span className="text-fat">{Number(ing.fatG || 0).toFixed(1)}F</span>
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-1.5 pt-1.5 flex justify-between text-[10px] font-medium">
            <span>Total</span>
            <span>
              <span className="text-protein">{Number(meal.proteinG || 0).toFixed(1)}P</span>
              {" "}
              <span className="text-carbs">{Number(meal.carbsG || 0).toFixed(1)}C</span>
              {" "}
              <span className="text-fat">{Number(meal.fatG || 0).toFixed(1)}F</span>
            </span>
          </div>
        </div>
      )}

      </div>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button
          onClick={onClick}
          className="text-[10px] bg-surface border border-border rounded px-1 hover:bg-surface-hover"
          title="Change"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-[10px] bg-surface border border-border rounded px-1 hover:bg-red-50 text-danger"
          title="Remove"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
