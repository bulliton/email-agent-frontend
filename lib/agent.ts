import OpenAI from "openai";
import { openai, embedText } from "./openai";
import { queryPinecone, upsertToPinecone } from "./pinecone";

const BUSINESS_NAME = process.env.BUSINESS_NAME || "Business";
const SYSTEM_PROMPT =
  process.env.BUSINESS_SYSTEM_PROMPT ||
  `You are a professional email assistant for ${BUSINESS_NAME}. Write helpful, friendly, and concise email replies on behalf of the business.`;

export async function generateReply(
  emailBody: string,
  sender: string,
  subject: string
): Promise<string> {
  const query = `Subject: ${subject}\n\n${emailBody}`;

  // 1. Embed the incoming email
  const embedding = await embedText(query);

  // 2. Retrieve relevant context from Pinecone
  const contextChunks = await queryPinecone(embedding);
  const context = contextChunks.join("\n\n---\n\n");

  // 3. Build messages
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({
      role: "system",
      content: `Relevant information from our knowledge base:\n\n${context}`,
    });
  }

  messages.push({
    role: "user",
    content: `From: ${sender}\nSubject: ${subject}\n\n${emailBody}`,
  });

  // 4. Generate reply
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.4,
  });

  const reply = completion.choices[0].message.content || "";

  // 5. Auto-save to Pinecone for RAG improvement (non-blocking)
  const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  embedText(`${query}\n\nReply:\n${reply}`)
    .then((replyEmbedding) =>
      upsertToPinecone(id, replyEmbedding, {
        text: `Email from ${sender} about "${subject}":\n${emailBody}\n\nReply:\n${reply}`,
        sender,
        subject,
        timestamp: new Date().toISOString(),
      })
    )
    .catch(() => {});

  return reply;
}
