"use client";

import { useState } from "react";

export default function Home() {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [draftReply, setDraftReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDraftReply("");

    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_body: emailBody, sender, subject }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Fehler beim Generieren der Antwort.");
      } else {
        setDraftReply(data.draft_reply);
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draftReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold tracking-tight">
            Weingut Fasanenhof
          </h1>
          <p className="text-sm text-stone-500">E-Mail-Assistent</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-stone-700">
              Absender
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="name@beispiel.de"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-stone-700">
              Betreff
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z. B. Anfrage Weinprobe"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-stone-700">
              E-Mail-Text
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Kundennachricht hier einfügen…"
              required
              rows={8}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-stone-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Antwort wird generiert…" : "Antwort generieren"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Draft Reply */}
        {draftReply && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-stone-700">
                Entwurf
              </h2>
              <button
                onClick={handleCopy}
                className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                {copied ? "Kopiert ✓" : "Kopieren"}
              </button>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-stone-800">
              {draftReply}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
