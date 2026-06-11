"use client";

import { useState } from "react";

interface FoodSource {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

type MacroType = "protein" | "carbs" | "fat";

const macroConfig: Record<MacroType, { label: string; color: string; unit: string }> = {
  protein: { label: "Protein", color: "#3b82f6", unit: "g" },
  carbs: { label: "Carbs", color: "#f59e0b", unit: "g" },
  fat: { label: "Fat", color: "#ef4444", unit: "g" },
};

export default function FoodSourceBreakdown({
  proteinSources,
  carbSources,
  fatSources,
}: {
  proteinSources: FoodSource[];
  carbSources: FoodSource[];
  fatSources: FoodSource[];
}) {
  const [activeTab, setActiveTab] = useState<MacroType>("protein");

  const sources = {
    protein: proteinSources,
    carbs: carbSources,
    fat: fatSources,
  };

  const currentSources = sources[activeTab];
  const config = macroConfig[activeTab];
  const maxValue = currentSources.length > 0 ? currentSources[0][activeTab] : 1;

  if (currentSources.every((s) => s[activeTab] === 0)) {
    return (
      <div className="text-center text-sm text-text-muted py-8">
        No ingredient data available. Add per-ingredient macros to your meals.
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-50 rounded-lg p-0.5">
        {(Object.keys(macroConfig) as MacroType[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === key
                ? "bg-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
            style={activeTab === key ? { color: macroConfig[key].color } : {}}
          >
            {macroConfig[key].label}
          </button>
        ))}
      </div>

      {/* Source list with bars */}
      <div className="space-y-2.5">
        {currentSources.map((source, i) => {
          const value = source[activeTab];
          const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={source.name}>
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-xs font-medium text-text truncate mr-2">
                  {i + 1}. {source.name}
                </span>
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: config.color }}>
                  {Math.round(value)}{config.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: config.color }}
                  />
                </div>
                <span className="text-[10px] text-text-muted w-8 text-right">
                  {source.count}x
                </span>
              </div>
              {/* Secondary macros */}
              <div className="flex gap-2 mt-0.5 text-[10px] text-text-muted">
                {activeTab !== "protein" && <span>{Math.round(source.protein)}g P</span>}
                {activeTab !== "carbs" && <span>{Math.round(source.carbs)}g C</span>}
                {activeTab !== "fat" && <span>{Math.round(source.fat)}g F</span>}
                <span>{Math.round(source.calories)} cal</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly total for active macro */}
      <div className="border-t border-border mt-3 pt-3">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Weekly total from food sources</span>
          <span className="font-bold" style={{ color: config.color }}>
            {Math.round(currentSources.reduce((sum, s) => sum + s[activeTab], 0))}{config.unit}
          </span>
        </div>
      </div>
    </div>
  );
}
