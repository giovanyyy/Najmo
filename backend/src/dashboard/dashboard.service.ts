import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    // 1. Calculate Total Revenue (CA) - Sum of SALE operations
    const revenueResult = await this.prisma.operations.aggregate({
      _sum: {
        amount_dzd: true,
      },
      where: {
        operation_type: 'SALE',
        status: 'COMPLETED',
      },
    });

    // 2. Calculate Total Profit
    const profitResult = await this.prisma.operations.aggregate({
      _sum: {
        profit: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });

    // 3. Calculate Liquidity per Currency
    const accounts = await this.prisma.accounts.groupBy({
      by: ['currency'],
      _sum: {
        current_balance: true,
      },
      where: {
        is_active: true,
      },
    });

    // 4. Count Pending Operations
    const pendingCount = await this.prisma.operations.count({
      where: {
        status: 'PENDING',
      },
    });

    return {
      revenue: Number(revenueResult._sum.amount_dzd) || 0,
      profit: Number(profitResult._sum.profit) || 0,
      liquidity: accounts.map(a => ({
        currency: a.currency,
        amount: Number(a._sum.current_balance) || 0,
      })),
      pendingOperations: pendingCount,
    };
  }

  async getMonthlyRevenue() {
    // Basic implementation for the chart
    // In a real scenario, you'd group by month
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const operations = await this.prisma.operations.findMany({
      where: {
        operation_type: 'SALE',
        status: 'COMPLETED',
        operation_date: {
          gte: startOfYear,
        },
      },
      select: {
        amount_dzd: true,
        operation_date: true,
      },
    });

    // Grouping by month for the frontend
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthlyData = months.map((month, index) => {
      const total = operations
        .filter(op => op.operation_date.getMonth() === index)
        .reduce((sum, op) => sum + Number(op.amount_dzd), 0);
      return { month, total };
    });

    return monthlyData;
  }

  async getAlerts() {
    const alerts: any[] = [];
    const now = new Date();

    // 1. Retards clients (Overdue unpaid/overdue invoices)
    const overdueInvoices = await this.prisma.invoices.findMany({
      where: {
        status: { in: ['UNPAID', 'OVERDUE'] },
        due_date: { lt: now }
      },
      include: {
        clients: true
      }
    }) as any[];

    overdueInvoices.forEach((inv) => {
      const remaining = Number(inv.total_amount) - Number(inv.paid_amount);
      const clientName = inv.clients?.full_name || 'Client Inconnu';
      alerts.push({
        id: `overdue-${inv.id}`,
        type: 'retard_client',
        title: 'Retard Client ⏳',
        description: `Facture n°${inv.invoice_number} du client "${clientName}" est impayée. Reste dû : ${remaining.toLocaleString('fr-FR')} DZD. Échéance dépassée le ${new Date(inv.due_date).toLocaleDateString('fr-FR')}.`,
        severity: 'CRITICAL',
        date: inv.due_date
      });
    });

    // 2. Crédits élevés (Outstanding unpaid total > 300,000 DZD per client)
    const clients = await this.prisma.clients.findMany({
      include: {
        invoices: {
          where: {
            status: { in: ['UNPAID', 'OVERDUE'] }
          }
        }
      }
    }) as any[];

    clients.forEach((c) => {
      const totalOutstanding = c.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);
      if (totalOutstanding > 300000) {
        alerts.push({
          id: `highcredit-${c.id}`,
          type: 'credit_eleve',
          title: 'Crédit Client Élevé ⚠️',
          description: `Le client ${c.full_name} présente un encours de crédit global très élevé de ${totalOutstanding.toLocaleString('fr-FR')} DZD.`,
          severity: 'WARNING',
          date: new Date()
        });
      }
    });

    // 3. Solde négatif (accounts.current_balance < 0)
    const negativeAccounts = await this.prisma.accounts.findMany({
      where: {
        current_balance: { lt: 0 }
      }
    });

    negativeAccounts.forEach((acc) => {
      alerts.push({
        id: `negbal-${acc.id}`,
        type: 'solde_negatif',
        title: 'Solde Négatif 🚨',
        description: `Le compte de trésorerie ${acc.name} présente un solde déficitaire de ${Number(acc.current_balance).toLocaleString('fr-FR')} ${acc.currency} !`,
        severity: 'CRITICAL',
        date: new Date()
      });
    });

    // 4. Compte vide (accounts.current_balance = 0)
    const emptyAccounts = await this.prisma.accounts.findMany({
      where: {
        current_balance: 0
      }
    });

    emptyAccounts.forEach((acc) => {
      alerts.push({
        id: `emptybal-${acc.id}`,
        type: 'compte_vide',
        title: 'Compte Vide 💳',
        description: `Le compte ${acc.name} est vide (solde à 0.00 ${acc.currency}). Pensez à l'approvisionner via un virement interne.`,
        severity: 'WARNING',
        date: new Date()
      });
    });

    // 5. Opérations non rentables (operations.profit < 0)
    const unprofitableOps = await this.prisma.operations.findMany({
      where: {
        status: 'COMPLETED',
        profit: { lt: 0 }
      },
      include: {
        products: true
      },
      take: 10 // Limit to most recent unprofitable operations
    }) as any[];

    unprofitableOps.forEach((op) => {
      alerts.push({
        id: `unprofitable-${op.id}`,
        type: 'deficit',
        title: 'Opération Déficitaire 💸',
        description: `L'opération n°${op.id} sur le produit "${op.products?.name || 'Inconnu'}" présente une marge négative de ${Number(op.profit).toLocaleString('fr-FR')} DZD.`,
        severity: 'WARNING',
        date: op.operation_date
      });
    });

    // Sort alerts so CRITICAL ones are first
    alerts.sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return alerts;
  }
}
