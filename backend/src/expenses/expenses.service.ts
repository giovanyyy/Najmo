import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: any, userId: bigint) {
    const accountId = BigInt(dto.account_id);
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new NotFoundException('Compte de trésorerie introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Get first active product to associate with the operation
      const product = await tx.products.findFirst({
        where: { is_active: true }
      });
      const productId = product ? product.id : BigInt(1);

      // 2. Create operations record
      const operation = await tx.operations.create({
        data: {
          operation_type: 'EXPENSE',
          product_id: productId,
          source_account_id: accountId,
          amount_dzd: dto.currency === 'DZD' ? dto.amount : 0,
          foreign_amount: dto.currency !== 'DZD' ? dto.amount : 0,
          foreign_currency: dto.currency !== 'DZD' ? dto.currency as any : null,
          notes: dto.description || `Charge: ${dto.category}`,
          operation_date: new Date(dto.expense_date),
          created_by_user_id: userId,
          status: 'COMPLETED'
        }
      });

      // 3. Compute treasury impact
      const balanceBefore = Number(account.current_balance || 0);
      const balanceAfter = balanceBefore - dto.amount;

      // 4. Create account movement entry (OUT)
      await tx.account_movements.create({
        data: {
          account_id: accountId,
          operation_id: operation.id,
          movement_type: 'OUT',
          amount: dto.amount,
          currency: dto.currency as any,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: dto.description || `Charge: ${dto.category}`
        }
      });

      // 5. Update account balance
      await tx.accounts.update({
        where: { id: accountId },
        data: { current_balance: balanceAfter }
      });

      // 6. Create the official expense record
      const expense = await tx.expenses.create({
        data: {
          category: dto.category.toUpperCase(),
          account_id: accountId,
          amount: dto.amount,
          currency: dto.currency as any,
          description: dto.description,
          expense_date: new Date(dto.expense_date),
          created_by_user_id: userId
        },
        include: {
          accounts: true,
          users: true
        }
      });

      await this.audit.log({
        userId,
        action: 'CREATE_EXPENSE',
        entityType: 'expenses',
        entityId: expense.id,
        newValues: expense,
      });

      return expense;
    });
  }

  async findAll(query: { category?: string; account_id?: string; startDate?: string; endDate?: string }) {
    const where: any = {};

    if (query.category) {
      where.category = query.category.toUpperCase();
    }

    if (query.account_id) {
      where.account_id = BigInt(query.account_id);
    }

    if (query.startDate || query.endDate) {
      where.expense_date = {};
      if (query.startDate) {
        where.expense_date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.expense_date.lte = new Date(query.endDate);
      }
    }

    return this.prisma.expenses.findMany({
      where,
      orderBy: { expense_date: 'desc' },
      include: {
        accounts: true,
        users: {
          select: { id: true, full_name: true, email: true }
        }
      }
    });
  }

  async remove(id: bigint, userId: bigint) {
    const expense = await this.prisma.expenses.findUnique({
      where: { id }
    });

    if (!expense) {
      throw new NotFoundException('Charge introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Restore account balance
      const account = await tx.accounts.findUnique({
        where: { id: expense.account_id }
      });

      if (account) {
        const newBalance = Number(account.current_balance || 0) + Number(expense.amount);
        await tx.accounts.update({
          where: { id: expense.account_id },
          data: { current_balance: newBalance }
        });
      }

      // 2. Find associated operation and delete it
      const operation = await tx.operations.findFirst({
        where: {
          operation_type: 'EXPENSE',
          source_account_id: expense.account_id,
          operation_date: expense.expense_date,
          created_by_user_id: expense.created_by_user_id,
          amount_dzd: expense.currency === 'DZD' ? expense.amount : 0,
          foreign_amount: expense.currency !== 'DZD' ? expense.amount : 0
        }
      });

      if (operation) {
        await tx.operations.delete({
          where: { id: operation.id }
        });
      }

      await tx.expenses.delete({
        where: { id }
      });

      await this.audit.log({
        userId,
        action: 'DELETE_EXPENSE',
        entityType: 'expenses',
        entityId: id,
        oldValues: expense,
      });

      return { success: true };
    });
  }
}
