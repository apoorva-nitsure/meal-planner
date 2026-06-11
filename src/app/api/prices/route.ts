import { db } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const store = searchParams.get("store");

  let query = db.select().from(storeProducts).$dynamic();
  if (store) {
    query = query.where(eq(storeProducts.store, store as "trader_joes" | "whole_foods"));
  }

  const results = await query;
  return NextResponse.json(results);
}

export async function PUT(request: NextRequest) {
  const { ingredient, store, priceCents, productName, unitSize } = await request.json();

  const [existing] = await db
    .select()
    .from(storeProducts)
    .where(
      and(
        eq(storeProducts.store, store),
        eq(storeProducts.ingredientMatch, ingredient.toLowerCase())
      )
    );

  if (existing) {
    await db.update(storeProducts)
      .set({
        priceCents,
        productName: productName || ingredient,
        unitSize: unitSize || "",
        manualEntry: 1,
        lastScrapedAt: new Date().toISOString(),
      })
      .where(eq(storeProducts.id, existing.id));
  } else {
    await db.insert(storeProducts)
      .values({
        store,
        productName: productName || ingredient,
        ingredientMatch: ingredient.toLowerCase(),
        priceCents,
        unitSize: unitSize || "",
        manualEntry: 1,
        lastScrapedAt: new Date().toISOString(),
      });
  }

  return NextResponse.json({ success: true });
}
