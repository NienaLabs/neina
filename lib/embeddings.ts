import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { encoding_for_model } from "tiktoken";

export default async function generateChunksAndEmbeddings(text: string) {
  console.log("API KEY:", process.env.OPENAI_API_KEY ? "LOADED" : "MISSING");

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

  // 3. GitHub embeddings fetcher
  async function githubEmbed(text: string) {
    const response = await fetch(
      "https://models.github.ai/inference/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY??"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"}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "openai/text-embedding-3-small",
          encoding_format: "float"
        }),
      }
    );

    const {data} = await response.json();
    console.log(data[0].embedding)
    return data[0].embedding;
  }

  // 4. Embed each chunk
  const vectorStore = [];

  for (const chunk of chunks) {
    const vector = await githubEmbed(chunk.pageContent);
    vectorStore.push(vector);
  }

  return { chunks, vectorStore };
}
