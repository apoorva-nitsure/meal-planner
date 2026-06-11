import type { Ingredient } from "@/db/schema";

export interface GroceryItem {
  name: string;
  totalQuantity: number;
  unit: string;
  groceryCategory: string;
  checked: boolean;
  priceCents: number | null;
  store: string | null;
  productName: string | null;
}

// Normalize units so "cups" and "cup", "ozs" and "oz", etc. merge together
function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  const singularMap: Record<string, string> = {
    cups: "cup",
    tbsps: "tbsp",
    tsps: "tsp",
    ounces: "oz",
    ozs: "oz",
    pounds: "lb",
    lbs: "lb",
    cloves: "clove",
    slices: "slice",
    pieces: "piece",
    stalks: "stalk",
    leaves: "leaf",
    tablespoons: "tbsp",
    tablespoon: "tbsp",
    teaspoons: "tsp",
    teaspoon: "tsp",
    grams: "g",
    liters: "L",
    milliliters: "ml",
    whole: "whole",
    large: "large",
    medium: "medium",
    small: "small",
  };
  return singularMap[u] || u;
}

export function aggregateIngredients(ingredients: Ingredient[]): GroceryItem[] {
  const map = new Map<string, GroceryItem>();

  for (const ing of ingredients) {
    const normalizedUnit = normalizeUnit(ing.unit || "");
    const key = `${ing.name.toLowerCase()}|${normalizedUnit}`;
    const existing = map.get(key);

    if (existing) {
      existing.totalQuantity += ing.quantity || 0;
    } else {
      map.set(key, {
        name: ing.name,
        totalQuantity: ing.quantity || 0,
        unit: normalizedUnit,
        groceryCategory: ing.groceryCategory || "other",
        checked: false,
        priceCents: null,
        store: null,
        productName: null,
      });
    }
  }

  // Sort by category then name
  return Array.from(map.values()).sort((a, b) => {
    if (a.groceryCategory !== b.groceryCategory) return a.groceryCategory.localeCompare(b.groceryCategory);
    return a.name.localeCompare(b.name);
  });
}

export function groupByCategory(items: GroceryItem[]): Record<string, GroceryItem[]> {
  const groups: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    const cat = item.groceryCategory;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}
