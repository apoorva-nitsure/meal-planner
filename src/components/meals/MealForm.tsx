"use client";

import { useState, useMemo } from "react";
import type { Meal, Ingredient } from "@/db/schema";

type MealWithIngredients = Meal & { ingredients: Ingredient[] };

interface IngredientInput {
  name: string;
  quantity: number | "";
  unit: string;
  calories: number | "";
  proteinG: number | "";
  carbsG: number | "";
  fatG: number | "";
  groceryCategory: string;
}

const emptyIngredient: IngredientInput = {
  name: "", quantity: "", unit: "",
  calories: "", proteinG: "", carbsG: "", fatG: "",
  groceryCategory: "other",
};

export default function MealForm({
  meal,
  onSave,
}: {
  meal: MealWithIngredients | null;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(meal?.name || "");
  const [categories, setCategories] = useState<Set<string>>(
    new Set(meal?.category?.split(",") || ["breakfast"])
  );
  const [prepNotes, setPrepNotes] = useState(meal?.prepNotes || "");
  const [prepTimeMin, setPrepTimeMin] = useState<number | "">(meal?.prepTimeMin || "");
  const [servings, setServings] = useState<number>(meal?.servings || 1);
  const [ingredientsList, setIngredientsList] = useState<IngredientInput[]>(
    meal?.ingredients?.map((i) => ({
      name: i.name,
      quantity: i.quantity || "",
      unit: i.unit || "",
      calories: i.calories || "",
      proteinG: i.proteinG || "",
      carbsG: i.carbsG || "",
      fatG: i.fatG || "",
      groceryCategory: i.groceryCategory || "other",
    })) || [{ ...emptyIngredient }]
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [useHistory, setUseHistory] = useState(true);

  // Auto-sum macros from ingredients
  const totals = useMemo(() => {
    return ingredientsList.reduce(
      (acc, ing) => ({
        calories: acc.calories + (Number(ing.calories) || 0),
        protein: acc.protein + (Number(ing.proteinG) || 0),
        carbs: acc.carbs + (Number(ing.carbsG) || 0),
        fat: acc.fat + (Number(ing.fatG) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredientsList]);

  const handleAiAssist = async () => {
    if (!name.trim()) {
      setAiError("Enter a meal name or description first");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/meal-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: name, category: [...categories][0], servings, useHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      // Fill in form with AI suggestions
      if (data.name) setName(data.name);
      if (data.prepNotes) setPrepNotes(data.prepNotes);
      if (data.prepTimeMin) setPrepTimeMin(data.prepTimeMin);
      if (data.ingredients?.length) {
        setIngredientsList(
          data.ingredients.map((i: Record<string, unknown>) => ({
            name: (i.name as string) || "",
            quantity: (i.quantity as number) || "",
            unit: (i.unit as string) || "",
            calories: (i.calories as number) || "",
            proteinG: (i.proteinG as number) || "",
            carbsG: (i.carbsG as number) || "",
            fatG: (i.fatG as number) || "",
            groceryCategory: (i.groceryCategory as string) || "other",
          }))
        );
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  };

  const [predictingIdx, setPredictingIdx] = useState<number | null>(null);

  const predictIngredient = async (index: number) => {
    const ing = ingredientsList[index];
    if (!ing.name.trim()) return;

    setPredictingIdx(index);
    try {
      const res = await fetch("/api/ai/ingredient-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ing.name,
          quantity: ing.quantity || undefined,
          unit: ing.unit || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updated = [...ingredientsList];
      updated[index] = {
        ...updated[index],
        quantity: data.quantity ?? updated[index].quantity,
        unit: data.unit ?? updated[index].unit,
        calories: data.calories ?? "",
        proteinG: data.proteinG ?? "",
        carbsG: data.carbsG ?? "",
        fatG: data.fatG ?? "",
        groceryCategory: data.groceryCategory ?? updated[index].groceryCategory,
      };
      setIngredientsList(updated);
    } catch (err) {
      console.error("Predict failed:", err);
    } finally {
      setPredictingIdx(null);
    }
  };

  const addIngredient = () => {
    setIngredientsList([...ingredientsList, { ...emptyIngredient }]);
  };

  const removeIngredient = (index: number) => {
    setIngredientsList(ingredientsList.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientInput, value: string | number) => {
    const updated = [...ingredientsList];
    updated[index] = { ...updated[index], [field]: value };
    setIngredientsList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      category: [...categories].join(","),
      calories: totals.calories || null,
      proteinG: totals.protein || null,
      carbsG: totals.carbs || null,
      fatG: totals.fat || null,
      prepNotes: prepNotes || null,
      prepTimeMin: prepTimeMin || null,
      servings,
      ingredients: ingredientsList
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          quantity: i.quantity || null,
          unit: i.unit || null,
          calories: i.calories || null,
          proteinG: i.proteinG || null,
          carbsG: i.carbsG || null,
          fatG: i.fatG || null,
          groceryCategory: i.groceryCategory,
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + AI Assist */}
      <div>
        <label className="block text-sm font-medium mb-1">Meal Name or Description</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder='e.g. "Paneer tikka with rice" or "high protein chicken bowl"'
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={aiLoading}
            className="bg-accent text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
          >
            {aiLoading ? "Generating..." : "AI Fill"}
          </button>
        </div>
        {aiError && <p className="text-danger text-xs mt-1">{aiError}</p>}
        <div className="flex items-center gap-4 mt-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useHistory}
              onChange={(e) => setUseHistory(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-primary"
            />
            <span className="text-xs text-text-muted">Use knowledge base</span>
          </label>
          <p className="text-[10px] text-text-muted">
            {useHistory
              ? "AI will reference your uploaded documents and recipes"
              : "AI will suggest fresh ideas without reference material"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((cat) => (
              <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.has(cat)}
                  onChange={(e) => {
                    const next = new Set(categories);
                    if (e.target.checked) next.add(cat);
                    else next.delete(cat);
                    if (next.size > 0) setCategories(next);
                  }}
                  className="w-3.5 h-3.5 rounded border-border text-primary"
                />
                <span className="text-sm capitalize">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prep Time (min)</label>
          <input
            type="number"
            value={prepTimeMin}
            onChange={(e) => setPrepTimeMin(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(Number(e.target.value) || 1)}
            min={1}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Auto-summed totals */}
      <div className="bg-gray-50 border border-border rounded-lg p-3">
        <p className="text-xs font-medium text-text-muted mb-2">Meal Totals (auto-calculated from ingredients)</p>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-calories">{Math.round(totals.calories)}</p>
            <p className="text-[10px] text-text-muted">Calories</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-protein">{Number(totals.protein).toFixed(1)}g</p>
            <p className="text-[10px] text-text-muted">Protein</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-carbs">{Number(totals.carbs).toFixed(1)}g</p>
            <p className="text-[10px] text-text-muted">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-fat">{Number(totals.fat).toFixed(1)}g</p>
            <p className="text-[10px] text-text-muted">Fat</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Prep Notes</label>
        <textarea
          value={prepNotes}
          onChange={(e) => setPrepNotes(e.target.value)}
          rows={2}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Ingredients with per-item macros */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Ingredients</label>
          <button type="button" onClick={addIngredient} className="text-xs text-primary hover:underline">
            + Add Ingredient
          </button>
        </div>

        {/* Header row - desktop only */}
        <div className="hidden md:grid grid-cols-[1fr_60px_60px_60px_60px_60px_60px_90px_28px_24px] gap-1 mb-1 px-1">
          <span className="text-[10px] font-medium text-text-muted">Name</span>
          <span className="text-[10px] font-medium text-text-muted">Qty</span>
          <span className="text-[10px] font-medium text-text-muted">Unit</span>
          <span className="text-[10px] font-medium text-calories">Cal</span>
          <span className="text-[10px] font-medium text-protein">Prot</span>
          <span className="text-[10px] font-medium text-carbs">Carb</span>
          <span className="text-[10px] font-medium text-fat">Fat</span>
          <span className="text-[10px] font-medium text-text-muted">Category</span>
          <span />
          <span />
        </div>

        <div className="space-y-2 md:space-y-1">
          {ingredientsList.map((ing, i) => (
            <div key={i} className="bg-gray-50 md:bg-transparent rounded-lg p-2 md:p-0">
            {/* Desktop: single row */}
            <div className="hidden md:grid grid-cols-[1fr_60px_60px_60px_60px_60px_60px_90px_28px_24px] gap-1 items-center">
              <input
                type="text"
                placeholder="Name"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                className="border border-border rounded px-2 py-1.5 text-sm min-w-0"
              />
              <input
                type="number"
                placeholder="Qty"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, "quantity", Number(e.target.value))}
                className="border border-border rounded px-1 py-1.5 text-sm min-w-0"
              />
              <input
                type="text"
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                className="border border-border rounded px-1 py-1.5 text-sm min-w-0"
              />
              <input
                type="number"
                placeholder="0"
                value={ing.calories}
                onChange={(e) => updateIngredient(i, "calories", Number(e.target.value))}
                className="border border-border rounded px-1 py-1.5 text-sm min-w-0 text-calories"
              />
              <input
                type="number"
                placeholder="0"
                value={ing.proteinG}
                onChange={(e) => updateIngredient(i, "proteinG", Number(e.target.value))}
                className="border border-border rounded px-1 py-1.5 text-sm min-w-0 text-protein"
              />
              <input
                type="number"
                placeholder="0"
                value={ing.carbsG}
                onChange={(e) => updateIngredient(i, "carbsG", Number(e.target.value))}
                className="border border-border rounded px-1 py-1.5 text-sm min-w-0 text-carbs"
              />
              <input
                type="number"
                placeholder="0"
                value={ing.fatG}
                onChange={(e) => updateIngredient(i, "fatG", Number(e.target.value))}
                className="border border-border rounded px-1 py-1.5 text-sm min-w-0 text-fat"
              />
              <select
                value={ing.groceryCategory}
                onChange={(e) => updateIngredient(i, "groceryCategory", e.target.value)}
                className="border border-border rounded px-1 py-1.5 text-[11px] min-w-0"
              >
                <option value="produce">Produce</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="pantry">Pantry</option>
                <option value="frozen">Frozen</option>
                <option value="bakery">Bakery</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other</option>
              </select>
              <button
                type="button"
                onClick={() => predictIngredient(i)}
                disabled={predictingIdx === i || !ing.name.trim()}
                className="text-accent text-xs hover:bg-amber-50 rounded px-1 disabled:opacity-30"
                title="AI predict macros"
              >
                {predictingIdx === i ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  "✦"
                )}
              </button>
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="text-danger text-sm hover:bg-red-50 rounded px-1"
              >
                &times;
              </button>
            </div>

            {/* Mobile: stacked layout */}
            <div className="md:hidden space-y-1.5">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  className="flex-1 border border-border rounded px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => predictIngredient(i)}
                  disabled={predictingIdx === i || !ing.name.trim()}
                  className="text-accent text-sm hover:bg-amber-50 rounded px-2 py-1.5 disabled:opacity-30 border border-border"
                  title="AI predict macros"
                >
                  {predictingIdx === i ? "..." : "✦"}
                </button>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="text-danger text-sm hover:bg-red-50 rounded px-2 py-1.5 border border-border"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <input type="number" placeholder="Qty" value={ing.quantity}
                  onChange={(e) => updateIngredient(i, "quantity", Number(e.target.value))}
                  className="border border-border rounded px-2 py-1.5 text-sm" />
                <input type="text" placeholder="Unit" value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  className="border border-border rounded px-2 py-1.5 text-sm" />
                <select value={ing.groceryCategory}
                  onChange={(e) => updateIngredient(i, "groceryCategory", e.target.value)}
                  className="border border-border rounded px-1 py-1.5 text-xs col-span-2">
                  <option value="produce">Produce</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat">Meat</option>
                  <option value="pantry">Pantry</option>
                  <option value="frozen">Frozen</option>
                  <option value="bakery">Bakery</option>
                  <option value="beverages">Beverages</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <div>
                  <label className="text-[10px] text-calories font-medium">Cal</label>
                  <input type="number" placeholder="0" value={ing.calories}
                    onChange={(e) => updateIngredient(i, "calories", Number(e.target.value))}
                    className="w-full border border-border rounded px-2 py-1 text-sm text-calories" />
                </div>
                <div>
                  <label className="text-[10px] text-protein font-medium">Prot</label>
                  <input type="number" placeholder="0" value={ing.proteinG}
                    onChange={(e) => updateIngredient(i, "proteinG", Number(e.target.value))}
                    className="w-full border border-border rounded px-2 py-1 text-sm text-protein" />
                </div>
                <div>
                  <label className="text-[10px] text-carbs font-medium">Carb</label>
                  <input type="number" placeholder="0" value={ing.carbsG}
                    onChange={(e) => updateIngredient(i, "carbsG", Number(e.target.value))}
                    className="w-full border border-border rounded px-2 py-1 text-sm text-carbs" />
                </div>
                <div>
                  <label className="text-[10px] text-fat font-medium">Fat</label>
                  <input type="number" placeholder="0" value={ing.fatG}
                    onChange={(e) => updateIngredient(i, "fatG", Number(e.target.value))}
                    className="w-full border border-border rounded px-2 py-1 text-sm text-fat" />
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
      >
        {meal ? "Update Meal" : "Create Meal"}
      </button>
    </form>
  );
}
