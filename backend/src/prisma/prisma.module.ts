import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DbStore } from './db-store';

@Global()
@Module({
  providers: [PrismaService, DbStore],
  exports: [PrismaService, DbStore],
})
export class PrismaModule {}
