"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFoodLog } from "@/app/actions/meals";
import { rupiah } from "@/lib/format";

type FoodItem = {
  id: string; name: string; category: string; servingSize: string; servingGrams: number;
  calories: number; protein: number; carbs: number; fat: number; estimatedPrice: number;
  vegetarian: boolean; allergens: string;
};

const CATEGORIES = [
  ["ALL", "All categories"], ["MEAL", "Complete meals"], ["SNACK", "Snacks"], ["PROTEIN", "Protein"], ["CARB", "Carbohydrates"],
  ["VEGETABLE", "Vegetables"], ["FRUIT", "Fruit"], ["OTHER", "Other"],
];

export function FoodBrowser({ foods }: { foods: FoodItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => foods.filter((food) => {
    const matchesQuery = `${food.name} ${food.category} ${food.allergens}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesCategory = category === "ALL" || food.category === category;
    const matchesVegetarian = !vegetarianOnly || food.vegetarian;
    return matchesQuery && matchesCategory && matchesVegetarian;
  }), [foods, query, category, vegetarianOnly]);

  function add(food: FoodItem) {
    setPendingId(food.id); setError(""); setNotice("");
    start(async () => {
      try {
        const result = await addFoodLog(food.id, 1);
        if (result.error) setError(result.error);
        else {
          setNotice(`${food.name} added to today's food log.`);
          router.refresh();
        }
      } catch {
        setError("Could not add this food. Please try again.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="block text-sm font-medium">Search foods
            <input className="input mt-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search nasi goreng, tempeh, soto…" />
          </label>
          <label className="block text-sm font-medium">Category
            <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={vegetarianOnly} onChange={(e) => setVegetarianOnly(e.target.checked)} /> Show vegetarian foods only</label>
        <p className="text-sm text-muted">Showing {filtered.length} of {foods.length} foods.</p>
      </section>

      {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {filtered.length === 0 ? <div className="card text-center"><p className="font-semibold">No foods found</p><p className="mt-1 text-sm text-muted">Try a different search or remove a filter.</p></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((food) => (
            <article key={food.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div><h2 className="font-semibold">{food.name}</h2><p className="mt-1 text-sm text-muted">{food.servingSize} · {food.servingGrams} g/ml</p></div>
                <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-medium">{food.category.toLowerCase()}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 rounded-xl bg-bg p-3 text-center">
                <div><p className="text-xs text-muted">Calories</p><p className="font-semibold">{Math.round(food.calories)}</p></div>
                <div><p className="text-xs text-muted">Protein</p><p className="font-semibold">{Math.round(food.protein)}g</p></div>
                <div><p className="text-xs text-muted">Carbs</p><p className="font-semibold">{Math.round(food.carbs)}g</p></div>
                <div><p className="text-xs text-muted">Fat</p><p className="font-semibold">{Math.round(food.fat)}g</p></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{rupiah(food.estimatedPrice)} <span className="font-normal text-muted">/ serving</span></span>
                {food.vegetarian && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Vegetarian</span>}
              </div>
              {food.allergens && <p className="text-xs text-muted">Allergens: {food.allergens.split(",").join(", ")}</p>}
              <button className="btn mt-auto w-full !py-2 text-sm" disabled={pending} onClick={() => add(food)}>{pendingId === food.id ? "Adding…" : "Add 1 serving to today"}</button>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Nutrition values and prices are estimates in the demo food database. Check product labels for accurate nutrition and allergen information.</p>
    </div>
  );
}
