import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString({ message: 'O nome é obrigatório' })
  @IsNotEmpty()
  name: string;

  @IsString({ message: 'O CPF é obrigatório' })
  @IsNotEmpty()
  cpf: string;

  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve conter ao menos 6 caracteres' })
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  branchId?: string;
}
