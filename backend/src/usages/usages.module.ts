import { Module } from '@nestjs/common';
import { UsagesService } from './usages.service';
import { UsagesController } from './usages.controller';
import { ChecklistsModule } from '../checklists/checklists.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [ChecklistsModule, VehiclesModule],
  controllers: [UsagesController],
  providers: [UsagesService],
  exports: [UsagesService],
})
export class UsagesModule {}
