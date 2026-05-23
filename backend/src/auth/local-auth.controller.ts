import { Controller, Post, Body, UnauthorizedException, Get } from '@nestjs/common';
import { LocalAuthService } from './local-auth.service';

@Controller('auth')
export class LocalAuthController {
  constructor(private readonly localAuthService: LocalAuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) {
      throw new UnauthorizedException('Email et mot de passe requis');
    }
    return this.localAuthService.login(email, password);
  }

  @Get('me')
  async getMe() {
    // Simple endpoint to verify the auth system works
    return { status: 'ok', message: 'Auth system operational' };
  }

  @Post('setup-admin')
  async setupAdmin() {
    // One-time setup endpoint to create default admin account
    return this.localAuthService.createDefaultAdmin();
  }
}
