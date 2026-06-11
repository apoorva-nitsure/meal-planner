import { db } from "@/db";
import { meals, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  const { mealId } = await params;
  const [meal] = await db.select().from(meals).where(eq(meals.id, parseInt(mealId)));
  if (!meal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mealIngredients = await db.select().from(ingredients).where(eq(ingredients.mealId, meal.id));
  return NextResponse.json({ ...meal, ingredients: mealIngredients });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  const { mealId } = await params;
  const id = parseInt(mealId);
  const body = await request.json();
  const { ingredients: newIngredients, ...mealData } = body;

  await db.update(meals)
    .set({ ...mealData, updatedAt: new Date().toISOString() })
    .where(eq(meals.id, id));

  if (newIngredients) {
    await db.delete(ingredients).where(eq(ingredients.mealId, id));
    for (const ing of newIngredients) {
      await db.insert(ingredients).values({ mealId: id, ...ing });
    }
  }

  const [updated] = await db.select().from(meals).where(eq(meals.id, id));
  const updatedIngredients = await db.select().from(ingredients).where(eq(ingredients.mealId, id));
  return NextResponse.json({ ...updated, ingredients: updatedIngredients });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  const { mealId } = await params;
  await db.delete(meals).where(eq(meals.id, parseInt(mealId)));
  return NextResponse.json({ success: true });
}
