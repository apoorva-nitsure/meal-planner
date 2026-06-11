"use client";

import { useState } from "react";
import { DAY_NAMES, MEAL_TYPES } from "@/lib/week-utils";
import type { Meal } from "@/db/schema";

interface MealSuggestion {
  dayOfWeek: number;
  mealType: string;
  mealId: number;
  reasoning: string;
}

interface SuggestionResponse {
  plan: MealSuggestion[];
  summary: string;
}

export default function SuggestionReview({
  suggestion,
  meals,
  onAccept,
  onCancel,
}: {
  suggestion: SuggestionResponse;
  meals: Meal[];
  onAccept: (slots: { dayOfWeek: number; mealType: string; mealId: number }[]) => void;
  onCancel: () => void;
}) {
  const [accepted, setAccepted] = useState<Set<string>>(
    new Set(suggestion.plan.map((s) => `${s.dayOfWeek}-${s.mealType}`))
  );

  const toggleSlot = (key: string) => {
    const next = new Set(accepted);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setAccepted(next);
  };

  const getMeal = (mealId: number) => meals.find((m) => m.id === mealId);
  const getSuggestion = (day: number, type: string) =>
    suggestion.plan.find((s) => s.dayOfWeek === day && s.mealType === type);

  const handleAccept = () => {
    const slots = suggestion.plan
      .filter((s) => accepted.has(`${s.dayOfWeek}-${s.mealType}`))
      .map((s) => ({ dayOfWeek: s.dayOfWeek, mealType: s.mealType, mealId: s.mealId }));
    onAccept(slots);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI Suggested Plan</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAccepted(new Set(suggestion.plan.map((s) => `${s.dayOfWeek}-${s.mealType}`)));
              }}
              className="text-xs text-primary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={() => setAccepted(new Set())}
              className="text-xs text-text-muted hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>

        <p className="text-sm text-text-muted mb-4">{suggestion.summary}</p>

        <div className="overflow-x-auto mb-4">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 min-w-[800px]">
            <div />
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-xs font-semibold py-1 text-text-muted">
                {day}
              </div>
            ))}

            {MEAL_TYPES.map((type) => (
              <>
                <div key={`label-${type}`} className="flex items-center text-xs font-medium capitalize text-text-muted">
                  {type}
                </div>
                {Array.from({ length: 7 }, (_, day) => {
                  const s = getSuggestion(day, type);
                  const meal = s ? getMeal(s.mealId) : null;
                  const key = `${day}-${type}`;
                  const isAccepted = accepted.has(key);

                  return (
                    <button
                      key={key}
                      onClick={() => s && toggleSlot(key)}
                      className={`border rounded-lg p-2 min-h-[60px] text-left transition-colors ${
                        isAccepted
                          ? "border-primary bg-green-50"
                          : "border-border bg-gray-50 opacity-50"
                      }`}
                    >
                      {meal ? (
                        <>
                          <p className="text-[11px] font-medium leading-tight">{meal.name}</p>
                          <p className="text-[9px] text-text-muted mt-0.5">{meal.calories} cal</p>
                          {s?.reasoning && (
                            <p className="text-[9px] text-primary mt-0.5 italic">{s.reasoning}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-text-muted">-</p>
                      )}
                    </button>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={accepted.size === 0}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
          >
            Accept {accepted.size} slots
          </button>
        </div>
      </div>
    </div>
  );
}
