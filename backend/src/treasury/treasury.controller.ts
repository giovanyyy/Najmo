import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('treasury')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TreasuryController {
  constructor(private readonly service: TreasuryService) {}

  @Get('ledger')
  @Permissions('operations.view')
  getLedger(
    @Query('account_id') accountId?: string,
    @Query('movement_type') movementType?: string,
    @Query('currency') currency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getLedger({
      accountId,
      movementType,
      currency,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @Permissions('dashboard.view')
  getStats() {
    return this.service.getStats();
  }

  @Get('forecast')
  @Permissions('dashboard.view')
  getForecast() {
    return this.service.getForecast();
  }
}
