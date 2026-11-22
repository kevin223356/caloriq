"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setGroceryChecks } from "@/app/actions/grocery";
import { rupiah } from "@/lib/format";

type GroceryItem = {
  foodId: string;
  name: string;
  category: string;
  servingSize: string;
  servings: number;
  quantityGrams: number;
  estimatedCost: number;
  checked: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  PROTEIN: "Protein", CARB: "Carbs", VEGETABLE: "Vegetables", FRUIT: "Fruit", MEAL: "Prepared meals", SNACK: "Snacks", OTHER: "Other",
};

export function GroceryList({ items, dailyBudget, plannedDays }: { items: GroceryItem[]; dailyBudget: number; plannedDays: number }) {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((item) => [item.foodId, item.checked])));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => { setChecked(Object.fromEntries(items.map((item) => [item.foodId, item.checked]))); }, [items]);
  const checkedCount = useMemo(() => items.filter((item) => checked[item.foodId]).length, [items, checked]);
  const totalCost = items.reduce((total, item) => total + item.estimatedCost, 0);
  const estimatedBudget = dailyBudget * 7;

  async function saveChecks(foodIds: string[], value: boolean) {
    setError("");
    setChecked((current) => ({ ...current, ...Object.fromEntries(foodIds.map((id) => [id, value])) }));
    startTransition(async () => {
      try {
        const result = await setGroceryChecks({ foodIds, checked: value });
        if (result.error) {
          setError(result.error);
          router.refresh();
        } else {
          router.refresh();
        }
      } catch {
        setError("Could not save your checklist. Please try again.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-muted">Unique food items</p><p className="mt-1 text-2xl font-bold">{items.length}</p></div>
        <div className="card"><p className="text-sm text-muted">Estimated grocery cost</p><p className="mt-1 text-2xl font-bold">{rupiah(totalCost)}</p></div>
        <div className="card"><p className="text-sm text-muted">Checklist progress</p><p className="mt-1 text-2xl font-bold">{checkedCount}/{items.length}</p></div>
      </div>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your shopping list</h2>
            <p className="mt-1 text-sm text-muted">Combined food items from {plannedDays} planned days. Checklist progress is saved to your account.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost !px-3 !py-2 text-sm" disabled={pending || items.length === 0} onClick={() => saveChecks(items.map((item) => item.foodId), true)}>Check all</button>
            <button type="button" className="btn-ghost !px-3 !py-2 text-sm" disabled={pending || items.length === 0} onClick={() => saveChecks(items.map((item) => item.foodId), false)}>Clear</button>
          </div>
        </div>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {items.length === 0 ? (
          <p className="rounded-xl bg-bg p-4 text-sm text-muted">No ingredients yet. Generate a meal plan first.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <label key={item.foodId} className={`flex cursor-pointer items-center gap-3 py-4 ${checked[item.foodId] ? "opacity-60" : ""}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-primary"
                  checked={!!checked[item.foodId]}
                  disabled={pending}
                  onChange={(event) => saveChecks([item.foodId], event.target.checked)}
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${checked[item.foodId] ? "line-through" : ""}`}>{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{CATEGORY_LABEL[item.category] ?? item.category} · {item.servings.toLocaleString("en-US", { maximumFractionDigits: 2 })} × {item.servingSize} · about {item.quantityGrams.toLocaleString("en-US")} g</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{rupiah(item.estimatedCost)}</p>
              </label>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">Estimated total</span>
            <span className="text-lg font-bold tabular-nums">{rupiah(totalCost)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
            <span>7-day food budget reference</span>
            <span>{rupiah(estimatedBudget)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">Prepared meals and snacks are listed as whole ready-to-eat items, not broken into their recipes. Prices, portions and nutrients are rough prototype estimates, not live market data.</p>
        </div>
      </section>
    </div>
  );
}
