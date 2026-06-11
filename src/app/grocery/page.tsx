"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentWeekStart, shiftWeek } from "@/lib/week-utils";
import WeekNavigator from "@/components/plan/WeekNavigator";
import type { GroceryItem } from "@/lib/grocery";

const categoryLabels: Record<string, string> = {
  produce: "Produce",
  dairy: "Dairy",
  meat: "Meat & Seafood",
  pantry: "Pantry",
  frozen: "Frozen",
  bakery: "Bakery",
  beverages: "Beverages",
  other: "Other",
};

export default function GroceryPage() {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [store, setStore] = useState<"trader_joes" | "whole_foods">("trader_joes");
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [matching, setMatching] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<{ name: string; value: string } | null>(null);

  const fetchGrocery = useCallback(async () => {
    const res = await fetch(`/api/grocery?weekStart=${weekStart}&store=${store}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotalCents(data.totalCents || 0);
  }, [weekStart, store]);

  useEffect(() => {
    fetchGrocery();
    setMatchStatus(null);
  }, [fetchGrocery]);

  const toggleCheck = (name: string) => {
    const next = new Set(checked);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setChecked(next);
  };

  const matchAllProducts = async () => {
    const unmatched = items.filter((i) => i.priceCents === null);
    if (unmatched.length === 0) {
      setMatchStatus("All items already have prices!");
      return;
    }

    setMatching(true);
    setMatchStatus(`Matching ${unmatched.length} items to ${store === "trader_joes" ? "Trader Joe's" : "Whole Foods"} products...`);

    try {
      const res = await fetch("/api/grocery/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: unmatched.map((i) => ({
            name: i.name,
            quantity: i.totalQuantity,
            unit: i.unit,
          })),
          store,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMatchStatus(`Matched ${data.newlyMatched || unmatched.length} products!`);
      await fetchGrocery();
    } catch (err) {
      setMatchStatus(`Error: ${err instanceof Error ? err.message : "Failed to match"}`);
    } finally {
      setMatching(false);
    }
  };

  const saveManualPrice = async (name: string, cents: number) => {
    await fetch("/api/prices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredient: name, store, priceCents: cents }),
    });
    setPriceInput(null);
    await fetchGrocery();
  };

  // Group items by category
  const grouped: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    const cat = item.groceryCategory;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  const unmatchedCount = items.filter((i) => i.priceCents === null).length;
  const checkedTotal = items
    .filter((i) => !checked.has(i.name) && i.priceCents !== null)
    .reduce((sum, i) => sum + (i.priceCents || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Grocery List</h1>
        <WeekNavigator
          weekStart={weekStart}
          onNavigate={(dir) => setWeekStart(shiftWeek(weekStart, dir))}
          onToday={() => setWeekStart(getCurrentWeekStart())}
        />
      </div>

      {/* Store Toggle + Match Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setStore("trader_joes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              store === "trader_joes"
                ? "bg-primary text-white"
                : "border border-border hover:bg-surface-hover"
            }`}
          >
            Trader Joe&apos;s
          </button>
          <button
            onClick={() => setStore("whole_foods")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              store === "whole_foods"
                ? "bg-primary text-white"
                : "border border-border hover:bg-surface-hover"
            }`}
          >
            Whole Foods
          </button>
        </div>
        {items.length > 0 && (
          <button
            onClick={matchAllProducts}
            disabled={matching || unmatchedCount === 0}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {matching
              ? "Matching..."
              : unmatchedCount > 0
              ? `Match ${unmatchedCount} Products`
              : "All Matched"}
          </button>
        )}
      </div>

      {matchStatus && (
        <div className={`text-sm mb-4 px-3 py-2 rounded-lg ${
          matchStatus.startsWith("Error")
            ? "bg-red-50 text-danger"
            : "bg-green-50 text-green-800"
        }`}>
          {matchStatus}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-text-muted text-center py-12">
          No meals in this week&apos;s plan. Add meals to generate a grocery list.
        </p>
      ) : (
        <>
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category} className="mb-6">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                {categoryLabels[category] || category}
              </h2>
              <div className="bg-surface border border-border rounded-xl divide-y divide-border">
                {catItems.map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-3 p-3 transition-opacity ${
                      checked.has(item.name) ? "opacity-40" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.name)}
                      onChange={() => toggleCheck(item.name)}
                      className="w-4 h-4 rounded border-border text-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          checked.has(item.name) ? "line-through" : ""
                        }`}
                      >
                        {item.name}
                      </p>
                      <div className="text-xs text-text-muted">
                        <span>
                          {item.totalQuantity} {item.unit}
                        </span>
                        {item.productName && item.productName !== item.name && (
                          <p className="text-primary text-[11px] leading-tight mt-0.5">
                            {item.productName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.priceCents !== null ? (
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            ${(item.priceCents / 100).toFixed(2)}
                          </span>
                        </div>
                      ) : priceInput?.name === item.name ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={priceInput.value}
                            onChange={(e) =>
                              setPriceInput({ name: item.name, value: e.target.value })
                            }
                            className="w-16 border border-border rounded px-1 py-0.5 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && priceInput.value) {
                                saveManualPrice(
                                  item.name,
                                  Math.round(parseFloat(priceInput.value) * 100)
                                );
                              }
                            }}
                          />
                          <button
                            onClick={() =>
                              saveManualPrice(
                                item.name,
                                Math.round(parseFloat(priceInput.value) * 100)
                              )
                            }
                            className="text-xs text-primary hover:underline"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPriceInput({ name: item.name, value: "" })}
                          className="text-[10px] text-text-muted hover:text-primary hover:underline"
                        >
                          Set price
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">Estimated Total</span>
              <span className="text-xl font-bold text-primary">
                ${(checkedTotal / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>
                {items.length} items ({items.length - unmatchedCount} priced, {checked.size} checked off)
              </span>
              {totalCents !== checkedTotal && (
                <span>Full list: ${(totalCents / 100).toFixed(2)}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
