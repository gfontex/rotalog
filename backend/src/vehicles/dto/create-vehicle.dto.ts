import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum VehicleStatusEnum {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'Placa é obrigatória' })
  plate: string;

  @IsString()
  @IsNotEmpty({ message: 'Marca é obrigatória' })
  brand: string;

  @IsString()
  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  model: string;

  @IsNumber()
  year: number;

  @IsNumber()
  currentMileage: number;

  @IsEnum(VehicleStatusEnum)
  @IsOptional()
  status?: VehicleStatusEnum;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatusEnum)
  status: VehicleStatusEnum;

  @IsNumber()
  @IsOptional()
  currentMileage?: number;
}
