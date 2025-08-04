import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Set /api prefix
  app.setGlobalPrefix('api');

  // ✅ Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:3000', // Your Next.js frontend URL
    credentials: true,
  });

  // ✅ Enable auto-validation globally
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(4000);
}
bootstrap();
