import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // comma-separated: "breakfast,lunch", "dinner", etc.
  calories: real("calories"),
  proteinG: real("protein_g"),
  carbsG: real("carbs_g"),
  fatG: real("fat_g"),
  prepNotes: text("prep_notes"),
  prepTimeMin: integer("prep_time_min"),
  servings: integer("servings").default(1),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mealId: integer("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  calories: real("calories"),
  proteinG: real("protein_g"),
  carbsG: real("carbs_g"),
  fatG: real("fat_g"),
  groceryCategory: text("grocery_category", {
    enum: ["produce", "dairy", "meat", "pantry", "frozen", "bakery", "beverages", "other"],
  }),
});

export const weeklyPlans = sqliteTable("weekly_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull().unique(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const planSlots = sqliteTable(
  "plan_slots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id").notNull().references(() => weeklyPlans.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday .. 6=Saturday
    mealType: text("meal_type", { enum: ["breakfast", "lunch", "dinner", "snack"] }).notNull(),
    mealId: integer("meal_id").references(() => meals.id, { onDelete: "set null" }),
    slotOrder: integer("slot_order").default(0),
  },
  (table) => [
    uniqueIndex("plan_day_type_order_idx").on(
      table.planId,
      table.dayOfWeek,
      table.mealType,
      table.slotOrder
    ),
  ]
);

export const storeProducts = sqliteTable("store_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  store: text("store", { enum: ["trader_joes", "whole_foods"] }).notNull(),
  productName: text("product_name").notNull(),
  ingredientMatch: text("ingredient_match"),
  priceCents: integer("price_cents"),
  unitSize: text("unit_size"),
  lastScrapedAt: text("last_scraped_at"),
  url: text("url"),
  manualEntry: integer("manual_entry").default(0),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  calorieTarget: integer("calorie_target").default(2000),
  proteinTargetG: integer("protein_target_g").default(150),
  carbsTargetG: integer("carbs_target_g").default(200),
  fatTargetG: integer("fat_target_g").default(65),
  dietaryRestrictions: text("dietary_restrictions").default("[]"),
  customAiInstructions: text("custom_ai_instructions").default(""),
  preferredStore: text("preferred_store", { enum: ["trader_joes", "whole_foods"] }).default("trader_joes"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// PDF imports - regular table for metadata
export const pdfImports = sqliteTable("pdf_imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  chunkCount: integer("chunk_count").default(0),
  importedAt: text("imported_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Meal history chunks - regular table backing FTS5
export const mealHistoryChunks = sqliteTable("meal_history_chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pdfImportId: integer("pdf_import_id").notNull().references(() => pdfImports.id, { onDelete: "cascade" }),
  chunkText: text("chunk_text").notNull(),
  chunkType: text("chunk_type", { enum: ["meal", "nutrition", "plan", "general"] }).default("general"),
  metadata: text("metadata").default("{}"),
});

// Type exports
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type PlanSlot = typeof planSlots.$inferSelect;
export type StoreProduct = typeof storeProducts.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;
export type PdfImport = typeof pdfImports.$inferSelect;
export type MealHistoryChunk = typeof mealHistoryChunks.$inferSelect;
