export interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
  isError?: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  sources?: string[];
  conversation_id: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  pinecone_connected: boolean;
  openai_connected: boolean;
  environment?: {
    node_version: string;
    platform: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  async checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return response.json();
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Utility functions
export const createUserMessage = (content: string): ChatMessage => ({
  id: Date.now(),
  content,
  sender: 'user',
  timestamp: new Date(),
});

export const createBotMessage = (
  content: string,
  sources: string[] = [],
  isError: boolean = false
): ChatMessage => ({
  id: Date.now() + 1,
  content,
  sender: 'bot',
  timestamp: new Date(),
  sources,
  isError,
});

export const createErrorMessage = (error: Error): ChatMessage => ({
  id: Date.now() + 1,
  content: `Sorry, I encountered an error: ${error.message}. Please make sure the NestJS server is running on ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`,
  sender: 'bot',
  timestamp: new Date(),
  isError: true,
});