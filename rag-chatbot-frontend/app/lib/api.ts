export interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
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
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
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

  async *sendMessageStream(request: ChatRequest): AsyncIterable<{ content?: string; done?: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.chunk) {
                  yield { content: data.chunk };
                } else if (data.done) {
                  yield { done: true };
                  return;
                } else if (data.error) {
                  yield { error: data.error };
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming error:', error);
      yield { error: error instanceof Error ? error.message : 'Unknown streaming error' };
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
  isError: boolean = false
): ChatMessage => ({
  id: Date.now() + 1,
  content,
  sender: 'bot',
  timestamp: new Date(),
  isError,
});

export const createErrorMessage = (error: Error): ChatMessage => ({
  id: Date.now() + 1,
  content: `Sorry, I encountered an error: ${error.message}. Please make sure the NestJS server is running on ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}`,
  sender: 'bot',
  timestamp: new Date(),
  isError: true,
});