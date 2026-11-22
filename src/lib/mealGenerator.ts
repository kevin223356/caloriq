import type { FoodRow } from "../data/foods";

export type MealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER";
export interface Prefs { allergies: string[]; dislikes: string[]; vegetarian: boolean }
export interface Target { calories: number; proteinG: number; budget: number; meals: number }
export interface GeneratedMeal {
  type: MealType; name: string;
  items: { food: FoodRow; servings: number }[];
  calories: number; protein: number; carbs: number; fat: number; price: number;
}
type K = "calories" | "protein" | "carbs" | "fat" | "estimatedPrice";

const SPLITS: Record<number, [MealType, number][]> = {
  2: [["LUNCH", 0.5], ["DINNER", 0.5]],
  3: [["BREAKFAST", 0.3], ["LUNCH", 0.4], ["DINNER", 0.3]],
  4: [["BREAKFAST", 0.25], ["LUNCH", 0.35], ["SNACK", 0.1], ["DINNER", 0.3]],
};

export function filterFoods(foods: FoodRow[], p: Prefs) {
  const allergies = p.allergies.map((a) => a.trim().toLowerCase()).filter(Boolean);
  const dislikes = p.dislikes.map((d) => d.trim().toLowerCase()).filter(Boolean);
  return foods.filter((f) => {
    const tags = f.allergens.toLowerCase().split(",").map((a) => a.trim());
    return (!p.vegetarian || f.vegetarian) &&
      !allergies.some((a) => tags.includes(a)) &&
      !dislikes.some((d) => f.name.toLowerCase().includes(d));
  });
}

const sum = (items: GeneratedMeal["items"], k: K) => items.reduce((s, i) => s + i.food[k] * i.servings, 0);
const pick = <T,>(arr: T[], rnd: () => number) => arr[Math.min(arr.length - 1, Math.floor(rnd() * arr.length))];
const portions = (wanted: number, perServing: number, max = 2.5) =>
  Math.min(max, Math.max(0.5, Math.round((wanted / Math.max(1, perServing)) * 2) / 2));

function summarize(type: MealType, items: GeneratedMeal["items"]): GeneratedMeal {
  const named = items.map((i) => i.food.name.replace(/ \(.*\)/, ""));
  return {
    type, name: named.join(" + "), items,
    calories: Math.round(sum(items, "calories")), protein: Math.round(sum(items, "protein")),
    carbs: Math.round(sum(items, "carbs")), fat: Math.round(sum(items, "fat")),
    price: Math.round(sum(items, "estimatedPrice")),
  };
}

// Breakfast pairings keep oatmeal/bread with eggs/dairy instead of random fish/tempe combinations.
const BREAKFAST_WESTERN_CARBS = ["Oatmeal", "Bread (white)", "Bread (whole wheat)"];
const BREAKFAST_DISHES = new Set([
  "Nasi goreng ayam", "Nasi goreng telur", "Nasi uduk telur", "Nasi kuning ayam",
  "Nasi pecel telur", "Bubur ayam", "Nasi tim ayam", "Ketoprak",
  "Lontong sayur", "Soto ayam + nasi", "Mie ayam", "Nasi telur balado",
  "Nasi tahu tempe + sayur", "Gado-gado + lontong", "Bakmi Jawa rebus",
]);
function chooseProtein(type: MealType, carb: FoodRow, proteins: FoodRow[], rnd: () => number) {
  let options = proteins;
  if (type === "BREAKFAST") {
    if (BREAKFAST_WESTERN_CARBS.includes(carb.name)) {
      options = proteins.filter((f) => /egg|telur|milk|yogurt/i.test(f.name));
    } else {
      options = proteins.filter((f) => /egg|telur|tahu|tofu|tempe|kacang|edamame/i.test(f.name));
    }
  } else {
    // Avoid milk and yogurt alongside rice and cooked vegetables.
    options = proteins.filter((f) => !/milk|yogurt|peanut butter/i.test(f.name));
  }
  return options.length ? pick(options, rnd) : (proteins.length ? pick(proteins, rnd) : null);
}

/** Generates a meal from suitable ingredients OR a complete Indonesian dish (category MEAL).
 * Ready-made MEAL and SNACK items are treated as single prepared foods; we don't
 * combine nasi goreng, soto, etc. with unrelated rice and vegetable sides.
 */
