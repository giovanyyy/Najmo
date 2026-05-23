import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('settings.editCompany')
  async getAllSettings() {
    // Basic mapping for frontend usage (we'll fetch specifically what we need for now)
    return {
      vipThreshold: await this.settingsService.getSetting('vipThreshold', '1000'),
      metaAdsMinThreshold: await this.settingsService.getSetting('metaAdsMinThreshold', '500'),
    };
  }

  @Post()
  @Permissions('settings.editCompany')
  async updateSetting(
    @Body() body: { key: string; value: string },
    @Request() req: any
  ) {
    await this.settingsService.setSetting(body.key, body.value, BigInt(req.user.id));
    return { success: true };
  }
}
