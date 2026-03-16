import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { BUSINESS_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import fs from "fs";
import path from "path";

const FEEDBACK_PATH = path.join(process.cwd(), "..", "feedback.json");

type FeedbackEntry = {
  rating: "good" | "needs_work";
  note: string;
  ai_reply: string;
  timestamp: string;
};

function loadFeedback(): Record<string, FeedbackEntry> {
  try {
    return JSON.parse(fs.readFileSync(FEEDBACK_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export async function POST() {
  const currentPrompt = BUSINESS_SYSTEM_PROMPT;
  const feedback = loadFeedback();

  const needsWork = Object.entries(feedback).filter(
    ([, entry]) => entry.rating === "needs_work" && entry.note?.trim()
  );

  if (needsWork.length === 0) {
    return NextResponse.json({ error: "No needs_work feedback found." }, { status: 400 });
  }

  // Build feedback cases for the meta-prompt
  const cases = needsWork
    .map(([id, entry], i) => {
      return `--- Case ${i + 1} (ID: ${id.slice(0, 40)}) ---
AI reply that was wrong:
${entry.ai_reply}

Feedback / correction note:
${entry.note}`;
    })
    .join("\n\n");

  const metaPrompt = `You are a prompt engineer. Your job is to improve a system prompt for an AI email assistant based on real feedback.

The assistant writes email replies for Weingut Fasanenhof (a winery in Germany). Below is the current system prompt, followed by cases where the AI made mistakes. For each case, the user has written a correction note.

Study the mistakes carefully. Extract the recurring rules and factual corrections. Then rewrite the system prompt to prevent these mistakes from happening again.

RULES FOR THE NEW PROMPT:
- Write in German
- Be specific — include exact facts, wording rules, and business logic
- Do not invent new rules not mentioned in the feedback
- Preserve what worked (the general tone, structure, language)
- Return ONLY the new system prompt text, no explanation or markdown

CURRENT SYSTEM PROMPT:
${currentPrompt}

FEEDBACK CASES:
${cases}

NEW SYSTEM PROMPT:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: metaPrompt }],
    temperature: 0.3,
  });

  const newPrompt = completion.choices[0].message.content?.trim() ?? "";

  return NextResponse.json({
    old_prompt: currentPrompt,
    new_prompt: newPrompt,
    feedback_count: needsWork.length,
  });
}
