import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}
