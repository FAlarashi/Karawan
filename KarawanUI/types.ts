export enum ThemeType {
  SHADY = 'shady',
  NEON = 'neon',
  GHOST = 'ghost',
  BLOOD = 'blood',
  VOID = 'void',
  CUSTOM = 'custom'
}

export type BubbleStyle = 'rounded' | 'sharp' | 'minimal' | 'cyber';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  timestamp: number;
  type?: 'text' | 'code' | 'file' | 'mcp_action' | 'mcp_permission';
  fileName?: string;
  fileSize?: string;
  mcpCommand?: string;
  mcpStatus?: 'pending' | 'allowed' | 'denied';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
}

export interface AppSettings {
  ollamaUrl: string;
  selectedModel: string;
  voiceId: string;
  voicePitch: number;
  voiceRate: number;
  fontSize: number;
  sidebarFontSize: number;
  bubblePadding: number;
  bubbleStyle: BubbleStyle;
  inputHeight: number;
  inputBgColor: string;
  inputBorderColor: string;
  inputTextColor: string;
  autoSpeak: boolean;
  continuousVoice: boolean;
  voiceSkipCode: boolean; 
  waitForFinish: boolean;
  theme: ThemeType;
  accentColor: string;
  userBubbleColor: string;
  aiBubbleColor: string;
  chatBgColor: string;
  language: 'en' | 'ar';
  thinkingEnabled: boolean;
  fetchLocalModels: boolean;
  mcpEnabled: boolean;
  mcpRootPath: string;
  mcpBackendUrl: string;
  sharedPaths: string[];
  aboutText: string;
  promptPreset: 'default' | 'mcp' | 'custom';
  customSystemPrompt: string;
  arabicFontFamily: string;
}

export interface McpNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  content?: string;
}