import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';

@Injectable()
export class InternalTransfersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: any, userId: bigint) {
    const sourceAccountId = BigInt(dto.source_account_id);
    const destAccountId = BigInt(dto.destination_account_id);

    if (sourceAccountId === destAccountId) {
      throw new BadRequestException('Le compte source et le compte de destination doivent être différents');
    }

    const sourceAccount = await this.prisma.accounts.findUnique({ where: { id: sourceAccountId } });
    const destAccount = await this.prisma.accounts.findUnique({ where: { id: destAccountId } });

    if (!sourceAccount || !destAccount) {
      throw new NotFoundException('Compte de trésorerie source ou de destination introuvable');
    }

    const calculatedRate = dto.exchange_rate || (dto.destination_amount / dto.source_amount);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.products.findFirst({
        where: { is_active: true }
      });
      const productId = product ? product.id : BigInt(1);

      const amountDzd = sourceAccount.currency === 'DZD' ? dto.source_amount : (destAccount.currency === 'DZD' ? dto.destination_amount : 0);
      const foreignAmount = sourceAccount.currency !== 'DZD' ? dto.source_amount : (destAccount.currency !== 'DZD' ? dto.destination_amount : 0);
      const foreignCurrency = sourceAccount.currency !== 'DZD' ? sourceAccount.currency : (destAccount.currency !== 'DZD' ? destAccount.currency : null);

      const operation = await tx.operations.create({
        data: {
          operation_type: 'TRANSFER',
          product_id: productId,
          source_account_id: sourceAccountId,
          destination_account_id: destAccountId,
          amount_dzd: amountDzd,
          foreign_amount: foreignAmount,
          foreign_currency: foreignCurrency as any,
          exchange_rate: calculatedRate,
          notes: dto.notes || `Virement interne: ${sourceAccount.name} ➔ ${destAccount.name}`,
          operation_date: new Date(dto.transfer_date),
          created_by_user_id: userId,
          status: 'COMPLETED'
        }
      });

      const sourceBalanceBefore = Number(sourceAccount.current_balance || 0);
      const sourceBalanceAfter = sourceBalanceBefore - dto.source_amount;

      await tx.account_movements.create({
        data: {
          account_id: sourceAccountId,
          operation_id: operation.id,
          movement_type: 'OUT',
          amount: dto.source_amount,
          currency: sourceAccount.currency as any,
          balance_before: sourceBalanceBefore,
          balance_after: sourceBalanceAfter,
          description: dto.notes || `Virement vers : ${destAccount.name}`
        }
      });

      await tx.accounts.update({
        where: { id: sourceAccountId },
        data: { current_balance: sourceBalanceAfter }
      });

      const destBalanceBefore = Number(destAccount.current_balance || 0);
      const destBalanceAfter = destBalanceBefore + dto.destination_amount;

      await tx.account_movements.create({
        data: {
          account_id: destAccountId,
          operation_id: operation.id,
          movement_type: 'IN',
          amount: dto.destination_amount,
          currency: destAccount.currency as any,
          balance_before: destBalanceBefore,
          balance_after: destBalanceAfter,
          description: dto.notes || `Virement depuis : ${sourceAccount.name}`
        }
      });

      await tx.accounts.update({
        where: { id: destAccountId },
        data: { current_balance: destBalanceAfter }
      });

      const transfer = await tx.internal_transfers.create({
        data: {
          source_account_id: sourceAccountId,
          destination_account_id: destAccountId,
          source_amount: dto.source_amount,
          destination_amount: dto.destination_amount,
          exchange_rate: calculatedRate,
          notes: dto.notes,
          transfer_date: new Date(dto.transfer_date),
          created_by_user_id: userId
        }
      });

      await this.audit.log({
        userId,
        action: 'CREATE_INTERNAL_TRANSFER',
        entityType: 'internal_transfers',
        entityId: transfer.id,
        newValues: transfer,
      });

      return transfer;
    });
  }

  async findAll() {
    return this.prisma.internal_transfers.findMany({
      orderBy: { transfer_date: 'desc' },
      include: {
        accounts_internal_transfers_destination_account_idToaccounts: true,
        accounts_internal_transfers_source_account_idToaccounts: true,
        users: {
          select: { id: true, full_name: true, email: true }
        }
      }
    });
  }

  async remove(id: bigint, userId: bigint) {
    const transfer = await this.prisma.internal_transfers.findUnique({
      where: { id }
    });

    if (!transfer) {
      throw new NotFoundException('Virement interne introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Restore balances
      const sourceAcc = await tx.accounts.findUnique({ where: { id: transfer.source_account_id } });
      if (sourceAcc) {
        const newSrcBalance = Number(sourceAcc.current_balance || 0) + Number(transfer.source_amount);
        await tx.accounts.update({
          where: { id: transfer.source_account_id },
          data: { current_balance: newSrcBalance }
        });
      }

      const destAcc = await tx.accounts.findUnique({ where: { id: transfer.destination_account_id } });
      if (destAcc) {
        const newDestBalance = Number(destAcc.current_balance || 0) - Number(transfer.destination_amount);
        await tx.accounts.update({
          where: { id: transfer.destination_account_id },
          data: { current_balance: newDestBalance }
        });
      }

      // 2. Find associated operation and delete it
      const operation = await tx.operations.findFirst({
        where: {
          operation_type: 'TRANSFER',
          source_account_id: transfer.source_account_id,
          destination_account_id: transfer.destination_account_id,
          operation_date: transfer.transfer_date,
          created_by_user_id: transfer.created_by_user_id
        }
      });

      if (operation) {
        await tx.operations.delete({
          where: { id: operation.id }
        });
      }

      await tx.internal_transfers.delete({
        where: { id }
      });

      await this.audit.log({
        userId,
        action: 'DELETE_INTERNAL_TRANSFER',
        entityType: 'internal_transfers',
        entityId: id,
        oldValues: transfer,
      });

      return { success: true };
    });
  }
}
