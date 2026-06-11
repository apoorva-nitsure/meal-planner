"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import MealForm from "@/components/meals/MealForm";
import type { Meal, Ingredient } from "@/db/schema";

type MealWithIngredients = Meal & { ingredients: Ingredient[] };

export default function MealDetailPage({ params }: { params: Promise<{ mealId: string }> }) {
  const { mealId } = use(params);
  const router = useRouter();
  const [meal, setMeal] = useState<MealWithIngredients | null>(null);

  useEffect(() => {
    fetch(`/api/meals/${mealId}`)
      .then((r) => r.json())
      .then(setMeal);
  }, [mealId]);

  const handleSave = async (data: Record<string, unknown>) => {
    await fetch(`/api/meals/${mealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.push("/meals");
  };

  if (!meal) return <div className="text-center py-12 text-text-muted">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit: {meal.name}</h1>
      <MealForm meal={meal} onSave={handleSave} />
    </div>
  );
}
