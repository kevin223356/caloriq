# Caloriq — Full Prototype

Caloriq is a student-focused meal-planning web app. It creates meal plans from body metrics, nutrition targets, food preferences, and a daily food budget. Nutrition and prices are estimates for a prototype, not medical advice or live supermarket prices.

## Features

- Username/email registration, login, and logout
- Onboarding with age, height, weight, activity, goal, food preferences, allergies, and budget
- BMR/TDEE and daily calorie/macronutrient target calculation
- Today's plan: mark meals eaten, skip/undo, replace meals, and add/remove extra food logs
- 7-day meal planner with per-day regeneration
- Grocery list that combines repeated ingredients and saves checklist progress in the database
- Weight tracking with a trend chart and dated weight entries
- Searchable 162-food catalogue with additional Indonesian dishes, snacks, protein options and vegetables; category/vegetarian filters and one-click food logging
- Settings to update username, body details, goal, budget, and food preferences; targets recalculate after saving
- Password change
- SQLite for local development and a PostgreSQL schema prepared for Supabase

## Requirements

- Node.js 20+ (Node.js 22 or 24 recommended)
- npm

## Run locally with SQLite

1. Open a terminal in the project folder.
2. Install packages:

   ```powershell
   npm install
   ```

3. Create `.env` from `.env.example` if it does not exist. Keep `DATABASE_URL="file:./dev.db"` and set `AUTH_SECRET` to a long random value (32+ characters). If you already have a `.env`, do not overwrite it.
4. Create/update the local database and seed the food catalogue:

   ```powershell
   npm run db:setup
   ```

5. Start the app:

   ```powershell
   npm run dev
   ```

6. Open http://localhost:3000.

Demo login after seeding:

- Email: `demo@caloriq.test`
- Password: `demo1234`

Existing local data is stored in `prisma/dev.db`. Back it up before changing database schemas or switching database providers.

## Use an online PostgreSQL database with Supabase

The project includes `prisma/schema.postgresql.prisma`. You need to create a Supabase project under your own account; the app cannot connect until you put your database connection strings in `.env`.

1. Create a project at [Supabase](https://supabase.com/) and open **Project Settings → Database → Connection string**.
2. Copy a **Transaction Pooler** URL for `DATABASE_URL` (usually port `6543`). Add `?pgbouncer=true&connection_limit=1` if those options are not already present.
3. Copy a **Direct connection** URL for `DIRECT_URL` (usually port `5432`). If the direct host is not reachable on your network, use Supabase's **Session Pooler** URL for the CLI connection.
4. Put the two URLs in `.env`, and keep a strong `AUTH_SECRET`. URL-encode special characters in the database password.
5. Run:

   ```powershell
   npm run db:setup:postgres
   npm run dev
   ```

This generates Prisma Client for PostgreSQL, creates the tables, and seeds the food catalogue and demo user. Once switched to PostgreSQL, keep using the `:postgres` database scripts; the default scripts target SQLite and regenerate the SQLite client. For a production build against PostgreSQL, use `npm run build:postgres` (not `npm run build`).

Prisma schema documentation: https://www.prisma.io/docs/orm/v6/overview/databases/supabase
Supabase database documentation: https://supabase.com/docs/guides/database/overview

## Notes / prototype limits

- All food nutrition values, recipe allergens, portion weights and prices are rough demonstration estimates. Different vendors and preparation methods may differ significantly. Verify for any real diet or food allergy.
- New `MEAL` foods (e.g. nasi goreng, soto, ketoprak) are complete prepared dishes and `SNACK` foods are ready-to-eat items. The Grocery List shows these as purchasable items; it does not generate their separate recipes.
- Re-running `npm run db:seed` adds/updates the food catalogue without deleting existing user accounts or plans. Regenerate a day or create a new account to see more food combinations in plans.
- Grocery totals are based on the current seven-day plan; users should confirm quantities and prices before shopping.
- The project uses a simple JWT cookie session and is a learning prototype, not a security-audited production service.
- Updating preferences recalculates targets; use **Regenerate day** in Weekly Plan to regenerate meals with the new preferences.
- This project does not yet include live restaurant/catering integrations, payments, or medical nutrition advice.

## Upgrading an existing local installation (without resetting accounts)

1. Back up your existing `prisma/dev.db` and `.env`.
2. Copy only the updated source/config files from this ZIP into your existing Caloriq folder (do not replace `.env` or `prisma/dev.db`).
3. Run `npm install` if dependencies are missing, then run **`npm run db:seed`** to add/update 162 foods without resetting the demo user's meal plan. No database schema migration is required.
4. Restart the app (`npm run dev`, or `npm run build` followed by `npm run start`).
5. Open **Foods** to see the updated catalogue; use **Regenerate day** on a day you have not marked as eaten to populate the plan with new options.

For a **fresh PC**, copy `.env.example` to `.env`, set a unique random `AUTH_SECRET`, then run `npm install`, `npm run db:setup`, and `npm run dev` (or build/start). The archive intentionally excludes local credentials, database files, Next.js build cache, and installed dependencies.
