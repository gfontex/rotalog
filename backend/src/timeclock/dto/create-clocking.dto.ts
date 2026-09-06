import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ClockingType } from '@prisma/client';

export class CreateClockingDto {
  @IsEnum(ClockingType, {
    message: 'Tipo de batida inválido. Tipos aceitos: IN (Entrada), OUT (Saída), LUNCH_OUT (Saída Almoço), LUNCH_IN (Retorno Almoço)',
  })
  type: ClockingType;

  @IsArray()
  @IsOptional()
  capturedEmbedding?: number[];

  @IsString()
  @IsOptional()
  fallbackReason?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsOptional()
  timestamp?: string;
}
