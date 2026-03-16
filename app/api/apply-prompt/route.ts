import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROMPT_PATH = path.join(process.cwd(), "lib", "systemPrompt.ts");

export async function POST(req: NextRequest) {
  const { new_prompt } = await req.json();
  if (!new_prompt?.trim()) {
    return NextResponse.json({ error: "new_prompt is required" }, { status: 400 });
  }

  try {
    // Escape backticks and template literal syntax so the string is valid TS
    const escaped = new_prompt.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    const newContent = `export const BUSINESS_SYSTEM_PROMPT = \`${escaped}\`;\n`;

    fs.writeFileSync(PROMPT_PATH, newContent, "utf-8");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to write lib/systemPrompt.ts" }, { status: 500 });
  }
}
