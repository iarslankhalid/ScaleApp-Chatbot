import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API information' })
  getHello() {
    return {
      message: 'RAG Chatbot API',
      version: '1.0.0',
      framework: 'NestJS',
      endpoints: {
        health: '/health',
        chat: '/chat',
        docs: '/docs',
      },
    };
  }
}
