import type { Meal } from "@/db/schema";

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumMacros(meals: (Meal | null)[]): MacroTotals {
  return meals.reduce(
    (acc, meal) => {
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
}

export function macroPercentage(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 100);
}
