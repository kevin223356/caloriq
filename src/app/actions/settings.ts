"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calcTargets } from "@/lib/nutrition";
import { startOfDay } from "@/lib/plan";
import { settingsSchema } from "@/lib/validation";

export type ActionResult = { error?: string; success?: string };

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your settings." };
  const d = parsed.data;

  const taken = await db.user.findFirst({ where: { username: d.username, NOT: { id: user.id } }, select: { id: true } });
  if (taken) return { error: "That username is already taken." };

  const existing = await db.userProfile.findUnique({ where: { userId: user.id } });
  if (!existing) return { error: "Please finish onboarding before editing settings." };

  const targets = calcTargets({ age: d.age, sex: d.sex, heightCm: d.heightCm, weightKg: d.weightKg, activity: d.activity, goal: d.goal });
  const profileData = {
    age: d.age,
    sex: d.sex,
    heightCm: d.heightCm,
    weightKg: d.weightKg,
    activityLevel: d.activity,
    goal: d.goal,
    targetWeightKg: d.targetWeightKg,
    dailyBudget: d.budget,
    mealsPerDay: d.mealsPerDay,
    dislikes: d.dislikes.trim(),
    allergies: d.allergies.join(","),
    vegetarian: d.vegetarian,
    bmr: targets.bmr,
    tdee: targets.tdee,
    calorieTarget: targets.calories,
    proteinG: targets.proteinG,
    carbsG: targets.carbsG,
    fatG: targets.fatG,
  };

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { username: d.username } });
      await tx.userProfile.update({ where: { userId: user.id }, data: profileData });
      const today = startOfDay();
      await tx.weightLog.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        create: { userId: user.id, date: today, weightKg: d.weightKg },
        update: { weightKg: d.weightKg },
      });
    });
  } catch {
    return { error: "Could not save settings. Check whether that username is already in use, then try again." };
  }

  for (const path of ["/settings", "/dashboard", "/today", "/weekly", "/grocery", "/progress"]) revalidatePath(path);
  return { success: "Settings saved. Your calorie and macro targets have been recalculated." };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "New passwords do not match.", path: ["confirmPassword"] });

export async function changePassword(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the password fields." };
  const current = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!current || !(await bcrypt.compare(parsed.data.currentPassword, current.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) } });
  revalidatePath("/settings");
  return { success: "Password changed successfully." };
}
