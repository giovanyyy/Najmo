import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreasuryService {
  constructor(private prisma: PrismaService) {}

  async getLedger(query: {
    accountId?: string;
    movementType?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (query.accountId) {
      where.account_id = BigInt(query.accountId);
    }

    if (query.movementType) {
      where.movement_type = query.movementType.toUpperCase() as any;
    }

    if (query.currency) {
      where.currency = query.currency.toUpperCase() as any;
    }

    if (query.startDate || query.endDate) {
      where.created_at = {};
      if (query.startDate) {
        where.created_at.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.created_at.lte = new Date(query.endDate);
      }
    }

    return this.prisma.account_movements.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        accounts: {
          select: {
            name: true,
            account_type: true
          }
        },
        operations: {
          select: {
            operation_type: true,
            notes: true,
            created_at: true
          }
        }
      }
    });
  }

  async getStats() {
    // 1. Calculate cumulative balance per currency
    const accounts = await this.prisma.accounts.findMany({
      where: { is_active: true }
    });

    const cumulativeBalances: Record<string, number> = {
      DZD: 0,
      USD: 0,
      EUR: 0,
      USDT: 0
    };

    accounts.forEach((acc) => {
      const cur = acc.currency.toUpperCase();
      const val = Number(acc.current_balance || 0);
      if (cumulativeBalances[cur] !== undefined) {
        cumulativeBalances[cur] += val;
      } else {
        cumulativeBalances[cur] = val;
      }
    });

    // 2. Calculate total Inflows & Outflows per currency (All-time or current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const movements = await this.prisma.account_movements.findMany();

    const flows: Record<string, { inflows: number; outflows: number; monthlyInflows: number; monthlyOutflows: number }> = {
      DZD: { inflows: 0, outflows: 0, monthlyInflows: 0, monthlyOutflows: 0 },
      USD: { inflows: 0, outflows: 0, monthlyInflows: 0, monthlyOutflows: 0 },
      EUR: { inflows: 0, outflows: 0, monthlyInflows: 0, monthlyOutflows: 0 },
      USDT: { inflows: 0, outflows: 0, monthlyInflows: 0, monthlyOutflows: 0 }
    };

    movements.forEach((mov) => {
      const cur = mov.currency.toUpperCase();
      const amt = Number(mov.amount);
      const isCurrentMonth = new Date(mov.created_at) >= startOfMonth;

      if (flows[cur]) {
        if (mov.movement_type === 'IN') {
          flows[cur].inflows += amt;
          if (isCurrentMonth) {
            flows[cur].monthlyInflows += amt;
          }
        } else if (mov.movement_type === 'OUT') {
          flows[cur].outflows += amt;
          if (isCurrentMonth) {
            flows[cur].monthlyOutflows += amt;
          }
        }
      }
    });

    return {
      cumulativeBalances,
      flows
    };
  }

  async getForecast() {
    // 1. Get current cumulative balances
    const stats = await this.getStats();
    const currentBalances = stats.cumulativeBalances;

    // 2. Fetch movements from past 90 days to calculate averages
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const movements = await this.prisma.account_movements.findMany({
      where: {
        created_at: {
          gte: ninetyDaysAgo
        }
      }
    });

    const ninetyDayStats: Record<string, { inflows: number; outflows: number }> = {
      DZD: { inflows: 0, outflows: 0 },
      USD: { inflows: 0, outflows: 0 },
      EUR: { inflows: 0, outflows: 0 },
      USDT: { inflows: 0, outflows: 0 }
    };

    movements.forEach((mov) => {
      const cur = mov.currency.toUpperCase();
      const amt = Number(mov.amount);
      if (ninetyDayStats[cur]) {
        if (mov.movement_type === 'IN') {
          ninetyDayStats[cur].inflows += amt;
        } else if (mov.movement_type === 'OUT') {
          ninetyDayStats[cur].outflows += amt;
        }
      }
    });

    // 3. Compute forecasts per currency (average monthly = 90 days total / 3)
    const forecasts: Record<string, {
      currentBalance: number;
      avgMonthlyInflow: number;
      avgMonthlyOutflow: number;
      avgMonthlyNetCashflow: number;
      projectedBalance30Days: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
    }> = {};

    Object.keys(ninetyDayStats).forEach((cur) => {
      const curBal = currentBalances[cur] || 0;
      const statsCur = ninetyDayStats[cur];

      const avgIn = statsCur.inflows / 3;
      const avgOut = statsCur.outflows / 3;
      const avgNet = avgIn - avgOut;
      const projBal = Math.max(0, curBal + avgNet); // Solde ne peut pas être négatif théoriquement

      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (avgNet > 0.01) {
        trend = 'UP';
      } else if (avgNet < -0.01) {
        trend = 'DOWN';
      }

      forecasts[cur] = {
        currentBalance: curBal,
        avgMonthlyInflow: avgIn,
        avgMonthlyOutflow: avgOut,
        avgMonthlyNetCashflow: avgNet,
        projectedBalance30Days: projBal,
        trend
      };
    });

    return forecasts;
  }
}
