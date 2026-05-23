import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(data: any, userId: bigint) {
    try {
      const { 
        client_id, product_id, amount_dzd, profit, operation_type, notes, 
        source_account_id, destination_account_id, operation_date, operation_cost, attachment_url 
      } = data;

      // 1. Compatibility Validation
      if (product_id) {
        const compatibilities = await this.prisma.product_account_compatibility.findMany({
          where: { product_id: BigInt(product_id) }
        });

        if (compatibilities.length > 0) {
          if (source_account_id) {
            const isSourceValid = compatibilities.some(c => 
              c.account_id.toString() === source_account_id.toString() && 
              (c.compatibility_type === 'SOURCE' || c.compatibility_type === 'BOTH')
            );
            if (!isSourceValid) throw new BadRequestException("Le compte source n'est pas compatible avec ce produit.");
          }

          if (destination_account_id) {
            const isDestValid = compatibilities.some(c => 
              c.account_id.toString() === destination_account_id.toString() && 
              (c.compatibility_type === 'DESTINATION' || c.compatibility_type === 'BOTH')
            );
            if (!isDestValid) throw new BadRequestException("Le compte destination n'est pas compatible avec ce produit.");
          }
        }
      }

      // 2. Create Operation in PENDING state (No account movements yet)
      const operation = await this.prisma.operations.create({
        data: {
          operation_type,
          amount_dzd: parseFloat(amount_dzd) || 0,
          foreign_amount: parseFloat(data.amount_currency) || 0,
          foreign_currency: data.currency && data.currency !== 'DZD' ? data.currency : null,
          profit: parseFloat(profit) || 0,
          operation_cost: parseFloat(operation_cost) || 0,
          notes,
          attachment_url: attachment_url || null,
          operation_date: operation_date ? new Date(operation_date) : new Date(),
          created_by_user_id: userId,
          product_id: BigInt(product_id),
          client_id: client_id ? BigInt(client_id) : null,
          source_account_id: source_account_id ? BigInt(source_account_id) : null,
          destination_account_id: destination_account_id ? BigInt(destination_account_id) : null,
          status: 'PENDING',
        },
      });

      await this.audit.log({
        userId,
        action: 'CREATE_OPERATION',
        entityType: 'operations',
        entityId: operation.id,
        newValues: operation,
      });

      return operation;
    } catch (error) {
      console.error('[OPERATIONS ERROR] CRITICAL FAILURE:', error);
      throw error;
    }
  }

  async validateOperation(id: bigint, userId: bigint) {
    const operation = await this.prisma.operations.findUnique({
      where: { id },
    });

    if (!operation || operation.deleted_at) {
      throw new NotFoundException('Opération introuvable');
    }

    if (operation.status !== 'PENDING') {
      throw new BadRequestException('Seules les opérations PENDING peuvent être validées');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Mark as COMPLETED
      const updatedOp = await tx.operations.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          validated_by_user_id: userId,
          updated_at: new Date(),
        },
      });

      // 2. Update SOURCE account (INFLOW)
      if (operation.source_account_id) {
        const sourceAcc = await tx.accounts.findUnique({ where: { id: operation.source_account_id } });
        if (sourceAcc) {
          const amountToAdd = sourceAcc.currency === 'DZD' ? Number(operation.amount_dzd) : Number(operation.foreign_amount);
          const balanceBefore = Number(sourceAcc.current_balance);
          const balanceAfter = balanceBefore + amountToAdd;

          await tx.accounts.update({
            where: { id: sourceAcc.id },
            data: { current_balance: balanceAfter },
          });

          await tx.account_movements.create({
            data: {
              account_id: sourceAcc.id,
              operation_id: operation.id,
              movement_type: 'IN',
              amount: amountToAdd,
              currency: sourceAcc.currency as any,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              description: `Entrée pour ${operation.operation_type} - Validation`,
            },
          });
        }
      }

      // 3. Update DESTINATION account (OUTFLOW)
      if (operation.destination_account_id) {
        const destAcc = await tx.accounts.findUnique({ where: { id: operation.destination_account_id } });
        if (destAcc) {
          const amountToSub = destAcc.currency === 'DZD' ? Number(operation.amount_dzd) : Number(operation.foreign_amount);
          const balanceBefore = Number(destAcc.current_balance);
          const balanceAfter = balanceBefore - amountToSub;

          await tx.accounts.update({
            where: { id: destAcc.id },
            data: { current_balance: balanceAfter },
          });

          await tx.account_movements.create({
            data: {
              account_id: destAcc.id,
              operation_id: operation.id,
              movement_type: 'OUT',
              amount: amountToSub,
              currency: destAcc.currency as any,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              description: `Sortie pour ${operation.operation_type} - Validation`,
            },
          });
        }
      }

      // 4. Update Client Stats
      if (operation.client_id) {
        await tx.clients.update({
          where: { id: operation.client_id },
          data: {
            total_operations: { increment: 1 },
            total_profit: { increment: Number(operation.profit) },
          },
        });
      }

      await this.audit.log({
        userId,
        action: 'VALIDATE_OPERATION',
        entityType: 'operations',
        entityId: id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'COMPLETED' },
      });

      return updatedOp;
    });
  }

  async cancelOperation(id: bigint, userId: bigint) {
    const operation = await this.prisma.operations.findUnique({ where: { id } });
    if (!operation || operation.deleted_at) throw new NotFoundException('Opération introuvable');
    if (operation.status !== 'PENDING') throw new BadRequestException('Seules les opérations PENDING peuvent être annulées');

    const updated = await this.prisma.operations.update({
      where: { id },
      data: { status: 'CANCELLED', updated_at: new Date() },
    });

    await this.audit.log({
      userId,
      action: 'CANCEL_OPERATION',
      entityType: 'operations',
      entityId: id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'CANCELLED' },
    });

    return updated;
  }

  async findAll() {
    return this.prisma.operations.findMany({
      where: { deleted_at: null },
      include: {
        clients: true,
        products: true,
        accounts_operations_source_account_idToaccounts: true,
        accounts_operations_destination_account_idToaccounts: true,
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async findOne(id: bigint) {
    const op = await this.prisma.operations.findUnique({
      where: { id },
      include: {
        clients: true,
        products: true,
        accounts_operations_source_account_idToaccounts: true,
        accounts_operations_destination_account_idToaccounts: true,
        account_movements: true,
        operation_files: true,
      },
    });

    if (!op || op.deleted_at) throw new NotFoundException('Opération introuvable');
    return op;
  }

  async getUnbilledOperations() {
    return this.prisma.operations.findMany({
      where: {
        operation_type: 'SALE',
        invoiced: false,
        status: 'COMPLETED',
        deleted_at: null,
      },
      include: {
        clients: true,
        products: true,
      },
      orderBy: { operation_date: 'desc' },
    });
  }
}
