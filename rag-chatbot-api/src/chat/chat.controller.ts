import { Controller, Post, Body, Logger, Res, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to the RAG chatbot' })
  @ApiResponse({
    status: 200,
    description: 'Successful response from the chatbot',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.processMessage(chatRequest);
  }

  @Post('stream')
  @ApiOperation({ summary: 'Send a message to the RAG chatbot with streaming response' })
  @ApiResponse({
    status: 200,
    description: 'Streaming response from the chatbot',
  })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chatStream(
    @Body() chatRequest: ChatRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    // Set headers for Server-Sent Events
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    try {
      for await (const chunk of this.chatService.processMessageStream(chatRequest)) {
        // All chunks are now regular text content (sources are inline)
        response.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      
      // Send end signal
      response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      response.end();
    } catch (error) {
      this.logger.error('Error in streaming chat:', error);
      response.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      response.end();
    }
  }
}
