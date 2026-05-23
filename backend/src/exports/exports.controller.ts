import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('exports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get(':table')
  @Permissions('dashboard.view') // Assuming basic view rights for simplicity
  async exportTable(@Param('table') table: string) {
    try {
      const url = await this.exportsService.exportTableToExcel(table, {});
      return { success: true, url };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
}
