import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';

@Injectable()
export class AdsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getAdsAccounts() {
    const accounts = await this.prisma.meta_ads_accounts.findMany({
      where: { is_active: true },
      include: {
        meta_ads_deductions: {
          orderBy: { deduction_date: 'desc' },
          take: 10,
        }
      }
    });

    return accounts.map(acc => {
      const totalDeductions = acc.meta_ads_deductions.reduce((sum, d) => sum + Number(d.amount), 0);
      const balance = Number(acc.initial_credit) - totalDeductions;
      const threshold = 1000; // default
      let alert = null;

      if (balance < threshold) {
        alert = 'SOLDE_BAS';
      }

      const account_movements = acc.meta_ads_deductions.map(d => ({
        id: d.id,
        created_at: d.deduction_date,
        description: d.description,
        movement_type: 'OUT',
        amount: d.amount,
      }));

      return { ...acc, current_balance: balance, balance, alert, account_movements };
    });
  }

  async createAdsAccount(data: { name: string, currency: string, min_threshold?: number }, userId: bigint) {
    const account = await this.prisma.meta_ads_accounts.create({
      data: {
        name: data.name,
        currency: data.currency as any,
        initial_credit: 0,
        platform: 'Facebook',
        due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        is_active: true,
      }
    });

    await this.audit.log({
      userId,
      action: 'CREATE_ADS_ACCOUNT',
      entityType: 'meta_ads_accounts',
      entityId: account.id,
      newValues: account,
    });

    return account;
  }

  async recordSpending(data: {
    account_id: string;
    amount: number;
    description?: string;
    date?: string;
  }, userId: bigint) {
    const account = await this.prisma.meta_ads_accounts.findUnique({
      where: { id: BigInt(data.account_id) }
    });

    if (!account || !account.is_active) throw new NotFoundException('Compte Ads introuvable');

    return this.prisma.$transaction(async (tx) => {
      // Create deduction
      const deduction = await tx.meta_ads_deductions.create({
        data: {
          account_id: account.id,
          amount: data.amount,
          description: data.description || 'Prélèvement Meta Ads',
          deduction_date: data.date ? new Date(data.date) : new Date(),
        }
      });

      await this.audit.log({
        userId,
        action: 'CREATE_ADS_DEDUCTION',
        entityType: 'meta_ads_deductions',
        entityId: deduction.id,
        newValues: deduction,
      });

      return deduction;
    });
  }

  async recordRecharge(data: {
    ads_account_id: string;
    source_account_id: string;
    amount: number;
    source_amount?: number;
    description?: string;
  }, userId: bigint) {
    const adsAccount = await this.prisma.meta_ads_accounts.findUnique({ where: { id: BigInt(data.ads_account_id) } });
    const sourceAccount = await this.prisma.accounts.findUnique({ where: { id: BigInt(data.source_account_id) } });

    if (!adsAccount || !adsAccount.is_active || !sourceAccount || sourceAccount.deleted_at) {
      throw new NotFoundException('Compte source ou compte Ads introuvable');
    }

    const amountToDeduct = data.source_amount || data.amount;

    return this.prisma.$transaction(async (tx) => {
      // 1. Mouvement de sortie du compte source
      const sourceBalanceBefore = Number(sourceAccount.current_balance);
      const sourceBalanceAfter = sourceBalanceBefore - amountToDeduct;

      await tx.accounts.update({
        where: { id: sourceAccount.id },
        data: { current_balance: sourceBalanceAfter }
      });

      const product = await tx.products.findFirst({
        where: { is_active: true }
      });
      const productId = product ? product.id : BigInt(1);

      const operation = await tx.operations.create({
        data: {
          operation_type: 'TRANSFER',
          product_id: productId,
          source_account_id: sourceAccount.id,
          amount_dzd: sourceAccount.currency === 'DZD' ? amountToDeduct : 0,
          foreign_amount: sourceAccount.currency !== 'DZD' ? amountToDeduct : 0,
          foreign_currency: sourceAccount.currency !== 'DZD' ? sourceAccount.currency as any : null,
          notes: data.description || `Recharge Ads: ${data.amount} ${adsAccount.currency}`,
          operation_date: new Date(),
          created_by_user_id: userId,
          status: 'COMPLETED'
        }
      });

      await tx.account_movements.create({
        data: {
          account_id: sourceAccount.id,
          operation_id: operation.id,
          movement_type: 'OUT',
          amount: amountToDeduct,
          currency: sourceAccount.currency as any,
          balance_before: sourceBalanceBefore,
          balance_after: sourceBalanceAfter,
          description: `Transfert vers Ads: ${adsAccount.name}`
        }
      });

      // 2. Add to Ads account initial_credit (so it acts like available balance pool)
      const adsBalanceBefore = Number(adsAccount.initial_credit);
      const adsBalanceAfter = adsBalanceBefore + data.amount;

      await tx.meta_ads_accounts.update({
        where: { id: adsAccount.id },
        data: { initial_credit: adsBalanceAfter }
      });

      await this.audit.log({
        userId,
        action: 'RECHARGE_ADS_ACCOUNT',
        entityType: 'meta_ads_accounts',
        entityId: adsAccount.id,
        newValues: { rechargeAmount: data.amount, sourceAmount: amountToDeduct },
      });

      return { success: true, newBalance: adsBalanceAfter };
    });
  }
}
