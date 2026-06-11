import { db } from "@/db";
import { weeklyPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeekStart } from "@/lib/week-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const current = searchParams.get("current");

  if (current === "true") {
    const weekStart = getCurrentWeekStart();
    const [existing] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart));
    if (existing) return NextResponse.json(existing);
    const [plan] = await db.insert(weeklyPlans).values({ weekStart }).returning();
    return NextResponse.json(plan);
  }

  const plans = await db.select().from(weeklyPlans).orderBy(desc(weeklyPlans.weekStart));
  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const { weekStart } = await request.json();
  const [existing] = await db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, weekStart));
  if (existing) return NextResponse.json(existing);

  const [plan] = await db.insert(weeklyPlans).values({ weekStart }).returning();
  return NextResponse.json(plan, { status: 201 });
}