export function buildMeal(type: MealType, kcal: number, pool: FoodRow[], rnd = Math.random, exclude: string[] = [], maxPrice = Infinity): GeneratedMeal | null {
  const by = (c: string) => pool.filter((f) => f.category === c && !exclude.includes(f.name));
  const proteins = by("PROTEIN"), carbs = by("CARB"), veg = by("VEGETABLE"), fruit = by("FRUIT");
  const preparedPool = by(type === "SNACK" ? "SNACK" : "MEAL");
  const prepared = type === "BREAKFAST" ? preparedPool.filter((f) => BREAKFAST_DISHES.has(f.name)) : preparedPool;
  const snacks = by("SNACK");
  if (!carbs.length && !proteins.length && !prepared.length && !fruit.length && !snacks.length) return null;

  // Some days include authentic ready-made dishes; others build ingredient-based meals.
  const choosePrepared = prepared.length > 0 && (type === "SNACK" ? rnd() < 0.65 : rnd() < (type === "BREAKFAST" ? 0.4 : 0.55));
  const score = (m: GeneratedMeal) => Math.abs(m.calories - kcal) / Math.max(1, kcal) +
    (m.price > maxPrice ? 1.25 + (m.price - maxPrice) / Math.max(1, maxPrice) : 0) - m.protein / 400;
  let best: GeneratedMeal | null = null;

  for (let n = 0; n < 35; n++) {
    const items: GeneratedMeal["items"] = [];
    if (choosePrepared) {
      const affordable = prepared.filter((f) => f.estimatedPrice <= maxPrice * 1.2);
      const food = pick(affordable.length ? affordable : prepared, rnd);
      items.push({ food, servings: portions(kcal, food.calories, 2) });
    } else if (type === "SNACK") {
      if (fruit.length) items.push({ food: pick(fruit, rnd), servings: 1 });
      const light = proteins.filter((f) => f.calories < 170 && !/kacang tanah/i.test(f.name));
      if (light.length) items.push({ food: pick(light, rnd), servings: 1 });
      if (!items.length && snacks.length) {
        const food = pick(snacks, rnd);
        items.push({ food, servings: portions(kcal, food.calories, 2) });
      }
    } else {
      const appropriateCarbs = type === "BREAKFAST" ? carbs : carbs.filter((f) => !BREAKFAST_WESTERN_CARBS.includes(f.name));
      const selectedCarbs = appropriateCarbs.length ? appropriateCarbs : carbs;
      if (selectedCarbs.length) {
        const carb = pick(selectedCarbs, rnd);
        const protein = chooseProtein(type, carb, proteins, rnd);
        if (protein) items.push({ food: protein, servings: 1 });
        items.push({ food: carb, servings: 1 });
      } else if (proteins.length) items.push({ food: pick(proteins, rnd), servings: 1 });
      if (veg.length && type !== "BREAKFAST") items.push({ food: pick(veg, rnd), servings: 1 });
      if (fruit.length && type === "BREAKFAST" && items.some((i) => BREAKFAST_WESTERN_CARBS.includes(i.food.name))) {
        items.push({ food: pick(fruit, rnd), servings: 1 });
      }
    }
    if (!items.length) continue;
    if (!choosePrepared && type !== "SNACK") {
      const main = items.find((i) => i.food.category === "CARB") ?? items[0];
      const rest = sum(items.filter((i) => i !== main), "calories");
      main.servings = portions(kcal - rest, main.food.calories, 3);
    }
    const meal = summarize(type, items);
    if (!best || score(meal) < score(best)) best = meal;
  }
  return best;
}

/** One day: use different main items when possible, respecting food preferences and budget. */
export function generateDay(foods: FoodRow[], prefs: Prefs, t: Target, rnd = Math.random): GeneratedMeal[] {
  const pool = filterFoods(foods, prefs);
  const split = SPLITS[Math.min(4, Math.max(2, t.meals))];
  const used: string[] = [];
  const meals: GeneratedMeal[] = [];
  for (const [type, share] of split) {
    const meal = buildMeal(type, t.calories * share, pool, rnd, used, t.budget * share * 1.1) ??
      buildMeal(type, t.calories * share, pool, rnd, [], t.budget * share * 1.1);
    if (meal) {
      meals.push(meal);
      used.push(...meal.items.map((i) => i.food.name));
    }
  }
  for (let i = 0; i < 15 && meals.length && meals.reduce((s, m) => s + m.price, 0) > t.budget; i++) {
    const idx = meals.reduce((hi, m, k) => (m.price > meals[hi].price ? k : hi), 0);
    const cheaper = buildMeal(meals[idx].type, meals[idx].calories, pool, rnd, [], meals[idx].price - 1);
    if (cheaper && cheaper.price < meals[idx].price) meals[idx] = cheaper;
  }
  return meals;
}

/** Replace a meal with a different dish or protein, avoiding the same ready-made meal. */
export function replaceMeal(current: GeneratedMeal, foods: FoodRow[], prefs: Prefs, rnd = Math.random) {
  const used = current.items
    .filter((i) => i.food.category === "PROTEIN" || i.food.category === "MEAL" || i.food.category === "SNACK")
    .map((i) => i.food.name);
  return buildMeal(current.type, current.calories, filterFoods(foods, prefs), rnd, used, current.price * 1.1) ?? current;
}
