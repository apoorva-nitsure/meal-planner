import { db } from "@/db";
import { pdfImports } from "@/db/schema";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { chunkText, storeChunks } from "@/lib/rag";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawText = await extractTextFromPdf(buffer);
    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. It may be a scanned image." },
        { status: 400 }
      );
    }

    const chunks = chunkText(rawText, 20);

    const [importRecord] = await db
      .insert(pdfImports)
      .values({ filename: file.name, chunkCount: chunks.length })
      .returning();

    const stored = await storeChunks(importRecord.id, chunks);

    return NextResponse.json({
      id: importRecord.id,
      filename: file.name,
      chunksCreated: stored,
      totalChars: rawText.length,
      preview: chunks.slice(0, 3).map((c) => ({
        type: c.type,
        text: c.text.substring(0, 200) + (c.text.length > 200 ? "..." : ""),
      })),
    });
  } catch (error) {
    console.error("PDF import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import PDF" },
      { status: 500 }
    );
  }
}
