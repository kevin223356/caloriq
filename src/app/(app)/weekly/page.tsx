import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getWeekData } from "@/lib/week";
import { WeeklyPlanView } from "@/components/WeeklyPlanView";

export default async function WeeklyPage() {
  const user = await requireUser();
  const data = await getWeekData(user.id);
  if (!data) redirect("/onboarding");

  const successfulDays = data.days.filter((day) => day.meals.length > 0).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Meal planning</p>
          <h1 className="mt-1 text-2xl font-bold">Your next 7 days</h1>
          <p className="mt-1 text-muted">A week of meals based on your calorie target, preferences, and daily budget.</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted">Plan coverage</span>
          <p className="mt-0.5 font-semibold">{successfulDays}/7 days ready</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-muted">Weekly calories planned</p><p className="mt-1 text-2xl font-bold">{data.totals.kcal.toLocaleString("en-US")} <span className="text-sm font-medium text-muted">kcal</span></p></div>
        <div className="card"><p className="text-sm text-muted">Average daily protein</p><p className="mt-1 text-2xl font-bold">{Math.round(data.totals.protein / 7)} <span className="text-sm font-medium text-muted">g/day</span></p></div>
        <div className="card"><p className="text-sm text-muted">Estimated grocery total</p><p className="mt-1 text-2xl font-bold">Rp{data.totals.estimatedCost.toLocaleString("id-ID")}</p></div>
      </div>

      <WeeklyPlanView days={data.days} />
    </div>
  );
}
