import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAIService } from './services/openai.service';
import { PineconeService } from './services/pinecone.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenAIService, PineconeService],
})
export class ChatModule {}
