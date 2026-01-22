export class McpService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      const response = await fetch(`${this.baseUrl}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listFiles(path: string = '/') {
    try {
      const response = await fetch(`${this.baseUrl}/api/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error("Failed to list files");
      return await response.json();
    } catch (e) {
      console.warn("MCP listFiles failed:", e);
      return null; // Return null to indicate a network failure vs empty folder
    }
  }

  async readFile(path: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/read?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error("Failed to read file");
      const data = await response.json();
      return data.content || "";
    } catch (e) {
      console.error("MCP readFile failed:", e);
      return "";
    }
  }

  async runCommand(command: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      return await response.json();
    } catch (e) {
      return { error: 'Failed to connect to MCP backend bridge' };
    }
  }
}