import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    title: "Personalized meal plans",
    description: "Menus built around your calorie target, food preferences, allergies, and body goal.",
  },
  {
    title: "Budget-aware food choices",
    description: "Designed for student budgets with affordable Indonesian foods and estimated daily cost.",
  },
  {
    title: "Simple progress tracking",
    description: "Track your weight, check your daily intake, and stay consistent without overcomplicating things.",
  },
];

const PREVIEW = [
  ["162 foods", "Indonesian-friendly meals, ingredients, snacks, fruits, and vegetables."],
  ["7-day planning", "Generate a weekly plan and rebuild one day whenever you want more variety."],
  ["Mobile friendly", "Works on desktop and on a phone so people can try the prototype anywhere."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-bg to-white">
      <section className="mx-auto grid min-h-[82vh] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            Meal planning for real student budgets
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Meals planned just for you
          </h1>
          <p className="mt-5 text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Caloriq turns your body goals, food preferences, and daily budget into a practical meal plan using familiar,
            affordable foods.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="btn w-full sm:w-auto">Build my meal plan</Link>
            <Link href="/login" className="btn-ghost w-full sm:w-auto">Log in</Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {PREVIEW.map(([label, text]) => (
              <div key={label} className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-lg font-bold text-primary">{label}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted">
            Nutrition values and food prices are estimates for this prototype.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-6 rounded-[2rem] bg-primary/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-xl sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="mx-auto shrink-0 rounded-[1.75rem] bg-white p-3 shadow-md sm:mx-0">
                <Image
                  src="/caloriq-logo.jpg"
                  alt="Caloriq logo"
                  width={220}
                  height={220}
                  className="h-36 w-36 rounded-2xl object-cover sm:h-40 sm:w-40"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Prototype preview</p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Caloriq</h2>
                <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                  A web app that helps users plan meals, track calories, manage budgets, and monitor progress using a food database suited for everyday meals in Indonesia.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-bg p-3">
                    <p className="text-xs text-muted">Daily focus</p>
                    <p className="mt-1 font-semibold">Calories, macros, budget</p>
                  </div>
                  <div className="rounded-2xl bg-bg p-3">
                    <p className="text-xs text-muted">Core feature</p>
                    <p className="mt-1 font-semibold">Meal plan generator</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <article key={feature.title} className="rounded-2xl bg-bg p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
