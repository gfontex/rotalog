import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, QuickLoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('quick-login')
  async quickLogin(@Body() quickLoginDto: QuickLoginDto) {
    return this.authService.quickLogin(quickLoginDto);
  }

  @Get('companies')
  async getCompanies() {
    return this.authService.getCompanies();
  }

  @Get('quick-users')
  async getQuickUsers() {
    return this.authService.getQuickUsers();
  }
}
