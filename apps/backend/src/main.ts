import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { join } from 'path';
import { AppModule } from './app.module';

class CorsIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: true, credentials: true },
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new CorsIoAdapter(app));
  
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
