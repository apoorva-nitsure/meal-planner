import { db } from "@/db";
import { meals, ingredients } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");

  let query = db.select().from(meals).$dynamic();

  if (q) {
    query = query.where(like(meals.name, `%${q}%`));
  }
  if (category) {
    query = query.where(eq(meals.category, category as "breakfast" | "lunch" | "dinner" | "snack"));
  }

  const result = await query;
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ingredients: mealIngredients, ...mealData } = body;

  const [meal] = await db
    .insert(meals)
    .values({
      ...mealData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  if (mealIngredients?.length) {
    for (const ing of mealIngredients) {
      await db.insert(ingredients).values({ mealId: meal.id, ...ing });
    }
  }

  const mealWithIngredients = {
    ...meal,
    ingredients: await db.select().from(ingredients).where(eq(ingredients.mealId, meal.id)),
  };

  return NextResponse.json(mealWithIngredients, { status: 201 });
}
