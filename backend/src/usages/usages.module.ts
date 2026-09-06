import { Module } from '@nestjs/common';
import { UsagesService } from './usages.service.js';
import { UsagesController } from './usages.controller.js';

@Module({
  controllers: [UsagesController],
  providers: [UsagesService],
  exports: [UsagesService],
})
export class UsagesModule {}
