import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Auth, CurrentUser } from './auth.decorators';
import { User } from '@accounting/db';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class SupabaseLoginDto {
  @IsString()
  accessToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('config')
  config() {
    return {
      supabaseEnabled: this.authService.isSupabaseEnabled(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    };
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('supabase')
  supabaseLogin(@Body() dto: SupabaseLoginDto) {
    return this.authService.loginWithSupabase(dto.accessToken);
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }
}
