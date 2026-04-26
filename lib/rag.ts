import { readFileSync } from "fs";
import { join } from "path";
import Fuse from "fuse.js";

export interface DocChunk {
  id: string;
  title: string;
  content: string;
  source: "docs" | "api" | "guide";
  url?: string;
  image?: string;
}

let fuseInstance: Fuse<DocChunk> | null = null;

export function getRAGIndex() {
  if (fuseInstance) return fuseInstance;

  const chunks: DocChunk[] = [];

  // Parse docs.json
  try {
    const docsPath = join(process.cwd(), "sources", "docs.json");
    const docsData = JSON.parse(readFileSync(docsPath, "utf-8"));

    const processSection = (section: any) => {
      chunks.push({
        id: section.id || Math.random().toString(36).substr(2, 9),
        title: section.title,
        content: section.content || section.description || JSON.stringify(section),
        source: "docs",
        image: section.image
      });

      if (section.subsections) {
        section.subsections.forEach(processSection);
      }
      if (section.concepts) {
        section.concepts.forEach((concept: any) => {
          chunks.push({
            id: concept.name,
            title: concept.name,
            content: concept.description,
            source: "docs",
            image: concept.image
          });
        });
      }
      if (section.tools) {
        section.tools.forEach((tool: any) => {
          chunks.push({
            id: tool.name,
            title: tool.name,
            content: tool.description,
            source: "docs",
            image: tool.image
          });
        });
      }
      if (section.prerequisites) {
        section.prerequisites.forEach((prereq: any) => {
          chunks.push({
            id: prereq.name,
            title: prereq.name,
            content: `${prereq.description || ""} ${prereq.installation_note || ""}`,
            source: "docs",
            image: prereq.image
          });
        });
      }
      if (section.steps) {
        section.steps.forEach((step: any) => {
          chunks.push({
            id: step.step || Math.random().toString(36).substr(2, 9),
            title: step.step || "Step",
            content: `${step.command || ""} ${step.notes || ""} ${step.description || ""}`,
            source: "docs",
            image: step.image
          });
        });
      }
    };

    if (docsData.document && docsData.document.sections) {
      docsData.document.sections.forEach(processSection);
    }
  } catch (e) {
    console.error("Error parsing docs.json", e);
  }

  // Parse api-links.md
  try {
    const apiPath = join(process.cwd(), "sources", "api-links.md");
    const apiData = readFileSync(apiPath, "utf-8");
    
    // Very basic table parser for api-links.md
    const lines = apiData.split("\n");
    lines.forEach((line) => {
      if (line.includes("|") && line.includes("[") && !line.includes("---")) {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 3) {
          const nameMatch = parts[1].match(/\[(.*?)\]\((.*?)\)/);
          if (nameMatch) {
            chunks.push({
              id: nameMatch[1],
              title: nameMatch[1],
              content: parts[2],
              source: "api",
              url: nameMatch[2]
            });
          }
        }
      }
    });
  } catch (e) {
    console.error("Error parsing api-links.md", e);
  }

  // Parse gemini.md
  try {
    const geminiPath = join(process.cwd(), "sources", "gemini.md");
    const geminiData = readFileSync(geminiPath, "utf-8");
    
    const sections = geminiData.split("---").filter(s => s.trim().length > 0);
    sections.forEach((section, index) => {
      const titleMatch = section.match(/^title:\s*(.*)$/m) || section.match(/^#\s*(.*)$/m);
      const title = titleMatch ? titleMatch[1].trim() : `Gemini Doc ${index}`;
      chunks.push({
        id: `gemini-${index}`,
        title,
        content: section.trim(),
        source: "docs"
      });
    });
  } catch (e) {
    console.error("Error parsing gemini.md", e);
  }

  // Parse practical-guide-to-building-agents.json
  try {
    const guidePath = join(process.cwd(), "sources", "practical-guide-to-building-agents.json");
    const guideData = JSON.parse(readFileSync(guidePath, "utf-8"));
    if (guideData.document && guideData.document.chunks) {
      guideData.document.chunks.forEach((chunk: any) => {
        chunks.push({
          id: chunk.chunk_id,
          title: chunk.section,
          content: chunk.content,
          source: "guide"
        });
      });
    }
  } catch (e) {
    console.error("Error parsing practical-guide-to-building-agents.json", e);
  }


  fuseInstance = new Fuse(chunks, {
    keys: ["title", "content"],
    threshold: 0.4,
    includeScore: true,
  });

  return fuseInstance;
}

export function searchRAG(query: string, limit = 5) {
  const index = getRAGIndex();
  return index.search(query, { limit }).map(res => res.item);
}
