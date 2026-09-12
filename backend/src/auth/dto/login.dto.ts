import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'A Empresa / Base é obrigatória (Ex: MK Seguranca)' })
  company: string;

  @IsString()
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  cpf: string;

  @IsString()
  @IsNotEmpty({ message: 'A Senha é obrigatória' })
  password: string;
}

export class QuickLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  cpf: string;
}
