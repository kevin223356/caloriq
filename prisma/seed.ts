import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FOODS } from "../src/data/foods";
import { calcTargets } from "../src/lib/nutrition";
import { createDayPlan, startOfDay } from "../src/lib/plan";

const db = new PrismaClient();

async function main() {
  for (const f of FOODS) await db.food.upsert({ where: { name: f.name }, create: f, update: f });
  console.log(`Seeded ${FOODS.length} foods.`);

  // Seed is safe to repeat: never overwrite existing account settings or plans.
  const email = "demo@caloriq.test";
  const t = calcTargets({ age: 20, sex: "MALE", heightCm: 175, weightKg: 80, activity: "MODERATE", goal: "LOSE" });
  const user = await db.user.upsert({
    where: { email },
    create: { username: "caloriq_demo", email, passwordHash: await bcrypt.hash("demo1234", 10) },
    update: {},
  });
  const fields = {
    age: 20, sex: "MALE", heightCm: 175, weightKg: 80, startWeightKg: 80, activityLevel: "MODERATE", goal: "LOSE",
    targetWeightKg: 72, dailyBudget: 50000, mealsPerDay: 4, bmr: t.bmr, tdee: t.tdee,
    calorieTarget: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG,
  };
  await db.userProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...fields }, update: {} });
  const today = startOfDay();
  await db.weightLog.upsert({ where: { userId_date: { userId: user.id, date: today } }, create: { userId: user.id, date: today, weightKg: 80 }, update: {} });
  const existingDay = await db.mealPlanDay.findFirst({
    where: { plan: { userId: user.id }, date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
  });
  if (!existingDay) await createDayPlan(db, user.id);
  console.log(`Demo user ready: ${email} / demo1234 (target ${t.calories} kcal)`);
}
main().finally(() => db.$disconnect());
