import { redirect } from "next/navigation";
import { WeightTracker } from "@/components/WeightTracker";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay } from "@/lib/plan";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function ProgressPage() {
  const user = await requireUser();
  const profile = await db.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding");
  const rows = await db.weightLog.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 365 });
  const logs = rows.reverse().map((entry) => ({
    id: entry.id,
    dateKey: dateKey(entry.date),
    dateLabel: entry.date.toLocaleDateString("en-ID", { day: "numeric", month: "short", year: "numeric" }),
    weightKg: entry.weightKg,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Your journey</p>
        <h1 className="mt-1 text-2xl font-bold">Progress tracking</h1>
        <p className="mt-1 text-muted">Track your weight over time. Daily fluctuations are normal; focus on the longer-term trend.</p>
      </div>
      <WeightTracker logs={logs} targetWeightKg={profile.targetWeightKg} todayKey={dateKey(startOfDay())} />
    </div>
  );
}
