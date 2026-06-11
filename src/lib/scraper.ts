import * as cheerio from "cheerio";
import { db } from "@/db";
import { storeProducts } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

interface ScrapedProduct {
  productName: string;
  priceCents: number;
  unitSize: string;
  url: string;
}

const CACHE_DAYS = 7;

function getCacheExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() - CACHE_DAYS);
  return d.toISOString();
}

export async function scrapePrice(
  ingredient: string,
  store: "trader_joes" | "whole_foods"
): Promise<ScrapedProduct | null> {
  const [cached] = await db
    .select()
    .from(storeProducts)
    .where(
      and(
        eq(storeProducts.store, store),
        eq(storeProducts.ingredientMatch, ingredient.toLowerCase()),
        gt(storeProducts.lastScrapedAt, getCacheExpiry())
      )
    );

  if (cached) {
    return {
      productName: cached.productName,
      priceCents: cached.priceCents || 0,
      unitSize: cached.unitSize || "",
      url: cached.url || "",
    };
  }

  try {
    if (store === "trader_joes") {
      return await scrapeTradersJoes(ingredient);
    } else {
      return await scrapeWholeFoods(ingredient);
    }
  } catch (error) {
    console.error(`Scrape error for ${ingredient} at ${store}:`, error);
    return null;
  }
}

async function scrapeTradersJoes(ingredient: string): Promise<ScrapedProduct | null> {
  const url = `https://www.traderjoes.com/home/search?q=${encodeURIComponent(ingredient)}&section=products&global=no`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  const products: ScrapedProduct[] = [];
  $("[class*='SearchResultCard'], [class*='ProductCard'], article").each((_, el) => {
    const name = $(el).find("[class*='title'], h2, h3").first().text().trim();
    const priceText = $(el).find("[class*='price'], [class*='Price']").first().text().trim();
    const link = $(el).find("a").first().attr("href") || "";

    if (name && priceText) {
      const priceMatch = priceText.match(/\$?(\d+)\.(\d{2})/);
      if (priceMatch) {
        products.push({
          productName: name,
          priceCents: parseInt(priceMatch[1]) * 100 + parseInt(priceMatch[2]),
          unitSize: "",
          url: link.startsWith("http") ? link : `https://www.traderjoes.com${link}`,
        });
      }
    }
  });

  const best = findBestMatch(products, ingredient);
  if (best) {
    await cacheProduct("trader_joes", ingredient, best);
  }
  return best;
}

async function scrapeWholeFoods(ingredient: string): Promise<ScrapedProduct | null> {
  const url = `https://www.wholefoodsmarket.com/search?text=${encodeURIComponent(ingredient)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  const products: ScrapedProduct[] = [];
  $("[class*='product'], [data-testid*='product']").each((_, el) => {
    const name = $(el).find("[class*='name'], [class*='title'], h2, h3").first().text().trim();
    const priceText = $(el).find("[class*='price'], [class*='Price']").first().text().trim();
    const sizeText = $(el).find("[class*='size'], [class*='weight']").first().text().trim();
    const link = $(el).find("a").first().attr("href") || "";

    if (name && priceText) {
      const priceMatch = priceText.match(/\$?(\d+)\.(\d{2})/);
      if (priceMatch) {
        products.push({
          productName: name,
          priceCents: parseInt(priceMatch[1]) * 100 + parseInt(priceMatch[2]),
          unitSize: sizeText,
          url: link.startsWith("http") ? link : `https://www.wholefoodsmarket.com${link}`,
        });
      }
    }
  });

  const best = findBestMatch(products, ingredient);
  if (best) {
    await cacheProduct("whole_foods", ingredient, best);
  }
  return best;
}

function findBestMatch(products: ScrapedProduct[], ingredient: string): ScrapedProduct | null {
  if (products.length === 0) return null;

  const ingLower = ingredient.toLowerCase();
  const ingTokens = ingLower.split(/\s+/);

  let bestScore = -1;
  let bestProduct = products[0];

  for (const product of products) {
    const nameLower = product.productName.toLowerCase();
    let score = 0;
    for (const token of ingTokens) {
      if (nameLower.includes(token)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  }

  return bestProduct;
}

async function cacheProduct(
  store: "trader_joes" | "whole_foods",
  ingredient: string,
  product: ScrapedProduct
) {
  await db.delete(storeProducts)
    .where(
      and(
        eq(storeProducts.store, store),
        eq(storeProducts.ingredientMatch, ingredient.toLowerCase())
      )
    );

  await db.insert(storeProducts)
    .values({
      store,
      productName: product.productName,
      ingredientMatch: ingredient.toLowerCase(),
      priceCents: product.priceCents,
      unitSize: product.unitSize,
      lastScrapedAt: new Date().toISOString(),
      url: product.url,
      manualEntry: 0,
    });
}

export async function scrapePricesForList(
  ingredientNames: string[],
  store: "trader_joes" | "whole_foods"
): Promise<Map<string, ScrapedProduct | null>> {
  const results = new Map<string, ScrapedProduct | null>();
  for (const name of ingredientNames) {
    results.set(name, await scrapePrice(name, store));
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return results;
}
