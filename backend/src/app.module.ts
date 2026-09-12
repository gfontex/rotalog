import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { UsagesModule } from './usages/usages.module';
import { TimeclockModule } from './timeclock/timeclock.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    ChecklistsModule,
    UsagesModule,
    TimeclockModule,
    NotificationsModule,
    TenantsModule,
  ],
})
export class AppModule {}
