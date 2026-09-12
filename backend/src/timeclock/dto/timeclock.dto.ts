import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimeClockTypeEnum {
  ENTRADA = 'ENTRADA',
  ALMOCO_SAIDA = 'ALMOCO_SAIDA',
  ALMOCO_RETORNO = 'ALMOCO_RETORNO',
  SAIDA = 'SAIDA',
}

export class PunchClockDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do colaborador é obrigatório' })
  userId: string;

  @IsEnum(TimeClockTypeEnum)
  type: TimeClockTypeEnum;

  @IsOptional()
  timestamp?: string;

  @IsBoolean()
  @IsOptional()
  isOffline?: boolean;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class SyncTimeClocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PunchClockDto)
  clocks: PunchClockDto[];
}
