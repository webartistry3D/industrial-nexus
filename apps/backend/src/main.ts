import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { join } from 'path';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
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
  app.use(helmet());
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

  // Swagger API docs — available in all environments
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Industrial Nexus API')
    .setDescription('Logistics platform REST API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Optional Basic Auth protection for production
  const docsUsername = configService.get<string>('DOCS_USERNAME');
  const docsPassword = configService.get<string>('DOCS_PASSWORD');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  if (isProduction && docsUsername && docsPassword) {
    const docsPath = '/api/docs';
    app.use(docsPath, (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="API Docs"');
        return res.status(401).send('Authentication required');
      }
      const [providedUser, providedPass] = Buffer.from(auth.slice(6), 'base64')
        .toString('utf8')
        .split(':');
      const userMatch = safeCompare(providedUser ?? '', docsUsername);
      const passMatch = safeCompare(providedPass ?? '', docsPassword);
      if (!userMatch || !passMatch) {
        res.set('WWW-Authenticate', 'Basic realm="API Docs"');
        return res.status(401).send('Invalid credentials');
      }
      next();
    });
  }

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  console.log(`Swagger docs available at http://localhost:${configService.get('PORT', 3001)}/api/docs`);

  function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  // Serve static uploads only in local dev (production uses S3 URLs directly)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads/',
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    });
  }

  const port = configService.get<number>('PORT', 3001);
  
  await app.listen(port);

  console.log(`Industrial Nexus API running on port ${port}`);
}
bootstrap();
