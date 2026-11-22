"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/actions/settings";

const ACTIVITY = [
  ["SEDENTARY", "Sedentary"], ["LIGHT", "Lightly active"], ["MODERATE", "Moderately active"],
  ["VERY", "Very active"], ["EXTREME", "Extremely active"],
];
const ALLERGENS = ["egg", "dairy", "peanut", "seafood", "gluten", "soy"];

type SettingsValues = {
  username: string;
  age: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  activity: string;
  goal: string;
  targetWeightKg: string;
  mealsPerDay: string;
  dislikes: string;
  allergies: string[];
  vegetarian: boolean;
  budget: string;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [d, setD] = useState<SettingsValues>(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => setD((old) => ({ ...old, [key]: value }));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    start(async () => {
      try {
        const result = await updateSettings({
          username: d.username,
          age: Number(d.age),
          sex: d.sex,
          heightCm: Number(d.heightCm),
          weightKg: Number(d.weightKg),
          activity: d.activity,
          goal: d.goal,
          targetWeightKg: d.targetWeightKg.trim() ? Number(d.targetWeightKg) : null,
          mealsPerDay: Number(d.mealsPerDay),
          dislikes: d.dislikes,
          allergies: d.allergies,
          vegetarian: d.vegetarian,
          budget: Number(d.budget),
        });
        if (result.error) setError(result.error);
        else {
          setNotice(result.success ?? "Settings saved.");
          router.refresh();
        }
      } catch {
        setError("Could not save your settings. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-6">
      <section className="space-y-4">
        <div><h2 className="text-lg font-semibold">Account and body profile</h2><p className="text-sm text-muted">These details are used to estimate your nutrition targets.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Username
            <input className="input mt-1" value={d.username} onChange={(e) => set("username", e.target.value)} minLength={3} maxLength={20} pattern="[A-Za-z0-9_.-]+" required />
            <span className="mt-1 block text-xs font-normal text-muted">3–20 characters; letters, numbers, dots, underscores, and hyphens.</span>
          </label>
          <label className="block text-sm font-medium">Age
            <input type="number" className="input mt-1" min="15" max="80" value={d.age} onChange={(e) => set("age", e.target.value)} required />
          </label>
          <label className="block text-sm font-medium">Sex used for calorie estimate
            <select className="input mt-1" value={d.sex} onChange={(e) => set("sex", e.target.value)}><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
          </label>
          <label className="block text-sm font-medium">Height (cm)
            <input type="number" className="input mt-1" min="120" max="230" step="0.1" value={d.heightCm} onChange={(e) => set("heightCm", e.target.value)} required />
          </label>
          <label className="block text-sm font-medium">Current weight (kg)
            <input type="number" className="input mt-1" min="35" max="250" step="0.1" value={d.weightKg} onChange={(e) => set("weightKg", e.target.value)} required />
          </label>
          <label className="block text-sm font-medium">Activity level
            <select className="input mt-1" value={d.activity} onChange={(e) => set("activity", e.target.value)}>{ACTIVITY.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-5">
        <div><h2 className="text-lg font-semibold">Goal and budget</h2><p className="text-sm text-muted">Caloriq will recalculate calorie and macro targets after saving.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Main goal
            <select className="input mt-1" value={d.goal} onChange={(e) => set("goal", e.target.value)}><option value="LOSE">Lose weight</option><option value="MAINTAIN">Maintain weight</option><option value="GAIN">Gain weight</option></select>
          </label>
          <label className="block text-sm font-medium">Target weight (kg, optional)
            <input type="number" className="input mt-1" min="35" max="250" step="0.1" value={d.targetWeightKg} onChange={(e) => set("targetWeightKg", e.target.value)} placeholder="e.g. 75" />
          </label>
          <label className="block text-sm font-medium">Daily food budget (Rp)
            <input type="number" className="input mt-1" min="10000" max="500000" step="1000" value={d.budget} onChange={(e) => set("budget", e.target.value)} required />
          </label>
          <label className="block text-sm font-medium">Meals per day
            <select className="input mt-1" value={d.mealsPerDay} onChange={(e) => set("mealsPerDay", e.target.value)}><option value="2">2 meals</option><option value="3">3 meals</option><option value="4">4 meals</option></select>
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-5">
        <div><h2 className="text-lg font-semibold">Food preferences</h2><p className="text-sm text-muted">Meal generation will use these preferences when you regenerate a day.</p></div>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-primary" checked={d.vegetarian} onChange={(e) => set("vegetarian", e.target.checked)} /> Vegetarian (no meat or fish)</label>
        <div><p className="mb-2 text-sm font-medium">Allergies</p><div className="flex flex-wrap gap-2">{ALLERGENS.map((allergen) => {
          const selected = d.allergies.includes(allergen);
          return <button key={allergen} type="button" onClick={() => set("allergies", selected ? d.allergies.filter((item) => item !== allergen) : [...d.allergies, allergen])} className={`rounded-full border px-3 py-1.5 text-sm capitalize ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-bg"}`}>{allergen}</button>;
        })}</div></div>
        <label className="block text-sm font-medium">Foods you dislike
          <input className="input mt-1" maxLength={200} value={d.dislikes} onChange={(e) => set("dislikes", e.target.value)} placeholder="e.g. broccoli, tuna" />
          <span className="mt-1 block text-xs font-normal text-muted">Separate foods with commas.</span>
        </label>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">{notice}</p>}
      <button className="btn w-full sm:w-auto" disabled={pending}>{pending ? "Saving settings…" : "Save settings"}</button>
    </form>
  );
}
