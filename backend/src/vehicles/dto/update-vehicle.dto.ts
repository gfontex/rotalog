import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { VehicleStatus } from '@prisma/client';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  plate?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @Min(1900)
  @IsOptional()
  year?: number;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentMileage?: number;

  @IsString()
  @IsOptional()
  branchId?: string;
}
