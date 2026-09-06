import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Forneça o login (empresa, CPF ou e-mail)' })
  @IsNotEmpty({ message: 'O login é obrigatório' })
  login: string;

  @IsString({ message: 'A senha deve ser uma string' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
