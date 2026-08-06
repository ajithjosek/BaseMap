import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import * as dotenv from 'dotenv';
import { validateEnv } from './config/env.config';

dotenv.config();

async function bootstrap() {
  // Fail fast on invalid/missing required env vars before the app starts.
  validateEnv();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: ['http://localhost:3005', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  
  const port = configService.get<number>('PORT') || 4001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
