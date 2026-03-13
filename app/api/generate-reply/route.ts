import { NextRequest, NextResponse } from "next/server";
import { generateReply } from "@/lib/agent";

export async function POST(req: NextRequest) {
  const { email_body, sender, subject } = await req.json();

  if (!email_body || !sender || !subject) {
    return NextResponse.json(
      { success: false, error: "Alle Felder sind erforderlich." },
      { status: 400 }
    );
  }

  try {
    const draft_reply = await generateReply(email_body, sender, subject);
    return NextResponse.json({ success: true, draft_reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Fehler beim Generieren der Antwort." },
      { status: 500 }
    );
  }
}
