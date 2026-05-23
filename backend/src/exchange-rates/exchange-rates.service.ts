import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateExchangeRateDto, keycloakUserId?: string) {
    let dbUserId: bigint | null = null;
    if (keycloakUserId) {
      const user = await this.prisma.users.findUnique({
        where: { keycloak_user_id: keycloakUserId },
      });
      if (user) {
        dbUserId = user.id;
      }
    }

    // Default fallback to first active admin/user if user doesn't exist
    if (!dbUserId) {
      const defaultUser = await this.prisma.users.findFirst({
        where: { is_active: true }
      });
      if (defaultUser) {
        dbUserId = defaultUser.id;
      }
    }

    return this.prisma.exchange_rates.create({
      data: {
        base_currency: data.base_currency as any,
        target_currency: data.target_currency as any,
        rate: new Prisma.Decimal(data.rate),
        created_by_user_id: dbUserId,
      },
    });
  }

  async getLatestRates() {
    const allRates = await this.prisma.exchange_rates.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
          }
        }
      }
    });

    const latestMap = new Map<string, any>();
    for (const rate of allRates) {
      const key = `${rate.base_currency}->${rate.target_currency}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, rate);
      }
    }

    return Array.from(latestMap.values());
  }

  async getHistory() {
    return this.prisma.exchange_rates.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
          }
        }
      }
    });
  }

  async convert(from: string, to: string, amount: number) {
    if (from === to) return { amount, rate: 1 };

    // 1. Check direct rate
    const directRate = await this.prisma.exchange_rates.findFirst({
      where: { base_currency: from as any, target_currency: to as any },
      orderBy: { created_at: 'desc' },
    });

    if (directRate) {
      const rateNum = Number(directRate.rate);
      return { amount: amount * rateNum, rate: rateNum };
    }

    // 2. Check inverse rate
    const inverseRate = await this.prisma.exchange_rates.findFirst({
      where: { base_currency: to as any, target_currency: from as any },
      orderBy: { created_at: 'desc' },
    });

    if (inverseRate) {
      const rateNum = 1 / Number(inverseRate.rate);
      return { amount: amount * rateNum, rate: rateNum };
    }

    // 3. Pivot currency (DZD)
    const rateToPivot = await this.prisma.exchange_rates.findFirst({
      where: { base_currency: from as any, target_currency: 'DZD' },
      orderBy: { created_at: 'desc' },
    });

    const rateFromPivot = await this.prisma.exchange_rates.findFirst({
      where: { base_currency: to as any, target_currency: 'DZD' },
      orderBy: { created_at: 'desc' },
    });

    if (rateToPivot && rateFromPivot) {
      const usdToDzd = Number(rateToPivot.rate);
      const eurToDzd = Number(rateFromPivot.rate);
      const pivotAmount = amount * usdToDzd;
      const finalAmount = pivotAmount / eurToDzd;
      const compositeRate = usdToDzd / eurToDzd;
      return { amount: finalAmount, rate: compositeRate };
    }

    return { amount, rate: 1, warning: 'Aucun taux de change disponible pour cette conversion.' };
  }
}
