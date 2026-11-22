import { db } from "./db";
import { createDayPlan, startOfDay } from "./plan";

const ORDER = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getWeekData(userId: string) {
  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  const today = startOfDay();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });

  const days = [];
  for (const date of dates) {
    const start = startOfDay(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const findDay = () => db.mealPlanDay.findFirst({
      where: { date: { gte: start, lt: end }, plan: { userId } },
      orderBy: { plan: { createdAt: "desc" } },
      include: { meals: { include: { items: { include: { food: true } } } } },
    });

    let day = await findDay();
    let planError: string | null = null;
    if (!day) {
      try {
        await createDayPlan(db, userId, start);
        day = await findDay();
      } catch (error) {
        planError = error instanceof Error ? error.message : "Could not generate this day's plan.";
      }
    }

    const meals = (day?.meals ?? [])
      .slice()
      .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
      .map((meal) => {
        const sum = (key: "calories" | "protein" | "carbs" | "fat" | "estimatedPrice") =>
          meal.items.reduce((total, item) => total + item.food[key] * item.servings, 0);
        return {
          id: meal.id,
          type: meal.type,
          name: meal.name,
          status: meal.status,
          kcal: Math.round(sum("calories")),
          protein: Math.round(sum("protein")),
          carbs: Math.round(sum("carbs")),
          fat: Math.round(sum("fat")),
          price: Math.round(sum("estimatedPrice")),
          items: meal.items.map((item) => ({
            foodId: item.food.id,
            name: item.food.name,
            category: item.food.category,
            servingSize: item.food.servingSize,
            servingGrams: item.food.servingGrams,
            servings: item.servings,
            pricePerServing: item.food.estimatedPrice,
          })),
        };
      });

    days.push({
      dateKey: dateKey(start),
      label: start.toLocaleDateString("en-GB", { weekday: "long" }),
      dateLabel: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      isToday: dateKey(start) === dateKey(today),
      meals,
      planError,
      totals: {
        kcal: meals.reduce((total, meal) => total + meal.kcal, 0),
        protein: meals.reduce((total, meal) => total + meal.protein, 0),
        carbs: meals.reduce((total, meal) => total + meal.carbs, 0),
        fat: meals.reduce((total, meal) => total + meal.fat, 0),
        price: meals.reduce((total, meal) => total + meal.price, 0),
      },
    });
  }

  const groceryMap = new Map<string, {
    foodId: string;
    name: string;
    category: string;
    servingSize: string;
    servingGrams: number;
    servings: number;
    pricePerServing: number;
  }>();

  for (const day of days) {
    for (const meal of day.meals) {
      if (meal.status === "SKIPPED") continue;
      for (const item of meal.items) {
        const existing = groceryMap.get(item.foodId);
        if (existing) existing.servings += item.servings;
        else groceryMap.set(item.foodId, { ...item });
      }
    }
  }

  const checkedRows = await db.groceryCheck.findMany({
    where: { userId, weekStart: today, checked: true },
    select: { foodId: true },
  });
  const checkedIds = new Set(checkedRows.map((row) => row.foodId));

  const groceryItems = Array.from(groceryMap.values())
    .map((item) => ({
      ...item,
      servings: Math.round(item.servings * 100) / 100,
      quantityGrams: Math.round(item.servings * item.servingGrams),
      estimatedCost: Math.round(item.servings * item.pricePerServing),
      checked: checkedIds.has(item.foodId),
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  return {
    profile,
    days,
    groceryItems,
    totals: {
      kcal: days.reduce((total, day) => total + day.totals.kcal, 0),
      protein: days.reduce((total, day) => total + day.totals.protein, 0),
      estimatedCost: groceryItems.reduce((total, item) => total + item.estimatedCost, 0),
    },
  };
}

