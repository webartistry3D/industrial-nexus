import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly renderDatabaseUrl = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;
  private readonly localDatabaseUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/industrial_nexus?schema=public';
  private usingFallback = false;

  constructor() {
    const renderUrl = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;
    super({
      datasources: {
        db: {
          url: renderUrl,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to Render database');
    } catch (error: any) {
      if (error.code === 'P1001') {
        this.logger.warn('Render database unreachable, falling back to local database');
        this.usingFallback = true;
        
        // Disconnect from failed connection
        await this.$disconnect();
        
        // Reinitialize with local database URL
        Object.assign(this, new PrismaClient({
          datasources: {
            db: {
              url: this.localDatabaseUrl,
            },
          },
        }));
        
        try {
          await this.$connect();
          this.logger.log('Connected to local database (fallback mode)');
        } catch (localError) {
          this.logger.error('Failed to connect to local database as well');
          throw localError;
        }
      } else {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log(`Disconnected from database (${this.usingFallback ? 'local fallback' : 'Render'})`);
  }
}
