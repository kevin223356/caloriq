import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(20, "Username must be 20 characters or fewer.").regex(/^[a-zA-Z0-9_.-]+$/, "Use only letters, numbers, dots, underscores, and hyphens.").transform((value) => value.toLowerCase()),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const onboardingSchema = z.object({
  age: z.number().int().min(15, "Caloriq is for ages 15 and up.").max(80, "Age must be 80 or below."),
  sex: z.enum(["MALE", "FEMALE"]),
  heightCm: z.number().min(120, "Height must be 120–230 cm.").max(230, "Height must be 120–230 cm."),
  weightKg: z.number().min(35, "Weight must be 35–250 kg.").max(250, "Weight must be 35–250 kg."),
  activity: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "VERY", "EXTREME"]),
  goal: z.enum(["LOSE", "MAINTAIN", "GAIN"]),
  targetWeightKg: z.number().min(35).max(250).optional(),
  mealsPerDay: z.number().int().min(2).max(4),
  dislikes: z.string().max(200),
  allergies: z.array(z.enum(["egg", "dairy", "peanut", "seafood", "gluten", "soy"])),
  vegetarian: z.boolean(),
  budget: z.number().int().min(10000, "Minimum daily budget is Rp10,000.").max(500000, "Maximum daily budget is Rp500,000."),
});


export const settingsSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(20, "Username must be 20 characters or fewer.").regex(/^[a-zA-Z0-9_.-]+$/, "Use only letters, numbers, dots, underscores, and hyphens.").transform((value) => value.toLowerCase()),
  age: z.number().int().min(15, "Age must be at least 15.").max(80, "Age must be 80 or below."),
  sex: z.enum(["MALE", "FEMALE"]),
  heightCm: z.number().min(120, "Height must be 120–230 cm.").max(230, "Height must be 120–230 cm."),
  weightKg: z.number().min(35, "Weight must be 35–250 kg.").max(250, "Weight must be 35–250 kg."),
  activity: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "VERY", "EXTREME"]),
  goal: z.enum(["LOSE", "MAINTAIN", "GAIN"]),
  targetWeightKg: z.number().min(35).max(250).nullable(),
  mealsPerDay: z.number().int().min(2).max(4),
  dislikes: z.string().max(200),
  allergies: z.array(z.enum(["egg", "dairy", "peanut", "seafood", "gluten", "soy"])).max(6),
  vegetarian: z.boolean(),
  budget: z.number().int().min(10000, "Minimum daily budget is Rp10,000.").max(500000, "Maximum daily budget is Rp500,000."),
});
