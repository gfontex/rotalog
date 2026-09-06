import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class VerifyBiometricsDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID do colaborador é obrigatório' })
  userId: string;

  @IsArray({ message: 'O vetor capturado deve ser fornecido como array numérico' })
  capturedEmbedding: number[];

  @IsNumber()
  @IsOptional()
  threshold?: number; // Padrão: 0.80 para distância euclidiana
}
