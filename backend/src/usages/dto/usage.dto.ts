import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartUsageDto {
  @IsString()
  @IsNotEmpty({ message: 'Veículo é obrigatório' })
  vehicleId: string;

  @IsString()
  @IsNotEmpty({ message: 'Motorista é obrigatório' })
  driverId: string;

  @IsNumber()
  mileage: number;

  @IsNotEmpty({ message: 'Itens do checklist são obrigatórios' })
  itemsResult: Record<string, { ok: boolean; observation?: string }>;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class FinishUsageDto {
  @IsNumber()
  exitMileage: number;

  @IsNotEmpty({ message: 'Itens do checklist de devolução são obrigatórios' })
  itemsResult: Record<string, { ok: boolean; observation?: string }>;

  @IsString()
  @IsOptional()
  observation?: string;
}
