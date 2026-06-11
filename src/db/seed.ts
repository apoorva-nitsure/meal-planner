import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/mealplanner.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

const seedMeals = [
  {
    name: "Greek Yogurt Parfait",
    category: "breakfast" as const,
    calories: 350,
    proteinG: 25,
    carbsG: 40,
    fatG: 10,
    prepNotes: "Layer Greek yogurt, granola, and mixed berries",
    prepTimeMin: 5,
    servings: 1,
    ingredients: [
      { name: "Greek yogurt", quantity: 1, unit: "cup", groceryCategory: "dairy" as const },
      { name: "granola", quantity: 0.5, unit: "cup", groceryCategory: "pantry" as const },
      { name: "mixed berries", quantity: 0.75, unit: "cup", groceryCategory: "produce" as const },
      { name: "honey", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Avocado Toast with Eggs",
    category: "breakfast" as const,
    calories: 420,
    proteinG: 18,
    carbsG: 35,
    fatG: 24,
    prepNotes: "Toast sourdough, mash avocado, top with fried eggs and everything bagel seasoning",
    prepTimeMin: 10,
    servings: 1,
    ingredients: [
      { name: "sourdough bread", quantity: 2, unit: "slices", groceryCategory: "bakery" as const },
      { name: "avocado", quantity: 1, unit: "whole", groceryCategory: "produce" as const },
      { name: "eggs", quantity: 2, unit: "large", groceryCategory: "dairy" as const },
      { name: "everything bagel seasoning", quantity: 1, unit: "tsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Overnight Oats",
    category: "breakfast" as const,
    calories: 380,
    proteinG: 15,
    carbsG: 55,
    fatG: 12,
    prepNotes: "Mix oats, milk, chia seeds, and toppings. Refrigerate overnight.",
    prepTimeMin: 5,
    servings: 1,
    ingredients: [
      { name: "rolled oats", quantity: 0.5, unit: "cup", groceryCategory: "pantry" as const },
      { name: "almond milk", quantity: 0.75, unit: "cup", groceryCategory: "dairy" as const },
      { name: "chia seeds", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "banana", quantity: 1, unit: "whole", groceryCategory: "produce" as const },
      { name: "peanut butter", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Grilled Chicken Salad",
    category: "lunch" as const,
    calories: 450,
    proteinG: 40,
    carbsG: 20,
    fatG: 25,
    prepNotes: "Grill seasoned chicken breast, slice over mixed greens with veggies and vinaigrette",
    prepTimeMin: 20,
    servings: 1,
    ingredients: [
      { name: "chicken breast", quantity: 6, unit: "oz", groceryCategory: "meat" as const },
      { name: "mixed greens", quantity: 3, unit: "cups", groceryCategory: "produce" as const },
      { name: "cherry tomatoes", quantity: 0.5, unit: "cup", groceryCategory: "produce" as const },
      { name: "cucumber", quantity: 0.5, unit: "whole", groceryCategory: "produce" as const },
      { name: "olive oil", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "balsamic vinegar", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Turkey & Avocado Wrap",
    category: "lunch" as const,
    calories: 480,
    proteinG: 32,
    carbsG: 38,
    fatG: 22,
    prepNotes: "Layer turkey, avocado, spinach, and hummus in a whole wheat wrap",
    prepTimeMin: 10,
    servings: 1,
    ingredients: [
      { name: "whole wheat tortilla", quantity: 1, unit: "large", groceryCategory: "bakery" as const },
      { name: "sliced turkey", quantity: 4, unit: "oz", groceryCategory: "meat" as const },
      { name: "avocado", quantity: 0.5, unit: "whole", groceryCategory: "produce" as const },
      { name: "spinach", quantity: 1, unit: "cup", groceryCategory: "produce" as const },
      { name: "hummus", quantity: 2, unit: "tbsp", groceryCategory: "dairy" as const },
    ],
  },
  {
    name: "Quinoa Bowl",
    category: "lunch" as const,
    calories: 520,
    proteinG: 22,
    carbsG: 65,
    fatG: 18,
    prepNotes: "Cook quinoa, top with roasted vegetables, chickpeas, and tahini dressing",
    prepTimeMin: 30,
    servings: 1,
    ingredients: [
      { name: "quinoa", quantity: 0.75, unit: "cup", groceryCategory: "pantry" as const },
      { name: "chickpeas", quantity: 0.5, unit: "cup", groceryCategory: "pantry" as const },
      { name: "sweet potato", quantity: 1, unit: "medium", groceryCategory: "produce" as const },
      { name: "red bell pepper", quantity: 1, unit: "whole", groceryCategory: "produce" as const },
      { name: "tahini", quantity: 2, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Salmon with Roasted Vegetables",
    category: "dinner" as const,
    calories: 550,
    proteinG: 42,
    carbsG: 30,
    fatG: 28,
    prepNotes: "Season salmon with lemon and dill, bake at 400°F for 15 min alongside vegetables",
    prepTimeMin: 25,
    servings: 1,
    ingredients: [
      { name: "salmon fillet", quantity: 6, unit: "oz", groceryCategory: "meat" as const },
      { name: "broccoli", quantity: 1.5, unit: "cups", groceryCategory: "produce" as const },
      { name: "sweet potato", quantity: 1, unit: "medium", groceryCategory: "produce" as const },
      { name: "olive oil", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "lemon", quantity: 0.5, unit: "whole", groceryCategory: "produce" as const },
    ],
  },
  {
    name: "Chicken Stir-Fry",
    category: "dinner" as const,
    calories: 480,
    proteinG: 38,
    carbsG: 42,
    fatG: 16,
    prepNotes: "Stir-fry chicken and vegetables in sesame oil, serve over brown rice",
    prepTimeMin: 25,
    servings: 1,
    ingredients: [
      { name: "chicken breast", quantity: 6, unit: "oz", groceryCategory: "meat" as const },
      { name: "brown rice", quantity: 0.75, unit: "cup", groceryCategory: "pantry" as const },
      { name: "broccoli", quantity: 1, unit: "cup", groceryCategory: "produce" as const },
      { name: "bell pepper", quantity: 1, unit: "whole", groceryCategory: "produce" as const },
      { name: "soy sauce", quantity: 2, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "sesame oil", quantity: 1, unit: "tsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Spaghetti Bolognese",
    category: "dinner" as const,
    calories: 580,
    proteinG: 30,
    carbsG: 65,
    fatG: 20,
    prepNotes: "Simmer ground turkey with marinara, serve over whole wheat pasta",
    prepTimeMin: 30,
    servings: 1,
    ingredients: [
      { name: "whole wheat spaghetti", quantity: 3, unit: "oz", groceryCategory: "pantry" as const },
      { name: "ground turkey", quantity: 5, unit: "oz", groceryCategory: "meat" as const },
      { name: "marinara sauce", quantity: 0.5, unit: "cup", groceryCategory: "pantry" as const },
      { name: "garlic", quantity: 2, unit: "cloves", groceryCategory: "produce" as const },
      { name: "parmesan cheese", quantity: 2, unit: "tbsp", groceryCategory: "dairy" as const },
    ],
  },
  {
    name: "Beef Tacos",
    category: "dinner" as const,
    calories: 520,
    proteinG: 32,
    carbsG: 40,
    fatG: 24,
    prepNotes: "Season ground beef with taco spices, serve in corn tortillas with toppings",
    prepTimeMin: 20,
    servings: 2,
    ingredients: [
      { name: "ground beef (lean)", quantity: 8, unit: "oz", groceryCategory: "meat" as const },
      { name: "corn tortillas", quantity: 4, unit: "small", groceryCategory: "bakery" as const },
      { name: "cheddar cheese", quantity: 0.25, unit: "cup", groceryCategory: "dairy" as const },
      { name: "lettuce", quantity: 1, unit: "cup", groceryCategory: "produce" as const },
      { name: "tomato", quantity: 1, unit: "medium", groceryCategory: "produce" as const },
      { name: "sour cream", quantity: 2, unit: "tbsp", groceryCategory: "dairy" as const },
    ],
  },
  {
    name: "Shrimp & Veggie Pasta",
    category: "dinner" as const,
    calories: 490,
    proteinG: 35,
    carbsG: 50,
    fatG: 15,
    prepNotes: "Sauté shrimp and vegetables in garlic olive oil, toss with penne",
    prepTimeMin: 20,
    servings: 1,
    ingredients: [
      { name: "shrimp", quantity: 6, unit: "oz", groceryCategory: "meat" as const },
      { name: "penne pasta", quantity: 3, unit: "oz", groceryCategory: "pantry" as const },
      { name: "zucchini", quantity: 1, unit: "medium", groceryCategory: "produce" as const },
      { name: "cherry tomatoes", quantity: 0.5, unit: "cup", groceryCategory: "produce" as const },
      { name: "garlic", quantity: 3, unit: "cloves", groceryCategory: "produce" as const },
      { name: "olive oil", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Baked Chicken Thighs",
    category: "dinner" as const,
    calories: 440,
    proteinG: 36,
    carbsG: 25,
    fatG: 22,
    prepNotes: "Season thighs with paprika and herbs, bake at 425°F for 35 min with potatoes",
    prepTimeMin: 45,
    servings: 1,
    ingredients: [
      { name: "chicken thighs", quantity: 8, unit: "oz", groceryCategory: "meat" as const },
      { name: "baby potatoes", quantity: 6, unit: "oz", groceryCategory: "produce" as const },
      { name: "green beans", quantity: 1, unit: "cup", groceryCategory: "produce" as const },
      { name: "olive oil", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "paprika", quantity: 1, unit: "tsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Protein Smoothie",
    category: "snack" as const,
    calories: 280,
    proteinG: 30,
    carbsG: 30,
    fatG: 8,
    prepNotes: "Blend all ingredients until smooth",
    prepTimeMin: 5,
    servings: 1,
    ingredients: [
      { name: "protein powder", quantity: 1, unit: "scoop", groceryCategory: "pantry" as const },
      { name: "banana", quantity: 1, unit: "whole", groceryCategory: "produce" as const },
      { name: "almond milk", quantity: 1, unit: "cup", groceryCategory: "dairy" as const },
      { name: "peanut butter", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Trail Mix",
    category: "snack" as const,
    calories: 200,
    proteinG: 6,
    carbsG: 18,
    fatG: 14,
    prepNotes: "Mix almonds, walnuts, dried cranberries, and dark chocolate chips",
    prepTimeMin: 2,
    servings: 1,
    ingredients: [
      { name: "almonds", quantity: 0.25, unit: "cup", groceryCategory: "pantry" as const },
      { name: "walnuts", quantity: 2, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "dried cranberries", quantity: 2, unit: "tbsp", groceryCategory: "pantry" as const },
      { name: "dark chocolate chips", quantity: 1, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Apple & Peanut Butter",
    category: "snack" as const,
    calories: 250,
    proteinG: 8,
    carbsG: 30,
    fatG: 14,
    prepNotes: "Slice apple and serve with peanut butter for dipping",
    prepTimeMin: 3,
    servings: 1,
    ingredients: [
      { name: "apple", quantity: 1, unit: "medium", groceryCategory: "produce" as const },
      { name: "peanut butter", quantity: 2, unit: "tbsp", groceryCategory: "pantry" as const },
    ],
  },
  {
    name: "Hummus & Veggie Plate",
    category: "snack" as const,
    calories: 220,
    proteinG: 8,
    carbsG: 24,
    fatG: 12,
    prepNotes: "Serve hummus with sliced carrots, celery, and bell pepper strips",
    prepTimeMin: 5,
    servings: 1,
    ingredients: [
      { name: "hummus", quantity: 0.25, unit: "cup", groceryCategory: "dairy" as const },
      { name: "carrots", quantity: 2, unit: "medium", groceryCategory: "produce" as const },
      { name: "celery", quantity: 2, unit: "stalks", groceryCategory: "produce" as const },
      { name: "bell pepper", quantity: 0.5, unit: "whole", groceryCategory: "produce" as const },
    ],
  },
];

async function seed() {
  console.log("Seeding database...");

  for (const meal of seedMeals) {
    const { ingredients: mealIngredients, ...mealData } = meal;
    const [result] = await db
      .insert(schema.meals)
      .values(mealData)
      .returning();

    for (const ing of mealIngredients) {
      await db.insert(schema.ingredients).values({
        mealId: result.id,
        ...ing,
      });
    }
    console.log(`  Added: ${meal.name}`);
  }

  await db.insert(schema.userPreferences)
    .values({
      calorieTarget: 2200,
      proteinTargetG: 150,
      carbsTargetG: 220,
      fatTargetG: 75,
      dietaryRestrictions: "[]",
      preferredStore: "trader_joes",
    });
  console.log("  Added: default user preferences");

  console.log("Seeding complete!");
}

seed();
