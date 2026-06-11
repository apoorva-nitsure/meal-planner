import { scrapePrice } from "@/lib/scraper";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { ingredient, store } = await request.json();

  if (!ingredient || !store) {
    return NextResponse.json({ error: "ingredient and store required" }, { status: 400 });
  }

  const result = await scrapePrice(ingredient, store);
  if (!result) {
    return NextResponse.json({ error: "No price found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
