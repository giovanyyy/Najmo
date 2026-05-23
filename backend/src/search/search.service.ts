import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    if (!query || query.length < 2) {
      return { clients: [], invoices: [], operations: [] };
    }

    const searchStr = `%${query}%`;

    // 1. Search Clients
    const clients = await this.prisma.clients.findMany({
      where: {
        deleted_at: null,
        OR: [
          { full_name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } },
        ]
      },
      take: 10,
    });

    // 2. Search Invoices
    const invoices = await this.prisma.invoices.findMany({
      where: {
        deleted_at: null,
        OR: [
          { invoice_number: { contains: query } },
          { notes: { contains: query } }
        ]
      },
      include: { clients: { select: { full_name: true } } },
      take: 10,
    });

    // 3. Search Operations
    const operations = await this.prisma.operations.findMany({
      where: {
        deleted_at: null,
        notes: { contains: query }
      },
      include: {
        clients: { select: { full_name: true } },
        products: { select: { name: true } }
      },
      take: 10,
    });

    return {
      clients,
      invoices,
      operations,
    };
  }
}
