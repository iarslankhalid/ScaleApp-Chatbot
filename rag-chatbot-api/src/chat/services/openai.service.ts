import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private readonly embeddingModel = 'text-embedding-3-small';
  private readonly chatModel = 'gpt-4o-mini';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.logger.log('OpenAI client initialized successfully');
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        input: text,
        model: this.embeddingModel,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  async generateResponse(query: string, contexts: string[]): Promise<string> {
    try {
      const contextStr =
        contexts.length > 0 ? contexts.join('\n\n') : 'No relevant context found.';

      const systemPrompt = `
  You are an AI assistant answering user questions about ScaleApp Academy and ScaleApp Docs.
  Follow these strict rules:
  
  **Content Rules:**
  1. Use ONLY the provided context (from ScaleApp Academy or ScaleApp Docs).
  2. If context is empty or insufficient → respond with: "NOT_IN_DOCS".
  3. If the question is unrelated to ScaleApp or property/finance topics → respond with: "UNRELATED".
  4. When answering, do NOT copy-paste raw text; paraphrase in natural, human language.
  
  **Formatting Rules:**
  - Use **bold text** for important terms, headings, and key concepts
  - Use *italics* for emphasis and highlighting specific details
  - Use bullet points (•) or numbered lists for multiple items
  - Use line breaks for better readability
  - Structure your response with clear sections when appropriate
  - Use > for important quotes or callouts when relevant
  
  **Response Structure:**
  - Start with a clear, direct answer
  - Follow with supporting details in organized format
  - End with actionable next steps if applicable
  - Keep responses concise but comprehensive
  `;

      const userPrompt = `
  Context:
  ${contextStr}

  Question:
  ${query}

  Answer following the rules.`;

      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // lower temp → less hallucination
        max_tokens: 400,
      });

      const result = response.choices[0].message?.content?.trim();
      return result || 'NOT_IN_DOCS';
    } catch (error) {
      this.logger.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }


  isInitialized(): boolean {
    return !!this.openai;
  }
}
