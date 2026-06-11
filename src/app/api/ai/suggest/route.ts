import { db } from "@/db";
import { meals, userPreferences, weeklyPlans, planSlots } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateMealPlan } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const mealLibrary = await db.select().from(meals);
    if (mealLibrary.length === 0) {
      return NextResponse.json({ error: "No meals in library. Add some meals first." }, { status: 400 });
    }

    let [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
    if (!prefs) {
      [prefs] = await db
        .insert(userPreferences)
        .values({ calorieTarget: 2200, proteinTargetG: 150, carbsTargetG: 220, fatTargetG: 75 })
        .returning();
    }

    const recentWeeks = await db
      .select()
      .from(weeklyPlans)
      .orderBy(desc(weeklyPlans.weekStart))
      .limit(4);

    const recentMeals: { dayOfWeek: number; mealType: string; mealName: string }[] = [];
    for (const week of recentWeeks) {
      const slots = await db
        .select({ dayOfWeek: planSlots.dayOfWeek, mealType: planSlots.mealType, mealId: planSlots.mealId })
        .from(planSlots)
        .where(eq(planSlots.planId, week.id));
      for (const slot of slots) {
        if (slot.mealId) {
          const meal = mealLibrary.find((m) => m.id === slot.mealId);
          if (meal) {
            recentMeals.push({
              dayOfWeek: slot.dayOfWeek,
              mealType: slot.mealType,
              mealName: meal.name,
            });
          }
        }
      }
    }

    const suggestion = await generateMealPlan(mealLibrary, prefs, recentMeals);
    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("AI suggestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
