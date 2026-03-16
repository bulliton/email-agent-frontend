import OpenAI from "openai";
import { openai, embedText } from "./openai";
import { queryPinecone, queryFaqPinecone } from "./pinecone";
import { BUSINESS_SYSTEM_PROMPT } from "./systemPrompt";

const SYSTEM_PROMPT = BUSINESS_SYSTEM_PROMPT;

export async function generateReply(
  emailBody: string,
  sender: string,
  subject: string,
  systemPromptOverride?: string
): Promise<string> {
  const query = `Subject: ${subject}\n\n${emailBody}`;

  // 1. Embed the incoming email
  const embedding = await embedText(query);

  // 2. Retrieve FAQ knowledge + style examples from Pinecone (parallel)
  const [faqChunks, contextChunks] = await Promise.all([
    queryFaqPinecone(embedding),
    queryPinecone(embedding),
  ]);
  const faqContext = faqChunks.join("\n\n---\n\n");
  const context = contextChunks.join("\n\n---\n\n");

  // 3. Build messages
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPromptOverride || SYSTEM_PROMPT },
  ];

  if (faqContext) {
    messages.push({
      role: "user",
      content: `WISSENSDATENBANK – FAQ FUNZELN.COM (autoritative Fakten – nutze diese Informationen direkt für deine Antwort, wenn sie relevant sind):\n\n${faqContext}`,
    });
  }

  messages.push({
    role: "user",
    content: `From: ${sender}\nSubject: ${subject}\n\n${emailBody}`,
  });

  if (context) {
    messages.push({
      role: "user",
      content: `BEISPIELANTWORTEN AUS DER WISSENSDATENBANK (nur zur Stilorientierung — können veraltete oder fehlerhafte Formulierungen enthalten):\n\nDie folgenden Beispiele dienen NUR als Stilreferenz. Die Regeln im System-Prompt haben ABSOLUTE PRIORITÄT. Alle verbotenen Formulierungen aus den Regeln müssen auch dann weggelassen werden, wenn sie in diesen Beispielen vorkommen.\n\n${context}`,
    });
  }

  // 4. Generate reply
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.4,
  });

  const reply = completion.choices[0].message.content || "";

  return reply;
}
