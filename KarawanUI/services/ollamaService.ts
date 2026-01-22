import { Message } from '../types';

/**
 * Service to handle communication with local Ollama AI models.
 * Completely removed Google GenAI SDK to focus on local-only operation.
 */
export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Returns a list of local models from the Ollama instance.
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error("Ollama connection failed");
      const data = await response.json();
      return data.models || [];
    } catch (e) {
      console.warn("Fetch local models failed:", e);
      return [];
    }
  }

  /**
   * Generates content using the local Ollama API.
   * Extracts <thought> tags for models that support it (DeepSeek-R1 style).
   */
  async generate(
    model: string, 
    messages: Message[], 
    onChunk: (text: string, thought?: string) => void, 
    signal?: AbortSignal, 
    systemPrompt?: string,
    _thinkingBudget?: number 
  ) {
    try {
      const formattedMessages = [];
      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      }
      formattedMessages.push(...messages.map(m => ({
        role: m.role,
        content: m.content
      })));

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          stream: true
        }),
        signal
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      if (!response.body) throw new Error("Empty response from Ollama");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let inThought = false;
      let fullContent = "";
      let fullThought = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            let content = json.message?.content || "";
            
            if (content) {
              // Basic check for thinking tags
              if (content.includes("<thought>")) {
                inThought = true;
                content = content.replace("<thought>", "");
              }
              
              if (content.includes("</thought>")) {
                inThought = false;
                const parts = content.split("</thought>");
                fullThought += parts[0];
                fullContent += parts[1];
                onChunk(parts[1], parts[0]);
                continue;
              }

              if (inThought) {
                fullThought += content;
                onChunk("", content);
              } else {
                fullContent += content;
                onChunk(content, "");
              }
            }
          } catch (e) {
            // Ignore partial or malformed JSON chunks
          }
        }
      }
    } catch (e: any) {
      if (signal?.aborted) return;
      console.error("Ollama generation failed:", e);
      onChunk(`\n\n[SYSTEM ERROR]: ${e.message}`);
    }
  }
}