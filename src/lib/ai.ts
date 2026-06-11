import Anthropic from "@anthropic-ai/sdk";
import type { Meal, UserPreference } from "@/db/schema";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set. Check .env.local");
  }
  return new Anthropic({ apiKey: key });
}

interface MealSuggestion {
  dayOfWeek: number;
  mealType: string;
  mealId: number;
  reasoning: string;
}

interface SuggestionResponse {
  plan: MealSuggestion[];
  summary: string;
}

export async function generateMealPlan(
  mealLibrary: Meal[],
  preferences: UserPreference,
  recentPlans: { dayOfWeek: number; mealType: string; mealName: string }[]
): Promise<SuggestionResponse> {
  const mealList = mealLibrary
    .map((m) => `ID:${m.id} "${m.name}" (categories: ${m.category}) - ${m.calories}cal, ${m.proteinG}P/${m.carbsG}C/${m.fatG}F`)
    .join("\n");

  const recentHistory = recentPlans.length
    ? recentPlans.map((r) => `  Day ${r.dayOfWeek} ${r.mealType}: ${r.mealName}`).join("\n")
    : "No recent history.";

  const restrictions = JSON.parse(preferences.dietaryRestrictions || "[]");
  const customInstructions = preferences.customAiInstructions || "";

  const systemPrompt = `You are a nutritionist and meal planner. You create balanced weekly meal plans.
You MUST only use meals from the user's existing meal library (referenced by ID).
IMPORTANT: The user's CUSTOM RULES take highest priority. If a meal in the library violates a custom rule (e.g. contains a forbidden protein source or ingredient), you MUST NOT select that meal. It is better to repeat an allowed meal than to use a forbidden one. If no meals in the library match a slot's requirements under the custom rules, pick the closest allowed option.
Return valid JSON only, no other text.`;

  // Build prompt sections — custom rules go FIRST for highest priority
  let userPrompt = "";

  // Custom instructions at the very top
  if (customInstructions.trim()) {
    userPrompt += `CUSTOM RULES (HIGHEST PRIORITY - you MUST follow these, override everything else if there is a conflict):
${customInstructions}

`;
  }

  userPrompt += `Create a 7-day meal plan (breakfast, lunch, dinner, snack for each day).

DAILY TARGETS:
- Calories: ${preferences.calorieTarget} kcal
- Protein: ${preferences.proteinTargetG}g
- Carbs: ${preferences.carbsTargetG}g
- Fat: ${preferences.fatTargetG}g
${restrictions.length ? `- Dietary restrictions: ${restrictions.join(", ")}` : ""}`;

  userPrompt += `

MEAL LIBRARY (use these IDs only):
${mealList}

RECENT MEALS (avoid excessive repetition):
${recentHistory}

Return JSON in this exact format:
{
  "plan": [
    {"dayOfWeek": 0, "mealType": "breakfast", "mealId": <id>, "reasoning": "<brief reason>"},
    {"dayOfWeek": 0, "mealType": "lunch", "mealId": <id>, "reasoning": "<brief reason>"},
    {"dayOfWeek": 0, "mealType": "dinner", "mealId": <id>, "reasoning": "<brief reason>"},
    {"dayOfWeek": 0, "mealType": "snack", "mealId": <id>, "reasoning": "<brief reason>"},
    ... (28 total entries for 7 days x 4 meal types)
  ],
  "summary": "<brief summary of the plan's nutritional strategy>"
}

dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday`;

  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  // Strip trailing commas before ] or } (common AI JSON mistake)
  const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");

  const result = JSON.parse(cleaned) as SuggestionResponse;

  // Validate: only allow meal IDs that exist in the library
  const validIds = new Set(mealLibrary.map((m) => m.id));
  result.plan = result.plan.filter((slot) => validIds.has(slot.mealId));

  if (result.plan.length === 0) {
    throw new Error("AI suggested no valid meals from your library. Try adding more meals.");
  }

  return result;
}
