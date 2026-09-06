import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ChecklistType } from '@prisma/client';

export class CreateChecklistDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID do veículo é obrigatório' })
  vehicleId: string;

  @IsEnum(ChecklistType, { message: 'Tipo inválido. Deve ser ENTRY (Entrada) ou EXIT (Saída)' })
  type: ChecklistType;

  @IsInt()
  @Min(0, { message: 'A quilometragem não pode ser negativa' })
  mileage: number;

  @IsObject({ message: 'Os itens do checklist devem ser fornecidos como um objeto' })
  itemsResult: Record<string, boolean>;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsOptional()
  photoUrls?: string[];

  @IsOptional()
  hasProblem?: boolean;
}
