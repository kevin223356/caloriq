import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getWeekData } from "@/lib/week";
import { GroceryList } from "@/components/GroceryList";

export default async function GroceryPage() {
  const user = await requireUser();
  const data = await getWeekData(user.id);
  if (!data) redirect("/onboarding");

  const plannedDays = data.days.filter((day) => day.meals.length > 0).length;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Shopping helper</p>
        <h1 className="mt-1 text-2xl font-bold">Grocery List</h1>
        <p className="mt-1 text-muted">Ingredients are combined across your next 7 days, so repeated foods only appear once.</p>
      </div>
      <GroceryList items={data.groceryItems} dailyBudget={data.profile.dailyBudget} plannedDays={plannedDays} />
    </div>
  );
}
