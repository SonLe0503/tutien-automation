import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable Cross-Origin Resource Sharing for React Frontend
  app.enableCors();

  // Serve generated media files statically
  app.use('/audio', express.static(path.join(process.cwd(), 'audio')));
  app.use('/output', express.static(path.join(process.cwd(), 'output')));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
