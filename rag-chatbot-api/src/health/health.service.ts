import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  getHealthStatus() {
    const pineconeKey = this.configService.get<string>('PINECONE_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      pinecone_connected: !!pineconeKey,
      openai_connected: !!openaiKey,
      environment: {
        node_version: process.version,
        platform: process.platform,
      },
    };
  }
}
