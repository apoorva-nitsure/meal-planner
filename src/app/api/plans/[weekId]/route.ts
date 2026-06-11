import { db } from "@/db";
import { weeklyPlans, planSlots, meals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const id = parseInt(weekId);

  const [plan] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.id, id));
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slots = await db
    .select({
      slot: planSlots,
      meal: meals,
    })
    .from(planSlots)
    .leftJoin(meals, eq(planSlots.mealId, meals.id))
    .where(eq(planSlots.planId, id));

  return NextResponse.json({
    ...plan,
    slots: slots.map((s) => ({ ...s.slot, meal: s.meal })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const id = parseInt(weekId);
  const body = await request.json();

  await db.update(weeklyPlans).set(body).where(eq(weeklyPlans.id, id));
  const [updated] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.id, id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const id = parseInt(weekId);

  // Slots are cascade-deleted via foreign key
  await db.delete(planSlots).where(eq(planSlots.planId, id));
  await db.delete(weeklyPlans).where(eq(weeklyPlans.id, id));

  return NextResponse.json({ success: true });
}
