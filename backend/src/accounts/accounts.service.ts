import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.accounts.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: bigint) {
    const account = await this.prisma.accounts.findUnique({
      where: { id },
    });
    if (!account || account.deleted_at) {
      throw new NotFoundException('Compte introuvable');
    }
    return account;
  }

  async create(data: any, userId: bigint) {
    const account = await this.prisma.accounts.create({
      data: {
        name: data.name,
        account_type: data.account_type,
        currency: data.currency,
        initial_balance: data.initial_balance || 0,
        current_balance: data.initial_balance || 0,
        min_threshold: data.min_threshold || 0,
        account_number: data.account_number,
        description: data.description,
      },
    });

    await this.audit.log({
      userId,
      action: 'CREATE_ACCOUNT',
      entityType: 'accounts',
      entityId: account.id,
      newValues: account,
    });

    return account;
  }

  async update(id: bigint, data: any, userId: bigint) {
    const oldAccount = await this.findOne(id);
    
    // Recalculate balance if initial balance changes
    let newCurrentBalance = oldAccount.current_balance;
    if (data.initial_balance !== undefined && Number(data.initial_balance) !== Number(oldAccount.initial_balance)) {
      const diff = Number(data.initial_balance) - Number(oldAccount.initial_balance);
      newCurrentBalance = new Prisma.Decimal(Number(oldAccount.current_balance) + diff);
    }

    const account = await this.prisma.accounts.update({
      where: { id },
      data: {
        name: data.name,
        account_type: data.account_type,
        currency: data.currency,
        initial_balance: data.initial_balance,
        current_balance: newCurrentBalance,
        min_threshold: data.min_threshold,
        account_number: data.account_number,
        description: data.description,
        is_active: data.is_active,
        updated_at: new Date(),
      },
    });

    await this.audit.log({
      userId,
      action: 'UPDATE_ACCOUNT',
      entityType: 'accounts',
      entityId: id,
      oldValues: oldAccount,
      newValues: account,
    });

    return account;
  }

  async remove(id: bigint, userId: bigint) {
    const account = await this.findOne(id);
    await this.prisma.accounts.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      userId,
      action: 'SOFT_DELETE_ACCOUNT',
      entityType: 'accounts',
      entityId: id,
      oldValues: account,
    });

    return { success: true };
  }

  async findCompatibleAccounts(productId: bigint, type: 'SOURCE' | 'DESTINATION') {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      include: {
        product_account_compatibility: true,
      },
    });

    if (!product || product.deleted_at) {
      throw new NotFoundException('Produit introuvable');
    }

    // Default policy: if no explicit compatibility defined, all accounts are compatible.
    if (product.product_account_compatibility.length === 0) {
      return this.findAll();
    }

    const compatibleAccountIds = product.product_account_compatibility
      .filter((c) => c.compatibility_type === 'BOTH' || c.compatibility_type === type)
      .map((c) => c.account_id);

    return this.prisma.accounts.findMany({
      where: {
        id: { in: compatibleAccountIds },
        deleted_at: null,
        is_active: true,
      },
    });
  }
}
