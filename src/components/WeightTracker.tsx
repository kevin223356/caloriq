"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWeightLog, saveWeightLog } from "@/app/actions/progress";

type WeightEntry = { id: string; dateKey: string; dateLabel: string; weightKg: number };

export function WeightTracker({ logs, targetWeightKg, todayKey }: { logs: WeightEntry[]; targetWeightKg: number | null; todayKey: string }) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayKey);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ordered = useMemo(() => [...logs].sort((a, b) => a.dateKey.localeCompare(b.dateKey)), [logs]);
  const first = ordered[0];
  const latest = ordered[ordered.length - 1];
  const change = first && latest ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;
  const min = ordered.length ? Math.min(...ordered.map((item) => item.weightKg)) - 1 : 0;
  const max = ordered.length ? Math.max(...ordered.map((item) => item.weightKg)) + 1 : 1;
  const points = ordered.map((item, index) => {
    const x = 44 + (index / Math.max(1, ordered.length - 1)) * 552;
    const y = 172 - ((item.weightKg - min) / Math.max(1, max - min)) * 118;
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    start(async () => {
      try {
        const result = await saveWeightLog({ weightKg: Number(weight), date });
        if (result.error) setError(result.error);
        else {
          setNotice(result.success ?? "Weight saved.");
          setWeight("");
          router.refresh();
        }
      } catch {
        setError("Could not save this weight entry. Please try again.");
      }
    });
  }

  function remove(id: string) {
    setError(""); setNotice(""); setDeletingId(id);
    start(async () => {
      try {
        const result = await deleteWeightLog(id);
        if (result.error) setError(result.error);
        else { setNotice("Weight entry removed."); router.refresh(); }
      } catch {
        setError("Could not remove this entry. Please try again.");
      } finally { setDeletingId(null); }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-muted">Latest weight</p><p className="mt-1 text-2xl font-bold">{latest ? `${latest.weightKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg` : "—"}</p><p className="mt-1 text-xs text-muted">{latest?.dateLabel ?? "Log your first entry"}</p></div>
        <div className="card"><p className="text-sm text-muted">Change since first log</p><p className={`mt-1 text-2xl font-bold ${change < 0 ? "text-primary" : change > 0 ? "text-secondary" : ""}`}>{first && latest ? `${change > 0 ? "+" : ""}${change.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg` : "—"}</p><p className="mt-1 text-xs text-muted">{logs.length} weight entries</p></div>
        <div className="card"><p className="text-sm text-muted">Target weight</p><p className="mt-1 text-2xl font-bold">{targetWeightKg ? `${targetWeightKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg` : "Not set"}</p><p className="mt-1 text-xs text-muted">Set it in Settings</p></div>
      </div>

      <section className="card space-y-4">
        <div><h2 className="text-lg font-semibold">Weight trend</h2><p className="text-sm text-muted">Use measurements taken under similar conditions for a more useful trend.</p></div>
        {ordered.length < 2 ? (
          <div className="rounded-xl bg-bg p-6 text-center"><p className="font-medium">Add another weigh-in to see your trend</p><p className="mt-1 text-sm text-muted">Your chart appears after at least two dated entries.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 640 220" role="img" aria-label="Weight trend chart" className="min-w-[500px] w-full text-primary">
              {[0, 1, 2, 3].map((tick) => {
                const y = 54 + tick * 39;
                const value = max - (tick / 3) * (max - min);
                return <g key={tick}><line x1="44" x2="596" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="4 4" /><text x="36" y={y + 4} textAnchor="end" fontSize="11" fill="currentColor">{value.toFixed(1)}</text></g>;
              })}
              <polyline points={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point) => <g key={point.id}><circle cx={point.x} cy={point.y} r="4.5" fill="currentColor" /><title>{point.dateLabel}: {point.weightKg} kg</title></g>)}
              <text x="44" y="205" fontSize="11" fill="currentColor">{ordered[0].dateLabel}</text>
              <text x="596" y="205" textAnchor="end" fontSize="11" fill="currentColor">{ordered[ordered.length - 1].dateLabel}</text>
            </svg>
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <div><h2 className="text-lg font-semibold">Log your weight</h2><p className="text-sm text-muted">You can add a past date or update an existing date.</p></div>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-sm font-medium">Weight (kg)<input type="number" className="input mt-1" min="35" max="250" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 82.5" required /></label>
          <label className="block text-sm font-medium">Date<input type="date" className="input mt-1" max={todayKey} value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save weight"}</button>
        </form>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</p>}

      <section className="card space-y-3">
        <div><h2 className="text-lg font-semibold">Recent entries</h2><p className="text-sm text-muted">Only your own weight entries are shown here.</p></div>
        {ordered.length === 0 ? <p className="text-sm text-muted">No weight entries yet.</p> : <div className="divide-y divide-border">{[...ordered].reverse().map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div><p className="font-medium">{entry.weightKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg</p><p className="text-sm text-muted">{entry.dateLabel}</p></div>
            <button className="btn-ghost !px-3 !py-2 text-sm" disabled={pending || deletingId === entry.id || ordered.length <= 1} onClick={() => remove(entry.id)}>{deletingId === entry.id ? "Removing…" : "Remove"}</button>
          </div>
        ))}</div>}
      </section>
    </div>
  );
}
