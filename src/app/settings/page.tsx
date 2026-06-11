"use client";

import { useState, useEffect, useCallback } from "react";
import type { PdfImport } from "@/db/schema";

export default function SettingsPage() {
  // Custom instructions state
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Knowledge base state
  const [documents, setDocuments] = useState<PdfImport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    filename: string;
    chunksCreated: number;
    preview: { type: string; text: string }[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search test
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { chunkText: string; chunkType: string; rank: number }[]
  >([]);

  const fetchPreferences = useCallback(async () => {
    const res = await fetch("/api/preferences");
    const prefs = await res.json();
    setInstructions(prefs.customAiInstructions || "");
  }, []);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/ai/imports");
    setDocuments(await res.json());
  }, []);

  useEffect(() => {
    fetchPreferences();
    fetchDocuments();
  }, [fetchPreferences, fetchDocuments]);

  const saveInstructions = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customAiInstructions: instructions }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai/import-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadResult(data);
      fetchDocuments();
      fileInput.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: number) => {
    if (!confirm("Remove this document and its indexed data?")) return;
    await fetch("/api/ai/imports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchDocuments();
  };

  const testSearch = async () => {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/ai/imports?search=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.results || []);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Custom AI Instructions */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-2">AI Meal Plan Instructions</h2>
        <p className="text-sm text-text-muted mb-4">
          Set custom rules the AI will follow when generating your meal plans. These are injected
          directly into the prompt as strict constraints.
        </p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={6}
          placeholder={`Example instructions:\n- 30g+ protein per meal for lunch and dinner\n- Keep breakfast under 400 calories\n- No red meat on weekdays\n- Always include a vegetable with dinner\n- Prefer Mediterranean-style meals`}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3 font-mono"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={saveInstructions}
            disabled={saving}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Instructions"}
          </button>
          {saved && (
            <span className="text-sm text-primary font-medium">Saved!</span>
          )}
        </div>
      </section>

      {/* Knowledge Base */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-2">Knowledge Base</h2>
        <p className="text-sm text-text-muted mb-4">
          Upload recipes, meal ideas, nutrition guides, or any reference documents. The content is
          extracted, indexed, and used as context when creating new meals with AI Fill.
        </p>

        <form onSubmit={handleUpload} className="flex items-center gap-3 mb-4">
          <input
            type="file"
            accept=".pdf"
            className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-medium file:cursor-pointer hover:file:bg-primary-dark"
          />
          <button
            type="submit"
            disabled={uploading}
            className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-surface-hover disabled:opacity-50"
          >
            {uploading ? "Processing..." : "Upload & Index"}
          </button>
        </form>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-danger mb-4">
            {uploadError}
          </div>
        )}

        {uploadResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              Added &quot;{uploadResult.filename}&quot; - {uploadResult.chunksCreated} sections indexed
            </p>
            <p className="text-xs text-text-muted mb-2">Preview of extracted content:</p>
            <div className="space-y-2">
              {uploadResult.preview.map((p, i) => (
                <div key={i} className="bg-white rounded p-2 text-xs">
                  <span className="inline-block bg-gray-100 rounded px-1.5 py-0.5 font-medium text-[10px] uppercase mr-2">
                    {p.type}
                  </span>
                  {p.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents list */}
        {documents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Uploaded Documents</h3>
            <div className="divide-y divide-border border border-border rounded-lg">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{doc.filename}</p>
                    <p className="text-xs text-text-muted">
                      {doc.chunkCount} sections | Added{" "}
                      {new Date(doc.importedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Search Test */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-2">Search Knowledge Base</h2>
        <p className="text-sm text-text-muted mb-4">
          Test what context the AI retrieves from your uploaded documents. These are the
          snippets used when creating meals with AI Fill.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && testSearch()}
            placeholder="Try: paneer recipes, high protein dinner, quick lunch..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={testSearch}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
          >
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block bg-gray-200 rounded px-1.5 py-0.5 font-medium text-[10px] uppercase">
                    {r.chunkType}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    relevance: {Math.abs(r.rank).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs whitespace-pre-wrap">{r.chunkText}</p>
              </div>
            ))}
          </div>
        )}
        {searchResults.length === 0 && searchQuery && (
          <p className="text-sm text-text-muted">
            No results. Upload some documents first, then search.
          </p>
        )}
      </section>
    </div>
  );
}
