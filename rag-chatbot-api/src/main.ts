import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://frontend:3000',

    // add your deployed frontends:
    'http://62.169.27.195:3010',
    'http://scaleapp.linkedinwriter.io',
    'https://scaleapp.linkedinwriter.io',
  ],
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
  maxAge: 86400, // cache preflight for a day (optional)
});


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('RAG Chatbot API')
    .setDescription('NestJS API for RAG chatbot with Pinecone and OpenAI')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🚀 RAG Chatbot API is running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/docs`);
}
bootstrap();