"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateDay } from "@/lib/mealGenerator";
import { splitList } from "@/lib/format";
import { startOfDay } from "@/lib/plan";

export async function regenerateWeekDay(dateKey: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.").safeParse(dateKey);
  if (!parsed.success) return { error: "Invalid date." };

  const [year, month, dayNumber] = parsed.data.split("-").map(Number);
  const date = new Date(year, month - 1, dayNumber);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== dayNumber) {
    return { error: "Invalid date." };
  }

  const today = startOfDay();
  const lastAllowed = new Date(today);
  lastAllowed.setDate(lastAllowed.getDate() + 6);
  if (date < today || date > lastAllowed) return { error: "You can only regenerate a day in the next 7 days." };

  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  const existingDay = await db.mealPlanDay.findFirst({
    where: { date: { gte: date, lt: end }, plan: { userId: user.id } },
    orderBy: { plan: { createdAt: "desc" } },
    include: { meals: true },
  });
  if (existingDay?.meals.some((meal) => meal.status === "EATEN")) {
    return { error: "This day has meals marked as eaten. Undo those statuses before regenerating it." };
  }

  const profile = await db.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Finish onboarding first." };
  const foods = await db.food.findMany();
  const meals = generateDay(
    foods,
    { allergies: splitList(profile.allergies), dislikes: splitList(profile.dislikes), vegetarian: profile.vegetarian },
    { calories: profile.calorieTarget, proteinG: profile.proteinG, budget: profile.dailyBudget, meals: profile.mealsPerDay },
  );
  if (!meals.length) return { error: "No foods match your preferences. Try removing some restrictions." };

  try {
    await db.$transaction(async (tx) => {
      await tx.mealPlanDay.deleteMany({ where: { date: { gte: date, lt: end }, plan: { userId: user.id } } });
      await tx.mealPlan.deleteMany({ where: { userId: user.id, days: { none: {} } } });
      await tx.mealPlan.create({
        data: {
          userId: user.id,
          days: {
            create: {
              date,
              meals: {
                create: meals.map((meal) => ({
                  type: meal.type,
                  name: meal.name,
                  items: { create: meal.items.map((item) => ({ foodId: item.food.id!, servings: item.servings })) },
                })),
              },
            },
          },
        },
      });
    });
  } catch {
    return { error: "Could not regenerate this day. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/weekly");
  revalidatePath("/grocery");
  return {};
}
