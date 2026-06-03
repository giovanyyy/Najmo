import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';
import { Prisma } from '../prisma/client';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(data: any, userId: bigint) {
    try {
      const client = await this.prisma.clients.create({
        data: {
          full_name: String(data.full_name),
          phone: data.phone ? String(data.phone) : null,
          email: data.email ? String(data.email) : null,
          address: data.address ? String(data.address) : null,
          client_type: data.client_type || 'NORMAL',
          classification: data.classification || 'NORMAL',
          credit_limit: data.credit_limit || 0,
          email_opt_in: data.email_opt_in !== undefined ? data.email_opt_in : true,
          notes: data.notes ? String(data.notes) : null,
        },
      });

      await this.audit.log({
        userId,
        action: 'CREATE_CLIENT',
        entityType: 'clients',
        entityId: client.id,
        newValues: client,
      });

      return client;
    } catch (e) {
      console.error('PRISMA ERROR:', e);
      throw e;
    }
  }

  async findAll() {
    return this.prisma.clients.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { operations: true, invoices: true },
        },
      },
    });
  }

  async findOne(id: bigint) {
    const client = await this.prisma.clients.findUnique({
      where: { id },
      include: {
        operations: {
          orderBy: { created_at: 'desc' },
          take: 50,
        },
        invoices: {
          orderBy: { created_at: 'desc' },
          take: 50,
        },
        _count: {
          select: { operations: true, invoices: true },
        },
      },
    });

    if (!client || client.deleted_at) {
      throw new NotFoundException('Client introuvable');
    }

    return client;
  }

  async update(id: bigint, data: any, userId: bigint) {
    const oldClient = await this.findOne(id);

    const client = await this.prisma.clients.update({
      where: { id },
      data: {
        full_name: data.full_name !== undefined ? String(data.full_name) : undefined,
        phone: data.phone !== undefined ? String(data.phone) : undefined,
        email: data.email !== undefined ? String(data.email) : undefined,
        address: data.address !== undefined ? String(data.address) : undefined,
        client_type: data.client_type,
        classification: data.classification,
        credit_limit: data.credit_limit,
        email_opt_in: data.email_opt_in,
        notes: data.notes !== undefined ? String(data.notes) : undefined,
        updated_at: new Date(),
      },
    });

    await this.audit.log({
      userId,
      action: 'UPDATE_CLIENT',
      entityType: 'clients',
      entityId: id,
      oldValues: oldClient,
      newValues: client,
    });

    return client;
  }

  async remove(id: bigint, userId: bigint) {
    const oldClient = await this.findOne(id);
    await this.prisma.clients.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      userId,
      action: 'SOFT_DELETE_CLIENT',
      entityType: 'clients',
      entityId: id,
      oldValues: oldClient,
    });

    return { success: true };
  }
}
