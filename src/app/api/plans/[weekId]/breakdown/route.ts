import { db } from "@/db";
import { planSlots, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const planId = parseInt(weekId);

  const slots = await db.select().from(planSlots).where(eq(planSlots.planId, planId));

  const mealCounts = new Map<number, number>();
  for (const slot of slots) {
    if (slot.mealId) {
      mealCounts.set(slot.mealId, (mealCounts.get(slot.mealId) || 0) + 1);
    }
  }

  const sourceTotals = new Map<string, { name: string; calories: number; protein: number; carbs: number; fat: number; count: number }>();

  for (const [mealId, count] of mealCounts) {
    const ings = await db.select().from(ingredients).where(eq(ingredients.mealId, mealId));
    for (const ing of ings) {
      const key = ing.name.toLowerCase();
      const existing = sourceTotals.get(key) || { name: ing.name, calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      existing.calories += (ing.calories || 0) * count;
      existing.protein += (ing.proteinG || 0) * count;
      existing.carbs += (ing.carbsG || 0) * count;
      existing.fat += (ing.fatG || 0) * count;
      existing.count += count;
      sourceTotals.set(key, existing);
    }
  }

  const sources = Array.from(sourceTotals.values());

  return NextResponse.json({
    proteinSources: [...sources].sort((a, b) => b.protein - a.protein).slice(0, 10),
    carbSources: [...sources].sort((a, b) => b.carbs - a.carbs).slice(0, 10),
    fatSources: [...sources].sort((a, b) => b.fat - a.fat).slice(0, 10),
    allSources: sources,
  });
}
