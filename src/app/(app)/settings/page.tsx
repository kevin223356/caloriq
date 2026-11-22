import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { SettingsForm } from "@/components/SettingsForm";
import { db } from "@/lib/db";
import { DISCLAIMER } from "@/lib/nutrition";
import { requireUser } from "@/lib/session";
import { rupiah } from "@/lib/format";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await db.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Your account</p>
        <h1 className="mt-1 text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted">Update your profile, nutrition targets, budget, and preferences.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-muted">Daily calorie target</p><p className="mt-1 text-2xl font-bold">{profile.calorieTarget.toLocaleString("id-ID")} kcal</p></div>
        <div className="card"><p className="text-sm text-muted">Daily food budget</p><p className="mt-1 text-2xl font-bold">{rupiah(profile.dailyBudget)}</p></div>
        <div className="card"><p className="text-sm text-muted">Macro targets</p><p className="mt-1 text-lg font-bold">P {profile.proteinG} · C {profile.carbsG} · F {profile.fatG} g</p></div>
      </section>

      <section className="card">
        <p className="text-sm text-muted">Account email</p>
        <p className="mt-1 font-semibold">{user.email}</p>
        <p className="mt-1 text-xs text-muted">Email changes are not enabled in this prototype.</p>
      </section>

      <SettingsForm initial={{
        username: user.username,
        age: String(profile.age),
        sex: profile.sex,
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        activity: profile.activityLevel,
        goal: profile.goal,
        targetWeightKg: profile.targetWeightKg === null ? "" : String(profile.targetWeightKg),
        mealsPerDay: String(profile.mealsPerDay),
        dislikes: profile.dislikes,
        allergies: profile.allergies.split(",").map((item) => item.trim()).filter(Boolean),
        vegetarian: profile.vegetarian,
        budget: String(profile.dailyBudget),
      }} />

      <ChangePasswordForm />
      <p className="text-xs text-muted">{DISCLAIMER}</p>
    </div>
  );
}
