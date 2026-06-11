import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/mealplanner.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { client };

export async function initFts() {
  await client.executeMultiple(`
    CREATE VIRTUAL TABLE IF NOT EXISTS meal_history_fts USING fts5(
      chunk_text,
      chunk_type,
      content='meal_history_chunks',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS meal_history_chunks_ai AFTER INSERT ON meal_history_chunks BEGIN
      INSERT INTO meal_history_fts(rowid, chunk_text, chunk_type)
      VALUES (new.id, new.chunk_text, new.chunk_type);
    END;

    CREATE TRIGGER IF NOT EXISTS meal_history_chunks_ad AFTER DELETE ON meal_history_chunks BEGIN
      INSERT INTO meal_history_fts(meal_history_fts, rowid, chunk_text, chunk_type)
      VALUES ('delete', old.id, old.chunk_text, old.chunk_type);
    END;
  `);
}

const _ftsReady = initFts().catch(console.error);
export { _ftsReady as ftsReady };
