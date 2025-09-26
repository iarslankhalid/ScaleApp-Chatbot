import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';

interface SearchResult {
  contexts: string[];
  sources: string[];
}

@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private pinecone: Pinecone;
  private readonly indexName: string;
  private readonly topK = 5;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('PINECONE_API_KEY');
    this.indexName = this.configService.get<string>('PINECONE_INDEX_NAME') || 'default';

    if (!apiKey) {
      this.logger.warn('PINECONE_API_KEY not found in environment variables');
      return;
    }

    this.pinecone = new Pinecone({ apiKey });
    this.logger.log('Pinecone client initialized successfully');
  }

  async searchSimilarDocuments(queryEmbedding: number[]): Promise<SearchResult> {
    try {
      const index = this.pinecone.index(this.indexName);

      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK: this.topK,
        includeMetadata: true,
      });

      const contexts: string[] = [];
      const sources: string[] = [];

      if (searchResponse.matches) {
        this.logger.log(`Found ${searchResponse.matches.length} matches from Pinecone`);
        
        for (const match of searchResponse.matches) {
          if (match.metadata && match.metadata.text) {
            const text = match.metadata.text as string;
            const source = (match.metadata.source as string) || `Doc_${match.id}`;
            const score = match.score || 0;
            
            this.logger.log(`Retrieved document - Score: ${score.toFixed(4)}, Source: ${source}, Text preview: ${text.substring(0, 100)}...`);
            
            contexts.push(text);
            sources.push(source);
          }
        }
        
        this.logger.log(`Total contexts retrieved: ${contexts.length}`);
      } else {
        this.logger.log('No matches found in Pinecone search');
      }

      return { contexts, sources };
    } catch (error) {
      this.logger.error('Error searching knowledge base:', error);
      return { contexts: [], sources: [] };
    }
  }

  isInitialized(): boolean {
    return !!this.pinecone;
  }
}
