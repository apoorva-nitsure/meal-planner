"use client";

import { useState, useEffect, useCallback } from "react";
import MealList from "@/components/meals/MealList";
import MealForm from "@/components/meals/MealForm";
import type { Meal, Ingredient } from "@/db/schema";

type MealWithIngredients = Meal & { ingredients: Ingredient[] };

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealWithIngredients | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const fetchMeals = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/meals?${params}`);
    setMeals(await res.json());
  }, [search, category]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleEdit = async (mealId: number) => {
    const res = await fetch(`/api/meals/${mealId}`);
    setSelectedMeal(await res.json());
    setShowForm(true);
  };

  const handleDelete = async (mealId: number) => {
    if (!confirm("Delete this meal?")) return;
    await fetch(`/api/meals/${mealId}`, { method: "DELETE" });
    fetchMeals();
  };

  const handleSave = async (data: Record<string, unknown>) => {
    if (selectedMeal) {
      await fetch(`/api/meals/${selectedMeal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowForm(false);
    setSelectedMeal(null);
    fetchMeals();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meals</h1>
        <button
          onClick={() => {
            setSelectedMeal(null);
            setShowForm(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Add Meal
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search meals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <MealList meals={meals} onEdit={handleEdit} onDelete={handleDelete} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedMeal ? "Edit Meal" : "Add Meal"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedMeal(null);
                }}
                className="text-text-muted hover:text-text text-xl"
              >
                &times;
              </button>
            </div>
            <MealForm meal={selectedMeal} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
}
