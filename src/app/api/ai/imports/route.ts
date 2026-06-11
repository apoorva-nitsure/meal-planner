import { db } from "@/db";
import { pdfImports } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { searchMealHistory, deleteImport } from "@/lib/rag";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("search");

  if (query) {
    const results = await searchMealHistory(query, 10);
    return NextResponse.json({ results });
  }

  const imports = await db.select().from(pdfImports);
  return NextResponse.json(imports);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await deleteImport(id);
  return NextResponse.json({ success: true });
}
