import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { searchRAG } from "@/lib/rag";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google("gemini-2.5-flash"), // Using Gemini 2.0 Flash
      messages,
      maxSteps: 5,
      system: `You are the "Zero to Agent" Documentation Assistant (Agentic Mentor). 

      Your goal is to help participants of the "Zero to Agent" event held by AI Collective Jerusalem.
      
      CRITICAL INSTRUCTION FOR NODE.JS:
      When a user asks for help installing Node.js, you MUST:
      1. Search the docs using search_docs("Node.js").
      2. Provide the official download link: https://nodejs.org/
      3. Display the installation image found in the docs: ![Node.js Installation](https://raw.githubusercontent.com/tawfiqkhalilieh/Zero-To-Agent-Vercel-Agentic-Documentation/refs/heads/development/images/node-install-windows.png)
      4. Explain the steps clearly.

      Behavior:
      - Always be helpful, technical, and mentoring.
      - If a user asks about the event, CLI, or technical steps, ALWAYS search the docs first.
      - If search results contain an 'image' URL, you MUST display it using markdown: ![alt](url).
      - If search results contain a 'url', you MUST include it.
      - If a user asks for API suggestions, use the suggest_api tool.
      - Cite sections (e.g., Section 2.2.1) when possible.
      
      Tone: Minimal, clean, and professional (Vercel style).`,
      tools: {
        search_docs: tool({
          description: "Search the event documentation for specific topics, steps, or prerequisites.",
          parameters: z.object({
            query: z.string().describe("The search query to look up in the documentation."),
          }),
          execute: async ({ query }) => {
            try {
              const results = searchRAG(query);
              return JSON.stringify(results.filter((r) => r.source === "docs"));
            } catch (error) {
              console.error("Error in search_docs tool:", error);
              return JSON.stringify({ error: "Failed to search documentation" });
            }
          },
        }),
        suggest_api: tool({
          description: "Recommend public APIs from the curated list for the user's project.",
          parameters: z.object({
            query: z.string().describe("The type of API or domain the user is interested in."),
          }),
          execute: async ({ query }) => {
            try {
              const results = searchRAG(query);
              return JSON.stringify(results.filter((r) => r.source === "api"));
            } catch (error) {
              console.error("Error in suggest_api tool:", error);
              return JSON.stringify({ error: "Failed to suggest APIs" });
            }
          },
        }),
        explain_concept: tool({
          description: "Get a detailed explanation of a technical concept from the curriculum.",
          parameters: z.object({
            concept: z.string().describe("The concept to explain (e.g., RAG, Agentic Systems, MCP)."),
          }),
          execute: async ({ concept }) => {
            try {
              const results = searchRAG(concept);
              const result = results[0] || { error: "Concept not found in documentation." };
              return JSON.stringify(result);
            } catch (error) {
              console.error("Error in explain_concept tool:", error);
              return JSON.stringify({ error: "Failed to explain concept" });
            }
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Fatal error in POST /api/chat:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
