import { db } from "@/db";
import { planSlots } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const planId = parseInt(weekId);
  const { dayOfWeek, mealType, mealId, slotOrder = 0 } = await request.json();

  await db.delete(planSlots)
    .where(
      and(
        eq(planSlots.planId, planId),
        eq(planSlots.dayOfWeek, dayOfWeek),
        eq(planSlots.mealType, mealType),
        eq(planSlots.slotOrder, slotOrder)
      )
    );

  if (mealId !== null) {
    const [slot] = await db
      .insert(planSlots)
      .values({ planId, dayOfWeek, mealType, mealId, slotOrder })
      .returning();
    return NextResponse.json(slot);
  }

  return NextResponse.json({ success: true });
}
