import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { encoding_for_model } from "tiktoken";

export default async function generateChunksAndEmbeddings(text: string) {
  const apiKey = process.env.OPENAI_API_KEY || "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";
  console.log("API KEY:", process.env.OPENAI_API_KEY ? "LOADED" : "USING FALLBACK");
  
  const isOpenAI = apiKey.startsWith("sk-");
  const endpoint = isOpenAI 
    ? "https://api.openai.com/v1/embeddings" 
    : "https://models.github.ai/inference/embeddings";

  // 1. Token encoder
  const encoder = encoding_for_model("text-embedding-3-small");

  // 2. Chunker
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
    lengthFunction: (txt) => encoder.encode(txt).length,
  });

  const chunks = await splitter.createDocuments([text]);

  // Free memory
  encoder.free();

  // 3. Embeddings fetcher
  async function fetchEmbedding(text: string) {
    const response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small",
          encoding_format: "float"
        }),
      }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Embeddings API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Embeddings API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    if (!json.data || !json.data[0] || !json.data[0].embedding) {
        console.error("Invalid embedding response format:", json);
        throw new Error("Invalid embedding response format");
    }
    
    return json.data[0].embedding;
  }

  // 4. Embed each chunk
  const vectorStore = [];

  for (const chunk of chunks) {
    const vector = await fetchEmbedding(chunk.pageContent);
    vectorStore.push(vector);
  }

  return { chunks, vectorStore };

}

export async function generateEmbedding(text: string) {
  if (!text || !text.trim()) {
      console.warn("generateEmbedding: received empty text, returning empty array");
      return []; 
  }

  const apiKey = process.env.OPENAI_API_KEY || "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";
  const isOpenAI = apiKey.startsWith("sk-");
  const endpoint = isOpenAI 
    ? "https://api.openai.com/v1/embeddings" 
    : "https://models.inference.ai.azure.com/embeddings";

  const response = await fetch(
    endpoint,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small",
        encoding_format: "float"
      }),
    }
  );

  if (!response.ok) {
      const errorText = await response.text();
      console.error(`GenerateEmbedding API Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`GenerateEmbedding API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  
  if (json.error) { 
      console.error("GenerateEmbedding API returned error object:", json.error);
      throw new Error(`GenerateEmbedding API Error: ${JSON.stringify(json.error)}`);
  }

  if (!json.data || !json.data[0] || !json.data[0].embedding) {
      console.error("Invalid embedding response format. Full JSON:", JSON.stringify(json, null, 2));
      throw new Error("Invalid embedding response format: Missing data[0].embedding. Check console for full response.");
  }

  return json.data[0].embedding as number[];
}

