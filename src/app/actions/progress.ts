"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay } from "@/lib/plan";

const weightSchema = z.object({
  weightKg: z.number().min(35, "Weight must be at least 35 kg.").max(250, "Weight must be 250 kg or below."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
});

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function saveWeightLog(input: unknown): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();
  const parsed = weightSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid weight." };
  const date = parseLocalDate(parsed.data.date);
  if (!date) return { error: "Choose a valid date." };
  if (date > startOfDay()) return { error: "You cannot log a weight in the future." };

  const profile = await db.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Finish onboarding first." };

  await db.weightLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, weightKg: parsed.data.weightKg },
    update: { weightKg: parsed.data.weightKg },
  });
  const latest = await db.weightLog.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } });
  if (latest) await db.userProfile.update({ where: { userId: user.id }, data: { weightKg: latest.weightKg } });
  revalidatePath("/progress");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: "Weight entry saved." };
}

export async function deleteWeightLog(id: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!id || id.length > 100) return { error: "Invalid weight entry." };
  const entry = await db.weightLog.findFirst({ where: { id, userId: user.id } });
  if (!entry) return { error: "Weight entry not found." };
  const remaining = await db.weightLog.count({ where: { userId: user.id } });
  if (remaining <= 1) return { error: "Keep at least one weight entry to track your progress." };
  await db.weightLog.delete({ where: { id: entry.id } });
  const latest = await db.weightLog.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } });
  if (latest) await db.userProfile.update({ where: { userId: user.id }, data: { weightKg: latest.weightKg } });
  revalidatePath("/progress");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return {};
}
