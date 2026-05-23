import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.products.findMany({
      orderBy: { name: 'asc' },
      include: {
        product_account_compatibility: {
          include: {
            accounts: true,
          },
        },
      },
    });
  }

  async findActive() {
    return this.prisma.products.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCompatibility(productId: string) {
    const compatibilities = await this.prisma.product_account_compatibility.findMany({
      where: { product_id: BigInt(productId) },
      include: {
        accounts: true,
      },
    });

    return {
      sources: compatibilities
        .filter(c => c.compatibility_type === 'SOURCE' || c.compatibility_type === 'BOTH')
        .map(c => c.accounts),
      destinations: compatibilities
        .filter(c => c.compatibility_type === 'DESTINATION' || c.compatibility_type === 'BOTH')
        .map(c => c.accounts),
    };
  }

  async toggleStatus(id: string, status: boolean) {
    return this.prisma.products.update({
      where: { id: BigInt(id) },
      data: { is_active: status },
    });
  }

  async create(data: any) {
    return this.prisma.products.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        is_active: true,
      },
    });
  }

  async update(id: string, data: any) {
    const { name, category, description, is_active, compatibility } = data;
    
    return await this.prisma.$transaction(async (tx) => {
      // 1. Update product info
      const product = await tx.products.update({
        where: { id: BigInt(id) },
        data: { name, category, description, is_active },
      });

      // 2. Update compatibility if provided
      if (compatibility) {
        await tx.product_account_compatibility.deleteMany({
          where: { product_id: BigInt(id) },
        });

        for (const c of compatibility) {
          await tx.product_account_compatibility.create({
            data: {
              product_id: BigInt(id),
              account_id: BigInt(c.account_id),
              compatibility_type: c.compatibility_type,
            },
          });
        }
      }

      return product;
    });
  }
}
