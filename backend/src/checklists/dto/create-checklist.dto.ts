import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ChecklistTypeEnum {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export class CreateChecklistDto {
  @IsString()
  @IsNotEmpty({ message: 'Veículo é obrigatório' })
  vehicleId: string;

  @IsString()
  @IsNotEmpty({ message: 'Motorista é obrigatório' })
  driverId: string;

  @IsEnum(ChecklistTypeEnum)
  type: ChecklistTypeEnum;

  @IsNumber()
  mileage: number;

  @IsNotEmpty({ message: 'Resultados dos itens são obrigatórios' })
  itemsResult: Record<string, { ok: boolean; observation?: string }>;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsBoolean()
  @IsOptional()
  hasProblem?: boolean;

  @IsOptional()
  photoUrls?: string[];

  @IsString()
  @IsOptional()
  tenantId?: string;
}
