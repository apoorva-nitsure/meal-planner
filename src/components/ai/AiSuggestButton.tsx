"use client";

import { useState } from "react";
import SuggestionReview from "./SuggestionReview";
import type { Meal } from "@/db/schema";

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

export default function AiSuggestButton({
  meals,
  onAccept,
}: {
  meals: Meal[];
  onAccept: (slots: { dayOfWeek: number; mealType: string; mealId: number }[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (suggestion) {
    return (
      <SuggestionReview
        suggestion={suggestion}
        meals={meals}
        onAccept={(slots) => {
          onAccept(slots);
          setSuggestion(null);
        }}
        onCancel={() => setSuggestion(null)}
      />
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={generate}
        disabled={loading}
        className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Generating..." : "AI Suggest Plan"}
      </button>
      {error && <span className="text-danger text-xs">{error}</span>}
    </div>
  );
}
