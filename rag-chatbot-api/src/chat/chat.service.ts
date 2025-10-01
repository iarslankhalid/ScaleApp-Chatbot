import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';
import { PineconeService } from './services/pinecone.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private openaiService: OpenAIService,
    private pineconeService: PineconeService,
  ) {}

  async processMessage(chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Processing message: ${chatRequest.message}`);

      if (!this.pineconeService.isInitialized()) {
        throw new HttpException(
          'Pinecone service not initialized. Check PINECONE_API_KEY.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (!this.openaiService.isInitialized()) {
        throw new HttpException(
          'OpenAI service not initialized. Check OPENAI_API_KEY.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const queryEmbedding = await this.openaiService.generateEmbeddings(
        chatRequest.message,
      );

      const { contexts, sources } =
        await this.pineconeService.searchSimilarDocuments(queryEmbedding);

      const response = await this.openaiService.generateResponse(
        chatRequest.message,
        contexts,
        sources, // Pass sources for inline inclusion
      );

      return {
        response,
        sources: [], // Sources are now included inline in the response
        conversation_id: chatRequest.conversation_id || 'default',
      };
    } catch (error) {
      this.logger.error('Error processing message:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async *processMessageStream(chatRequest: ChatRequestDto): AsyncIterable<string> {
    try {
      this.logger.log(`Processing streaming message: ${chatRequest.message}`);

      if (!this.pineconeService.isInitialized()) {
        throw new HttpException(
          'Pinecone service not initialized. Check PINECONE_API_KEY.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (!this.openaiService.isInitialized()) {
        throw new HttpException(
          'OpenAI service not initialized. Check OPENAI_API_KEY.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const queryEmbedding = await this.openaiService.generateEmbeddings(
        chatRequest.message,
      );

      const { contexts, sources } =
        await this.pineconeService.searchSimilarDocuments(queryEmbedding);

      // Stream the response with sources included inline
      for await (const chunk of this.openaiService.generateStreamingResponse(
        chatRequest.message,
        contexts,
        sources, // Pass sources to be included inline
      )) {
        yield chunk;
      }
    } catch (error) {
      this.logger.error('Error processing streaming message:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
