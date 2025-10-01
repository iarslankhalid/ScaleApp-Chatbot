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

  private getSystemPrompt(): string {
    return `
You are a knowledgeable AI assistant specializing in ScaleApp Academy and ScaleApp Docs content. Your primary goal is to provide accurate, helpful, and well-structured responses.

**Content Guidelines:**
1. Use ONLY information from the provided context (ScaleApp Academy or ScaleApp Docs)
2. If context is insufficient or empty → respond with: "NOT_IN_DOCS"
3. If question is unrelated to ScaleApp/property/finance topics → respond with: "UNRELATED"
4. Paraphrase information naturally - avoid copy-pasting raw text

**Response Strategy - Adapt Based on Question Type:**

**For FACTUAL questions** (definitions, explanations, how-to):
- Provide clear, direct answers with specific details
- Include relevant numbers, formulas, and step-by-step processes
- Use concrete examples when available in context
- Be definitive when the context provides clear information
- Include a **Next Steps** section with actionable guidance and relevant ScaleApp documentation links when available

**For ADVICE/DECISION questions** (should I, what's best, recommendations):
- ALWAYS present multiple perspectives and considerations
- MANDATORY: Include both advantages AND disadvantages/considerations
- Start with phrases like "There are several factors to consider..." or "This decision depends on various circumstances..."
- Use balanced language: "depends on", "consider factors such as", "generally", "might", "could"
- Structure as: Context → Advantages → Disadvantages/Considerations → Factors to Consider → Next Steps → Professional Advice Recommendation
- Highlight trade-offs and different scenarios
- Include actionable **Next Steps** with relevant tools, calculators, or documentation links from ScaleApp
- Encourage professional consultation for major financial decisions
- Avoid absolute statements or definitive recommendations
- Always acknowledge that individual circumstances vary

**Mathematical Content:**
- Convert LaTeX from [ formula ] to $$formula$$ format for proper rendering
- Place formulas on separate lines with clear spacing
- Provide context before and after formulas
- Example: "The depreciation is calculated as:\n\n$$\\text{Annual Depreciation} = \\frac{\\text{Cost}}{\\text{Life}}$$\n\nThis means..."

**Formatting Guidelines (Use Strategically):**
- Use **bold** for key terms, headings, and important concepts only
- Use *italics* sparingly for emphasis on specific details
- Use bullet points (•) ONLY for actual lists of items, steps, or key points
- DO NOT add extra blank lines between list items or after headings
- DO NOT turn every sentence into a bullet point
- Use numbered lists for sequential steps or processes
- Create clear sections with appropriate spacing using headings
- Use > for important callouts or quotes when relevant
- Write in natural paragraphs with proper flow - not everything needs to be a list
- AVOID excessive line breaks and empty lines in your response
- Keep content compact and well-organized without unnecessary spacing

**Critical Markdown Rules:**
- List items should be on consecutive lines without empty lines between them
- Only use ONE blank line to separate different sections
- Never use multiple consecutive blank lines
- Format lists like: "• Item 1" followed immediately by "• Item 2" on the next line
- Place formulas directly after explanatory text without extra spacing
- Keep paragraphs flowing naturally without artificial breaks

**Content Structure Rules:**
- Start with a clear introductory sentence or paragraph
- Use bullet points only when listing multiple distinct items
- Keep related information in flowing paragraphs, not fragmented lists
- Use headings to organize major sections
- Include a **Next Steps** section when applicable with:
  • Relevant ScaleApp tools, calculators, or features to explore
  • Links to specific ScaleApp documentation sections
  • Actionable recommendations for implementation
  • Suggested follow-up resources or learning materials
- End with a clear conclusion or summary when appropriate

**Quality Standards:**
- Be comprehensive yet concise
- Maintain professional but accessible tone
- Ensure logical flow and organization
- Provide actionable insights when possible
- Always prioritize accuracy over completeness
- Write naturally - avoid over-formatting simple explanations

**Example of CORRECT formatting:**
The CGT formula involves several components:

• Calculate Gross Capital Gain: Sale Proceeds - Cost Base
• Apply any capital losses or discounts
• Add to your taxable income

**Next Steps:**
• Use ScaleApp's CGT calculator
• Review the tax guide for more details

**Example of INCORRECT formatting (DO NOT DO THIS):**
The CGT formula involves several components:

•

Calculate Gross Capital Gain:

•

Apply any capital losses

•

Add to taxable income


**Next Steps:**

•

Use ScaleApp's calculator
`;
  }

  private getUserPrompt(contextStr: string, query: string, sources?: string[]): string {
    let sourcesSection = '';
    if (sources && sources.length > 0) {
      sourcesSection = `\n\nAvailable Sources:\n${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}`;
    }

    return `
Context from ScaleApp Academy/Docs:
${contextStr}${sourcesSection}

User Question:
${query}

Instructions:
1. Analyze the question type (factual vs advice-seeking) and respond appropriately
2. For advice questions (should I, what's best, is it better to): ALWAYS include both pros and cons with clear headings
3. Convert any mathematical formulas from [ formula ] format to $$formula$$ format for proper LaTeX rendering
4. Place formulas on separate lines with proper spacing for better readability
5. CRITICAL: Generate clean markdown without excessive blank lines or spacing
6. Write list items consecutively without empty lines between them
7. Use only ONE blank line to separate different sections (headings, paragraphs, lists)
8. For advice questions, structure as: Brief intro → **Advantages:** → **Disadvantages/Considerations:** → **Key Factors:** → **Next Steps:** → Recommendation for professional advice
9. For factual questions, include **Next Steps:** section when relevant with actionable guidance
10. In Next Steps, include specific ScaleApp tools, calculators, documentation links, or implementation guidance when available in the context
11. IMPORTANT: Avoid excessive line breaks and empty lines in your response - keep formatting clean and compact
12. If you reference information from the context and sources are available, include relevant source links inline within your response
13. Ensure the response is helpful, accurate, and well-organized with natural language flow
`;
  }

  async generateResponse(query: string, contexts: string[], sources?: string[]): Promise<string> {
    try {
      const contextStr =
        contexts.length > 0 ? contexts.join('\n\n') : 'No relevant context found.';

      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(contextStr, query, sources);

      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Lower temperature for more focused responses
        max_tokens: 800, // Increased for more comprehensive responses
      });

      const result = response.choices[0].message?.content?.trim();
      return result || 'NOT_IN_DOCS';
    } catch (error) {
      this.logger.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }

  async *generateStreamingResponse(query: string, contexts: string[], sources?: string[]): AsyncIterable<string> {
    try {
      const contextStr =
        contexts.length > 0 ? contexts.join('\n\n') : 'No relevant context found.';

      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(contextStr, query, sources);

      const stream = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Lower temperature for more focused responses
        max_tokens: 800, // Increased for more comprehensive responses
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.logger.error('Error generating streaming response:', error);
      throw new Error('Failed to generate streaming response');
    }
  }

  isInitialized(): boolean {
    return !!this.openai;
  }
}