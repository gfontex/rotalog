import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class EnrollBiometricsDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID do colaborador é obrigatório' })
  userId: string;

  @IsArray({ message: 'O vetor de embedding deve ser um array numérico de 192 posições' })
  embeddingVector: number[];

  @IsBoolean({ message: 'O consentimento LGPD é obrigatório' })
  consentGiven: boolean;
}
