import axios from 'axios';

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002';

// Generate embedding for a given text (using OpenAI API for now)
export async function generateEmbedding(text: string): Promise<number[]> {
  const resp = await axios.post(
    'https://api.openai.com/v1/embeddings',
    {
      input: text,
      model: OPENAI_EMBEDDING_MODEL,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return resp.data.data[0].embedding;
}

// Add a vector to Chroma DB
export async function addToChroma(collection: string, id: string, embedding: number[], metadata: any) {
  await axios.post(`${CHROMA_URL}/api/v1/collections/${collection}/add`, {
    ids: [id],
    embeddings: [embedding],
    metadatas: [metadata],
  });
}

// Query Chroma DB for similar vectors
export async function queryChroma(collection: string, embedding: number[], topK: number = 5) {
  const resp = await axios.post(`${CHROMA_URL}/api/v1/collections/${collection}/query`, {
    query_embeddings: [embedding],
    n_results: topK,
  });
  return resp.data;
} 