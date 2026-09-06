import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'A placa do veículo é obrigatória' })
  plate: string;

  @IsString()
  @IsNotEmpty({ message: 'A marca é obrigatória' })
  brand: string;

  @IsString()
  @IsNotEmpty({ message: 'O modelo é obrigatório' })
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

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
