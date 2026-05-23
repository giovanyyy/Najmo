import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  }: {
    userId?: bigint | null;
    action: string;
    entityType: string;
    entityId?: bigint | null;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const oldStr = oldValues ? JSON.stringify(oldValues, (_, v) => typeof v === 'bigint' ? v.toString() : v) : null;
      const newStr = newValues ? JSON.stringify(newValues, (_, v) => typeof v === 'bigint' ? v.toString() : v) : null;

      await this.prisma.audit_logs.create({
        data: {
          user_id: userId || null,
          action,
          entity_type: entityType,
          entity_id: entityId || null,
          old_values: oldStr,
          new_values: newStr,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
