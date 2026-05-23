import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running daily alerts generation job');
    await this.scanOverdueInvoices();
    await this.scanLowBalances();
  }

  async scanOverdueInvoices() {
    const now = new Date();
    const invoices = await this.prisma.invoices.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        due_date: { lt: now },
        deleted_at: null,
      },
      include: { clients: true }
    });

    for (const invoice of invoices) {
      const message = `Facture ${invoice.invoice_number} pour ${invoice.clients.full_name} en retard de paiement.`;
      
      // Check if an unread alert already exists for this invoice to prevent spam
      const existing = await this.prisma.alerts.findFirst({
        where: {
          entity_id: invoice.id,
          type: 'OVERDUE_INVOICE',
          is_resolved: false
        }
      });

      if (!existing) {
        await this.prisma.alerts.create({
          data: {
            type: 'OVERDUE_INVOICE',
            message,
            entity_id: invoice.id,
            entity_type: 'invoices',
            severity: 'HIGH',
          }
        });
        this.logger.log(`Created alert for overdue invoice: ${invoice.invoice_number}`);
      }
    }
  }

  async scanLowBalances() {
    // 1. Scan treasury accounts
    const accounts = await this.prisma.accounts.findMany({
      where: { is_active: true }
    });

    for (const acc of accounts) {
      const balance = Number(acc.current_balance);
      let threshold = 0;
      if (acc.currency === 'USD' || acc.currency === 'USDT' || acc.currency === 'EUR') {
        threshold = 50; // Arbitrary low threshold for foreign currencies
      } else if (acc.currency === 'DZD') {
        threshold = 50000; // Arbitrary 50k DZD low threshold
      }

      if (balance < threshold) {
        const message = `Le solde du compte ${acc.name} est bas (${balance} ${acc.currency}).`;
        
        const existing = await this.prisma.alerts.findFirst({
          where: {
            entity_id: acc.id,
            type: 'LOW_BALANCE',
            is_resolved: false
          }
        });

        if (!existing) {
          await this.prisma.alerts.create({
            data: {
              type: 'LOW_BALANCE',
              message,
              entity_id: acc.id,
              entity_type: 'accounts',
              severity: 'WARNING',
            }
          });
          this.logger.log(`Created alert for low balance: ${acc.name}`);
        }
      }
    }

    // 2. Scan Meta Ads accounts
    const adsAccounts = await this.prisma.meta_ads_accounts.findMany({
      where: { is_active: true },
      include: { meta_ads_deductions: true }
    });

    for (const ads of adsAccounts) {
      const totalDeductions = ads.meta_ads_deductions.reduce((sum, d) => sum + Number(d.amount), 0);
      const balance = Number(ads.initial_credit) - totalDeductions;
      const threshold = 1000;

      if (balance <= threshold) {
        const message = `Le solde du compte Meta Ads ${ads.name} est sous le seuil critique (${balance} ${ads.currency}).`;
        
        const existing = await this.prisma.alerts.findFirst({
          where: {
            entity_id: ads.id,
            type: 'LOW_BALANCE_ADS',
            is_resolved: false
          }
        });

        if (!existing) {
          await this.prisma.alerts.create({
            data: {
              type: 'LOW_BALANCE_ADS',
              message,
              entity_id: ads.id,
              entity_type: 'meta_ads_accounts',
              severity: 'HIGH',
            }
          });
          this.logger.log(`Created alert for low Ads balance: ${ads.name}`);
        }
      }
    }
  }

  async findAll() {
    return this.prisma.alerts.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount() {
    const count = await this.prisma.alerts.count({
      where: { is_resolved: false }
    });
    return { count };
  }

  async markAsRead(id: bigint) {
    return this.prisma.alerts.update({
      where: { id },
      data: { is_resolved: true, resolved_at: new Date() }
    });
  }

  async markAllAsRead() {
    return this.prisma.alerts.updateMany({
      where: { is_resolved: false },
      data: { is_resolved: true, resolved_at: new Date() }
    });
  }
}
