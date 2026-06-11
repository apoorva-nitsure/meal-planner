"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { WeeklyPlan } from "@/db/schema";

export default function HistoryPage() {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchPlans = () => {
    fetch("/api/plans").then((r) => r.json()).then(setPlans);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (e: React.MouseEvent, planId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this meal plan? This cannot be undone.")) return;

    setDeleting(planId);
    try {
      await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      console.error("Failed to delete plan:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Meal Plan History</h1>
      {plans.length === 0 ? (
        <p className="text-text-muted text-center py-12">No past meal plans yet.</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const start = new Date(plan.weekStart + "T00:00:00");
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return (
              <div
                key={plan.id}
                className="flex items-center gap-2"
              >
                <Link
                  href={`/plan/${plan.id}`}
                  className="flex-1 bg-surface border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        Week of {start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-sm text-text-muted">
                        {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                        {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className="text-text-muted text-sm">&rarr;</span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(e, plan.id)}
                  disabled={deleting === plan.id}
                  className="p-2 text-text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete plan"
                >
                  {deleting === plan.id ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
