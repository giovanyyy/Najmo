import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('ads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('accounts')
  @Permissions('transfers.view', 'operations.view')
  async getAccounts() {
    return this.adsService.getAdsAccounts();
  }

  @Post('accounts')
  @Permissions('transfers.create')
  async createAccount(
    @Request() req: any,
    @Body() body: { name: string, currency: string, min_threshold?: number }
  ) {
    return this.adsService.createAdsAccount(body, BigInt(req.user.id));
  }

  @Post('spending')
  @Permissions('transfers.create')
  async recordSpending(
    @Request() req: any,
    @Body() body: {
      account_id: string;
      amount: number;
      description?: string;
      date?: string;
    }
  ) {
    return this.adsService.recordSpending(body, BigInt(req.user.id));
  }

  @Post('recharge')
  @Permissions('transfers.create')
  async recordRecharge(
    @Request() req: any,
    @Body() body: {
      ads_account_id: string;
      source_account_id: string;
      amount: number;
      source_amount?: number;
      description?: string;
    }
  ) {
    return this.adsService.recordRecharge(body, BigInt(req.user.id));
  }
}
