import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const configService = app.get(ConfigService);

  const corsOrigins = configService.get<string>('CORS_ORIGIN', '')
    ? configService.get<string>('CORS_ORIGIN', '').split(',')
    : true;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Serve static files for uploaded documents
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const port = configService.get<number>('PORT', 3001);
  
  await app.listen(port);
  console.log(`Industrial Nexus API running on port ${port}`);
}
bootstrap();
