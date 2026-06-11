import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

export async function POST(request: NextRequest) {
  try {
    const { name, quantity, unit } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Ingredient name required" }, { status: 400 });
    }

    const client = getClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: "You are a nutrition database. Given an ingredient with optional quantity/unit, return accurate macro estimates. Return valid JSON only, no other text.",
      messages: [
        {
          role: "user",
          content: `Estimate the nutrition for this ingredient:
Name: ${name}
${quantity ? `Quantity: ${quantity}` : ""}
${unit ? `Unit: ${unit}` : ""}

If no quantity/unit given, assume a typical single serving.

Return JSON:
{
  "quantity": <number - use provided or estimate typical>,
  "unit": "<unit - use provided or estimate typical>",
  "calories": <number>,
  "proteinG": <number>,
  "carbsG": <number>,
  "fatG": <number>,
  "groceryCategory": "<produce|dairy|meat|pantry|frozen|bakery|beverages|other>"
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingredient predict error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to predict" },
      { status: 500 }
    );
  }
}
