"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay } from "@/lib/plan";

export async function setGroceryChecks(input: unknown): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = z.object({ foodIds: z.array(z.string().min(1)).max(300), checked: z.boolean() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid grocery checklist request." };
  const today = startOfDay();
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  const requested = [...new Set(parsed.data.foodIds)];
  if (requested.length === 0) return {};

  const rows = await db.mealItem.findMany({
    where: {
      foodId: { in: requested },
      meal: { day: { date: { gte: today, lt: end }, plan: { userId: user.id } } },
    },
    select: { foodId: true },
    distinct: ["foodId"],
  });
  const validIds = rows.map((row) => row.foodId);
  if (validIds.length === 0) return { error: "These ingredients are no longer part of your current weekly plan." };

  if (parsed.data.checked) {
    await db.$transaction(validIds.map((foodId) => db.groceryCheck.upsert({
      where: { userId_weekStart_foodId: { userId: user.id, weekStart: today, foodId } },
      create: { userId: user.id, weekStart: today, foodId, checked: true },
      update: { checked: true },
    })));
  } else {
    await db.groceryCheck.deleteMany({ where: { userId: user.id, weekStart: today, foodId: { in: validIds } } });
  }
  revalidatePath("/grocery");
  return {};
}
