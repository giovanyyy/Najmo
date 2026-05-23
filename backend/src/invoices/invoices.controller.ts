import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('bulk-group')
  @Permissions('invoices.bulkGenerate', 'invoices.create')
  async createGrouped(@Body() data: { client_id: string, operation_ids: string[], currency?: string, notes?: string, payment_method?: string }, @Request() req: any) {
    try {
      return await this.invoicesService.createGrouped(data, BigInt(req.user.id));
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  @Get()
  @Permissions('invoices.view')
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  @Permissions('invoices.view')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(BigInt(id));
  }

  @Patch(':id/status')
  @Permissions('invoices.markPaid', 'invoices.editDraft')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; paid_amount: number },
    @Request() req: any
  ) {
    return this.invoicesService.updateStatus(BigInt(id), body.status, body.paid_amount, BigInt(req.user.id));
  }

  @Delete(':id')
  @Permissions('invoices.delete')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.remove(BigInt(id), BigInt(req.user.id));
  }

  @Post(':id/generate-pdf')
  @Permissions('invoices.exportPdf')
  async generatePdf(@Param('id') id: string) {
    try {
      const pdfUrl = await this.invoicesService.generatePdf(BigInt(id));
      return { success: true, url: pdfUrl };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
}
