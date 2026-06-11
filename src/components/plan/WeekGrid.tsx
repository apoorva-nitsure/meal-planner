"use client";

import React, { useState } from "react";
import MealSlot from "./MealSlot";
import MealPicker from "./MealPicker";
import { DAY_NAMES, MEAL_TYPES, getWeekDates, formatShortDate } from "@/lib/week-utils";
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

const mealTypeLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function WeekGrid({
  slots,
  meals,
  weekStart,
  onAssign,
}: {
  slots: SlotWithMeal[];
  meals: Meal[];
  weekStart: string;
  onAssign: (dayOfWeek: number, mealType: string, mealId: number | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState<{ day: number; type: string } | null>(null);
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay()); // 0=Sun
  const weekDates = getWeekDates(weekStart);

  const getSlotMeal = (day: number, type: string): Meal | null => {
    const slot = slots.find((s) => s.dayOfWeek === day && s.mealType === type);
    return slot?.meal || null;
  };

  // Calculate daily totals for a day
  const getDayTotals = (day: number) => {
    return MEAL_TYPES.reduce(
      (acc, type) => {
        const meal = getSlotMeal(day, type);
        if (!meal) return acc;
        return {
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.proteinG || 0),
          carbs: acc.carbs + (meal.carbsG || 0),
          fat: acc.fat + (meal.fatG || 0),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView("day")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === "day" ? "bg-primary text-white" : "border border-border hover:bg-surface-hover"
          }`}
        >
          Day View
        </button>
        <button
          onClick={() => setView("week")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === "week" ? "bg-primary text-white" : "border border-border hover:bg-surface-hover"
          }`}
        >
          Week View
        </button>
      </div>

      {view === "day" ? (
        <>
          {/* Day selector tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {DAY_NAMES.map((day, i) => {
              const hasSlots = MEAL_TYPES.some((t) => getSlotMeal(i, t));
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(i)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 min-w-[52px] ${
                    selectedDay === i
                      ? "bg-primary text-white"
                      : "border border-border hover:bg-surface-hover"
                  }`}
                >
                  <span>{day}</span>
                  <span className={`text-[10px] ${selectedDay === i ? "text-white/80" : "text-text-muted"}`}>
                    {formatShortDate(weekDates[i])}
                  </span>
                  {hasSlots && selectedDay !== i && (
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day meals */}
          <div className="space-y-3">
            {MEAL_TYPES.map((type) => {
              const meal = getSlotMeal(selectedDay, type);
              return (
                <div
                  key={type}
                  className="bg-surface border border-border rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-text-muted">{mealTypeLabels[type]}</h3>
                    {meal && (
                      <button
                        onClick={() => onAssign(selectedDay, type, null)}
                        className="text-[10px] text-danger hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {meal ? (
                    <div
                      className="cursor-pointer hover:bg-surface-hover rounded-lg p-2 -m-1 transition-colors"
                      onClick={() => setPickerOpen({ day: selectedDay, type })}
                    >
                      <p className="font-medium text-sm mb-1">{meal.name}</p>
                      <div className="flex gap-3 text-xs">
                        <span className="text-calories font-medium">{Math.round(meal.calories || 0)} cal</span>
                        <span className="text-protein">{Number(meal.proteinG || 0).toFixed(1)}g P</span>
                        <span className="text-carbs">{Number(meal.carbsG || 0).toFixed(1)}g C</span>
                        <span className="text-fat">{Number(meal.fatG || 0).toFixed(1)}g F</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPickerOpen({ day: selectedDay, type })}
                      className="w-full border border-dashed border-border rounded-lg py-4 text-text-muted hover:bg-surface-hover hover:border-primary transition-colors text-sm"
                    >
                      + Add {mealTypeLabels[type]}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Day totals */}
            {(() => {
              const totals = getDayTotals(selectedDay);
              if (totals.calories === 0) return null;
              return (
                <div className="bg-gray-50 border border-border rounded-xl p-3">
                  <h3 className="text-xs font-semibold text-text-muted mb-2">Daily Total</h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-calories">{Math.round(totals.calories)}</p>
                      <p className="text-[10px] text-text-muted">Cal</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-protein">{totals.protein.toFixed(1)}g</p>
                      <p className="text-[10px] text-text-muted">Protein</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-carbs">{totals.carbs.toFixed(1)}g</p>
                      <p className="text-[10px] text-text-muted">Carbs</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-fat">{totals.fat.toFixed(1)}g</p>
                      <p className="text-[10px] text-text-muted">Fat</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        /* Week grid view */
        <div className="h-[calc(100vh-180px)]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] grid-rows-[auto_1fr_1fr_1fr_1fr] gap-1 h-full">
            {/* Header row */}
            <div />
            {DAY_NAMES.map((day, i) => (
              <div key={day} className="text-center py-1">
                <div className="text-xs font-semibold text-text-muted">{day}</div>
                <div className="text-[10px] text-text-muted">{formatShortDate(weekDates[i])}</div>
              </div>
            ))}

            {/* Meal type rows */}
            {MEAL_TYPES.map((type) => (
              <React.Fragment key={type}>
                <div
                  className="flex items-center justify-center text-xs font-semibold capitalize text-text-muted"
                >
                  {type}
                </div>
                {Array.from({ length: 7 }, (_, day) => (
                  <MealSlot
                    key={`${type}-${day}`}
                    meal={getSlotMeal(day, type)}
                    onClick={() => setPickerOpen({ day, type })}
                    onClear={() => onAssign(day, type, null)}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {pickerOpen && (
        <MealPicker
          meals={meals}
          mealType={pickerOpen.type}
          onSelect={(mealId) => {
            onAssign(pickerOpen.day, pickerOpen.type, mealId);
            setPickerOpen(null);
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </>
  );
}
