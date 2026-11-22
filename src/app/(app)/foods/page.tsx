import { FoodBrowser } from "@/components/FoodBrowser";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FoodsPage() {
  const user = await requireUser();
  const profile = await db.userProfile.findUnique({ where: { userId: user.id }, select: { userId: true } });
  if (!profile) redirect("/onboarding");
  const foods = await db.food.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Nutrition database</p>
        <h1 className="mt-1 text-2xl font-bold">Foods</h1>
        <p className="mt-1 text-muted">Browse foods, compare macros and estimated prices, and add anything you eat to today&apos;s log.</p>
      </div>
      <FoodBrowser foods={foods} />
    </div>
  );
}
