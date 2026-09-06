import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Conexão com o banco de dados estabelecida via Prisma.');
    } catch (error) {
      console.warn('⚠️ Não foi possível conectar ao banco de dados imediatamente. Verifique a DATABASE_URL no .env.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
