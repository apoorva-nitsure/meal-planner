import Anthropic from "@anthropic-ai/sdk";
import { searchMealHistory } from "@/lib/rag";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

export async function POST(request: NextRequest) {
  try {
    const { description, category, servings, useHistory = true } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: "Meal description required" }, { status: 400 });
    }

    let ragContext = "";
    if (useHistory) {
      const ragResults = await searchMealHistory(description, 5);
      ragContext = ragResults.length > 0
        ? ragResults.map((r, i) => `[Past meals ${i + 1}]: ${r.chunkText}`).join("\n\n")
        : "";
    }

    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.id, 1));
    const customInstructions = prefs?.customAiInstructions || "";

    const client = getClient();

    let systemPrompt = `You are a nutritionist. Given a meal description, generate a detailed ingredient list with accurate per-ingredient macro estimates. Return valid JSON only, no other text.`;

    if (customInstructions.trim()) {
      systemPrompt += `\n\nUser's dietary rules (MUST follow):\n${customInstructions}`;
    }

    let userContent = `Generate a complete meal for: "${description}"
Category: ${category || "dinner"}
Servings: ${servings || 1}`;

    if (ragContext) {
      userContent += `\n\nHere is context from the user's past meal history. Use this to match their cooking style, preferred ingredients, and portion sizes:\n${ragContext}`;
    }

    userContent += `\n\nReturn JSON in this exact format:`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `${userContent}
{
  "name": "<polished meal name>",
  "prepNotes": "<brief cooking instructions>",
  "prepTimeMin": <estimated minutes>,
  "ingredients": [
    {
      "name": "<ingredient>",
      "quantity": <number>,
      "unit": "<unit>",
      "calories": <number>,
      "proteinG": <number>,
      "carbsG": <number>,
      "fatG": <number>,
      "groceryCategory": "<produce|dairy|meat|pantry|frozen|bakery|beverages|other>"
    }
  ]
}

Be accurate with macros. Use standard serving sizes. Every ingredient must have calorie and macro values.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
    const result = JSON.parse(cleaned);

    const totals = (result.ingredients || []).reduce(
      (acc: Record<string, number>, ing: Record<string, number>) => ({
        calories: acc.calories + (ing.calories || 0),
        proteinG: acc.proteinG + (ing.proteinG || 0),
        carbsG: acc.carbsG + (ing.carbsG || 0),
        fatG: acc.fatG + (ing.fatG || 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    return NextResponse.json({
      ...result,
      calories: totals.calories,
      proteinG: totals.proteinG,
      carbsG: totals.carbsG,
      fatG: totals.fatG,
    });
  } catch (error) {
    console.error("Meal assist error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate meal" },
      { status: 500 }
    );
  }
}
