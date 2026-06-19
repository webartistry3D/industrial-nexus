import { Global, Module, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const logger = new Logger('PrismaModule');

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: async () => {
        const isProduction = process.env.NODE_ENV === 'production';
        const primaryUrl = isProduction
          ? (process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL)
          : (process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/industrial_nexus?schema=public');
        const fallbackUrl = isProduction
          ? (process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/industrial_nexus?schema=public')
          : (process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL);
        const primaryName = isProduction ? 'Render' : 'local';
        const fallbackName = isProduction ? 'local' : 'Render';

        logger.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

        const primaryClient = new PrismaService(primaryUrl);
        try {
          await primaryClient.$connect();
          logger.log(`Connected to ${primaryName} database`);
          return primaryClient;
        } catch (error: any) {
          await primaryClient.$disconnect().catch(() => null);

          if (error.code === 'P1001' && fallbackUrl) {
            logger.warn(`${primaryName} database unreachable, falling back to ${fallbackName} database`);
            const fallbackClient = new PrismaService(fallbackUrl);
            try {
              await fallbackClient.$connect();
              logger.log(`Connected to ${fallbackName} database (fallback mode)`);
              return fallbackClient;
            } catch (fallbackError) {
              logger.error(`Failed to connect to ${fallbackName} database as well`);
              throw fallbackError;
            }
          }

          throw error;
        }
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
