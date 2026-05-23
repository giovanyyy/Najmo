import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): string {
    return 'OK';
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Profil utilisateur extrait du JWT Keycloak',
      user,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrateur')
  getAdmin(@CurrentUser() user: any) {
    return {
      message: 'Bienvenue Administrateur',
      user,
    };
  }

  @Get('comptable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Comptable')
  getAccountant(@CurrentUser() user: any) {
    return {
      message: 'Espace Comptabilité',
      user,
    };
  }

  @Get('employe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Employé')
  getEmploye(@CurrentUser() user: any) {
    return {
      message: 'Espace Employé',
      user,
    };
  }
}
