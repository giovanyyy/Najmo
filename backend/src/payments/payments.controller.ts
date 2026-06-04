import { Controller, Post, Body, Request, UseGuards, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';
import { payments_currency, payments_payment_method } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Permissions('invoices.markPaid')
  async create(
    @Request() req: any,
    @Body() body: {
      invoice_id: string;
      account_id: string;
      amount: string;
      currency: payments_currency;
      payment_method: payments_payment_method;
      reference_number?: string;
      notes?: string;
      payment_date?: string;
    }
  ) {
    const userId = BigInt(req.user.id);
    return this.paymentsService.create(body, userId);
  }

  @Get('invoice/:id')
  @Permissions('invoices.view')
  async getInvoicePayments(@Param('id') id: string) {
    return this.paymentsService.findByInvoice(BigInt(id));
  }
}
