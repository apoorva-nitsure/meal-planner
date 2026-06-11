import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { storeProducts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients, store } = await request.json();

    if (!ingredients?.length || !store) {
      return NextResponse.json({ error: "ingredients and store required" }, { status: 400 });
    }

    const storeName = store === "trader_joes" ? "Trader Joe's" : "Whole Foods Market";

    const uncached: { name: string; quantity: number; unit: string }[] = [];
    const cached: Record<string, { productName: string; priceCents: number; unitSize: string }> = {};

    for (const ing of ingredients) {
      const [existing] = await db
        .select()
        .from(storeProducts)
        .where(
          and(
            eq(storeProducts.store, store),
            eq(storeProducts.ingredientMatch, ing.name.toLowerCase())
          )
        );

      if (existing && existing.priceCents) {
        cached[ing.name.toLowerCase()] = {
          productName: existing.productName,
          priceCents: existing.priceCents,
          unitSize: existing.unitSize || "",
        };
      } else {
        uncached.push(ing);
      }
    }

    if (uncached.length === 0) {
      return NextResponse.json({ matched: cached, fromCache: true });
    }

    const ingredientList = uncached
      .map((i) => `- ${i.name} (need: ${i.quantity} ${i.unit})`)
      .join("\n");

    const client = getClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: "You are a grocery shopping assistant with expert knowledge of US grocery store products and prices. Return valid JSON only.",
      messages: [
        {
          role: "user",
          content: `For each ingredient below, recommend the specific product you would buy at ${storeName} to fulfill it. Use real product names and current approximate prices (as of 2025).

INGREDIENTS:
${ingredientList}

Return JSON object where keys are ingredient names (lowercase):
{
  "<ingredient name>": {
    "productName": "<actual product name at ${storeName}>",
    "priceCents": <price in cents>,
    "unitSize": "<package size, e.g. 16 oz, 1 lb, 6 count>"
  }
}

Be specific with product names (e.g. "Trader Joe's Organic Extra Firm Tofu" not just "Tofu").
Use realistic 2025 prices for ${storeName}. Round to nearest cent.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
    const aiMatched = JSON.parse(cleaned);

    for (const [ingredientName, product] of Object.entries(aiMatched)) {
      const p = product as { productName: string; priceCents: number; unitSize: string };

      const [existing] = await db
        .select()
        .from(storeProducts)
        .where(
          and(
            eq(storeProducts.store, store),
            eq(storeProducts.ingredientMatch, ingredientName.toLowerCase())
          )
        );

      if (existing) {
        await db.update(storeProducts)
          .set({
            productName: p.productName,
            priceCents: p.priceCents,
            unitSize: p.unitSize,
            lastScrapedAt: new Date().toISOString(),
          })
          .where(eq(storeProducts.id, existing.id));
      } else {
        await db.insert(storeProducts)
          .values({
            store,
            productName: p.productName,
            ingredientMatch: ingredientName.toLowerCase(),
            priceCents: p.priceCents,
            unitSize: p.unitSize || "",
            lastScrapedAt: new Date().toISOString(),
            manualEntry: 0,
          });
      }
    }

    const allMatched = { ...cached, ...aiMatched };
    return NextResponse.json({ matched: allMatched, fromCache: false, newlyMatched: uncached.length });
  } catch (error) {
    console.error("Grocery match error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to match products" },
      { status: 500 }
    );
  }
}
