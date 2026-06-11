import { db } from "@/db";
import { weeklyPlans, planSlots, ingredients, storeProducts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { aggregateIngredients } from "@/lib/grocery";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart");
  const store = (searchParams.get("store") || "trader_joes") as "trader_joes" | "whole_foods";

  if (!weekStart) {
    return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  }

  const [plan] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart));
  if (!plan) {
    return NextResponse.json({ items: [], totalCents: 0 });
  }

  const slots = await db.select().from(planSlots).where(eq(planSlots.planId, plan.id));
  const mealIds = [...new Set(slots.filter((s) => s.mealId).map((s) => s.mealId!))];

  if (mealIds.length === 0) {
    return NextResponse.json({ items: [], totalCents: 0 });
  }

  const allIngredients = [];
  for (const mealId of mealIds) {
    const count = slots.filter((s) => s.mealId === mealId).length;
    const mealIngs = await db.select().from(ingredients).where(eq(ingredients.mealId, mealId));
    for (let i = 0; i < count; i++) {
      allIngredients.push(...mealIngs);
    }
  }

  const groceryItems = aggregateIngredients(allIngredients);

  for (const item of groceryItems) {
    const [cached] = await db
      .select()
      .from(storeProducts)
      .where(
        and(
          eq(storeProducts.store, store),
          eq(storeProducts.ingredientMatch, item.name.toLowerCase())
        )
      );

    if (cached) {
      item.priceCents = cached.priceCents;
      item.store = cached.store;
      item.productName = cached.productName;
    }
  }

  const totalCents = groceryItems.reduce((sum, item) => sum + (item.priceCents || 0), 0);

  return NextResponse.json({ items: groceryItems, totalCents });
}
