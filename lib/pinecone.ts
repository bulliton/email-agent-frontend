import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

const indexName = process.env.PINECONE_INDEX!;
const namespace = process.env.PINECONE_NAMESPACE || "default";

export async function queryPinecone(
  embedding: number[],
  topK = 5
): Promise<string[]> {
  const index = pc.index(indexName).namespace(namespace);

  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return result.matches
    .filter((m) => m.score !== undefined && m.score > 0.5)
    .map((m) => (m.metadata?.text as string) || "")
    .filter(Boolean);
}

export async function upsertToPinecone(
  id: string,
  embedding: number[],
  metadata: Record<string, string>
): Promise<void> {
  const index = pc.index(indexName).namespace(namespace);
  await index.upsert({ records: [{ id, values: embedding, metadata }] });
}
