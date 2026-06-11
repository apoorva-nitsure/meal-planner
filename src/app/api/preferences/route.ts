import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
  if (prefs) return NextResponse.json(prefs);

  const [newPrefs] = await db
    .insert(userPreferences)
    .values({
      calorieTarget: 2200,
      proteinTargetG: 150,
      carbsTargetG: 220,
      fatTargetG: 75,
    })
    .returning();
  return NextResponse.json(newPrefs);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await db.update(userPreferences)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(userPreferences.id, 1));
  const [updated] = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
  return NextResponse.json(updated);
}
