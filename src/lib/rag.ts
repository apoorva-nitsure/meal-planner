import { client, db, ftsReady } from "@/db";
import { mealHistoryChunks, pdfImports } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Chunk {
  text: string;
  type: "meal" | "nutrition" | "plan" | "general";
}

const MEAL_KEYWORDS = [
  "breakfast", "lunch", "dinner", "snack", "meal", "recipe",
  "chicken", "salmon", "paneer", "tofu", "pasta", "salad", "rice", "oats",
  "eggs", "yogurt", "smoothie", "soup", "sandwich", "wrap", "bowl",
  "thalipeeth", "bhurji", "paratha", "khichadi", "poli", "bhaji",
  "dal", "sprouts", "avocado",
];

const NUTRITION_KEYWORDS = [
  "protein", "carbs", "carbohydrate", "fat", "calories", "kcal",
  "macro", "fiber", "sodium", "sugar", "vitamin", "mineral",
];

const PLAN_KEYWORDS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "week", "day 1", "day 2", "day 3", "day 4", "day 5", "day 6", "day 7",
  "meal plan", "weekly", "schedule",
];

function classifyChunk(text: string): Chunk["type"] {
  const lower = text.toLowerCase();
  const mealScore = MEAL_KEYWORDS.filter((k) => lower.includes(k)).length;
  const nutritionScore = NUTRITION_KEYWORDS.filter((k) => lower.includes(k)).length;
  const planScore = PLAN_KEYWORDS.filter((k) => lower.includes(k)).length;

  const max = Math.max(mealScore, nutritionScore, planScore);
  if (max === 0) return "general";
  if (planScore === max) return "plan";
  if (mealScore === max) return "meal";
  return "nutrition";
}

export function chunkText(rawText: string, maxChunkSize = 500): Chunk[] {
  const text = rawText.trim();
  if (!text || text.length < 20) return [];

  const weekPattern = /(?=Week\s+\d+)/gi;
  const weekChunks = text.split(weekPattern).filter((s) => s.trim().length > 10);

  if (weekChunks.length >= 3) {
    return mergeAndClassify(weekChunks, maxChunkSize);
  }

  const dayPattern = /(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s)/gi;
  const dayChunks = text.split(dayPattern).filter((s) => s.trim().length > 10);

  if (dayChunks.length >= 3) {
    return mergeAndClassify(dayChunks, maxChunkSize);
  }

  const paragraphs = text.split(/\n{2,}/).filter((s) => s.trim().length > 10);

  if (paragraphs.length >= 3) {
    return mergeAndClassify(paragraphs, maxChunkSize);
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 5);

  if (sentences.length >= 3) {
    return mergeAndClassify(sentences, maxChunkSize);
  }

  return fixedSizeChunk(text, maxChunkSize);
}

function mergeAndClassify(segments: string[], maxChunkSize: number): Chunk[] {
  const chunks: Chunk[] = [];
  let current = "";

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    if (current && (current.length + trimmed.length + 1) > maxChunkSize) {
      if (current.length > 20) {
        chunks.push({ text: current.trim(), type: classifyChunk(current) });
      }
      current = trimmed;
    } else {
      current += (current ? "\n" : "") + trimmed;
    }
  }

  if (current.trim().length > 20) {
    chunks.push({ text: current.trim(), type: classifyChunk(current) });
  }

  const finalChunks: Chunk[] = [];
  for (const chunk of chunks) {
    if (chunk.text.length <= maxChunkSize * 2) {
      finalChunks.push(chunk);
    } else {
      finalChunks.push(...fixedSizeChunk(chunk.text, maxChunkSize));
    }
  }

  return finalChunks;
}

function fixedSizeChunk(text: string, maxSize: number): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/);
  let current = "";

  for (const word of words) {
    if (current && (current.length + word.length + 1) > maxSize) {
      if (current.trim().length > 20) {
        chunks.push({ text: current.trim(), type: classifyChunk(current) });
      }
      current = word;
    } else {
      current += (current ? " " : "") + word;
    }
  }

  if (current.trim().length > 20) {
    chunks.push({ text: current.trim(), type: classifyChunk(current) });
  }

  return chunks;
}

export async function storeChunks(pdfImportId: number, chunks: Chunk[]): Promise<number> {
  let stored = 0;
  for (const chunk of chunks) {
    await db.insert(mealHistoryChunks).values({
      pdfImportId,
      chunkText: chunk.text,
      chunkType: chunk.type,
    });
    stored++;
  }
  return stored;
}

interface SearchResult {
  id: number;
  chunkText: string;
  chunkType: string;
  rank: number;
}

export async function searchMealHistory(query: string, limit = 10): Promise<SearchResult[]> {
  await ftsReady;

  const tokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokens.length === 0) return [];

  const ftsQuery = tokens.join(" OR ");

  try {
    const result = await client.execute({
      sql: `SELECT c.id, c.chunk_text, c.chunk_type, f.rank
           FROM meal_history_fts f
           JOIN meal_history_chunks c ON c.id = f.rowid
           WHERE meal_history_fts MATCH ?
           ORDER BY f.rank
           LIMIT ?`,
      args: [ftsQuery, limit],
    });

    return result.rows.map((r) => ({
      id: r.id as number,
      chunkText: r.chunk_text as string,
      chunkType: r.chunk_type as string,
      rank: r.rank as number,
    }));
  } catch {
    return [];
  }
}

export function buildRetrievalQuery(
  mealCategories: string[],
  targetMacros: { protein: number; carbs: number; fat: number; calories: number }
): string {
  const parts: string[] = [];

  parts.push(...mealCategories);
  parts.push("protein", "calories", "meal plan", "weekly");

  if (targetMacros.protein > 120) parts.push("high protein");
  if (targetMacros.carbs < 150) parts.push("low carb");
  if (targetMacros.fat < 50) parts.push("low fat");

  return parts.join(" ");
}

export async function getRelevantContext(
  mealCategories: string[],
  targetMacros: { protein: number; carbs: number; fat: number; calories: number },
  maxChunks = 8,
  maxTokensEstimate = 1500
): Promise<string> {
  const query = buildRetrievalQuery(mealCategories, targetMacros);
  const results = await searchMealHistory(query, maxChunks * 2);

  if (results.length === 0) return "";

  const priority: Record<string, number> = { plan: 0, meal: 1, nutrition: 2, general: 3 };
  const sorted = results.sort((a, b) => {
    const pa = priority[a.chunkType] ?? 3;
    const pb = priority[b.chunkType] ?? 3;
    if (pa !== pb) return pa - pb;
    return a.rank - b.rank;
  });

  const selected: SearchResult[] = [];
  let charCount = 0;
  for (const chunk of sorted) {
    if (selected.length >= maxChunks) break;
    if (charCount + chunk.chunkText.length > maxTokensEstimate * 4) break;
    selected.push(chunk);
    charCount += chunk.chunkText.length;
  }

  if (selected.length === 0) return "";

  return selected
    .map((c, i) => `[Past Data ${i + 1}] (${c.chunkType}):\n${c.chunkText}`)
    .join("\n\n");
}

export async function getImportHistory() {
  return db.select().from(pdfImports);
}

export async function deleteImport(importId: number) {
  await db.delete(pdfImports).where(eq(pdfImports.id, importId));
}
