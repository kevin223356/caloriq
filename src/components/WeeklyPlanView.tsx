"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { regenerateWeekDay } from "@/app/actions/weekly";
import { rupiah } from "@/lib/format";

type WeeklyItem = { foodId: string; name: string; servingSize: string; servings: number };
type WeeklyMeal = {
  id: string; type: string; name: string; status: string;
  kcal: number; protein: number; carbs: number; fat: number; price: number;
  items: WeeklyItem[];
};
type WeeklyDay = {
  dateKey: string; label: string; dateLabel: string; isToday: boolean;
  meals: WeeklyMeal[]; planError: string | null;
  totals: { kcal: number; protein: number; carbs: number; fat: number; price: number };
};

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast", LUNCH: "Lunch", SNACK: "Snack", DINNER: "Dinner",
};

export function WeeklyPlanView({ days }: { days: WeeklyDay[] }) {
  const router = useRouter();
  const [busyDate, setBusyDate] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleRegenerate(date: string) {
    setBusyDate(date);
    setNotice("");
    setError("");
    try {
      const result = await regenerateWeekDay(date);
      if (result.error) setError(result.error);
      else {
        setNotice("Meal plan regenerated.");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyDate(null);
    }
  }

  return (
    <div className="space-y-4">
      {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {days.map((day) => {
          const hasEatenMeal = day.meals.some((meal) => meal.status === "EATEN");
          return (
            <section key={day.dateKey} className="card space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{day.label}</h2>
                    {day.isToday && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Today</span>}
                  </div>
                  <p className="text-sm text-muted">{day.dateLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums">{day.totals.kcal.toLocaleString("en-US")} kcal</p>
                  <p className="text-xs text-muted">{day.totals.protein}g protein · {rupiah(day.totals.price)}</p>
                </div>
              </div>

              {day.planError ? (
                <p className="rounded-xl bg-bg p-3 text-sm text-muted">{day.planError}</p>
              ) : day.meals.length === 0 ? (
                <p className="rounded-xl bg-bg p-3 text-sm text-muted">No meals available for this day.</p>
              ) : (
                <div className="divide-y divide-border">
                  {day.meals.map((meal) => (
                    <div key={meal.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{MEAL_LABEL[meal.type] ?? meal.type}</p>
                          <p className="mt-1 font-medium">{meal.name}</p>
                          <p className="mt-1 text-xs text-muted">{meal.items.map((item) => `${item.servings} × ${item.name}`).join(" · ")}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold tabular-nums">{meal.kcal} kcal</p>
                          <p className="text-xs text-muted">P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-xs text-muted">{day.meals.length} meals planned</p>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-2 text-sm"
                  disabled={busyDate !== null || !!day.planError || hasEatenMeal || day.meals.length === 0}
                  title={hasEatenMeal ? "Undo eaten meal statuses before regenerating this day." : undefined}
                  onClick={() => handleRegenerate(day.dateKey)}
                >
                  {busyDate === day.dateKey ? "Regenerating…" : "Regenerate day"}
                </button>
              </div>
              {hasEatenMeal && <p className="text-xs text-muted">This day has a meal marked as eaten, so it cannot be regenerated.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
