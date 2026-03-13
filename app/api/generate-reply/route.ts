import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/email-agent";

export async function POST(req: NextRequest) {
  const { email_body, sender, subject } = await req.json();

  if (!email_body || !sender || !subject) {
    return NextResponse.json(
      { success: false, error: "Alle Felder sind erforderlich." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_body, sender, subject }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || "Fehler im Backend." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, draft_reply: data.draft_reply });
  } catch {
    return NextResponse.json(
      { success: false, error: "Backend nicht erreichbar." },
      { status: 503 }
    );
  }
}
