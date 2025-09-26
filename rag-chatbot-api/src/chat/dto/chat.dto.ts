import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'User message to send to the chatbot' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Optional conversation ID for session tracking' })
  @IsOptional()
  @IsString()
  conversation_id?: string = 'default';
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Bot response message' })
  response: string;

  @ApiProperty({ description: 'Source documents used for the response' })
  sources: string[];

  @ApiProperty({ description: 'Conversation ID' })
  conversation_id: string;
}
