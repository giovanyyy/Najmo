import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(data: any, userId: bigint) {
    const product = await this.prisma.products.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        buy_price: data.buy_price || 0,
        sell_price: data.sell_price || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });

    if (data.compatibilities && Array.isArray(data.compatibilities)) {
      await this.prisma.product_account_compatibility.createMany({
        data: data.compatibilities.map((c: any) => ({
          product_id: product.id,
          account_id: BigInt(c.account_id),
          compatibility_type: c.compatibility_type,
        })),
      });
    }

    await this.audit.log({
      userId,
      action: 'CREATE_PRODUCT',
      entityType: 'products',
      entityId: product.id,
      newValues: product,
    });

    return product;
  }

  async findAll() {
    return this.prisma.products.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
      include: {
        product_account_compatibility: true,
      },
    });
  }

  async findOne(id: bigint) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: {
        product_account_compatibility: {
          include: { accounts: true },
        },
      },
    });

    if (!product || product.deleted_at) {
      throw new NotFoundException('Produit introuvable');
    }

    return product;
  }

  async update(id: bigint, data: any, userId: bigint) {
    const oldProduct = await this.findOne(id);

    const product = await this.prisma.products.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        buy_price: data.buy_price,
        sell_price: data.sell_price,
        is_active: data.is_active,
      },
    });

    if (data.compatibilities && Array.isArray(data.compatibilities)) {
      await this.prisma.product_account_compatibility.deleteMany({
        where: { product_id: id },
      });
      await this.prisma.product_account_compatibility.createMany({
        data: data.compatibilities.map((c: any) => ({
          product_id: product.id,
          account_id: BigInt(c.account_id),
          compatibility_type: c.compatibility_type,
        })),
      });
    }

    await this.audit.log({
      userId,
      action: 'UPDATE_PRODUCT',
      entityType: 'products',
      entityId: id,
      oldValues: oldProduct,
      newValues: product,
    });

    return product;
  }

  async remove(id: bigint, userId: bigint) {
    const product = await this.findOne(id);
    await this.prisma.products.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });

    await this.audit.log({
      userId,
      action: 'SOFT_DELETE_PRODUCT',
      entityType: 'products',
      entityId: id,
      oldValues: product,
    });

    return { success: true };
  }
}
