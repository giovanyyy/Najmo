import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getSetting(key: string, defaultValue: string | null = null): Promise<string | null> {
    const setting = await this.prisma.settings.findUnique({
      where: { key_name: key },
    });
    return setting?.value_data ?? defaultValue;
  }

  async setSetting(key: string, value: string, userId?: bigint): Promise<void> {
    const oldSetting = await this.prisma.settings.findUnique({
      where: { key_name: key },
    });

    const newSetting = await this.prisma.settings.upsert({
      where: { key_name: key },
      update: { value_data: value, updated_by_user_id: userId, updated_at: new Date() },
      create: { key_name: key, value_data: value, updated_by_user_id: userId },
    });

    if (userId) {
      await this.audit.log({
        userId,
        action: 'UPDATE_SETTING',
        entityType: 'settings',
        entityId: newSetting.id,
        oldValues: oldSetting ? { value: oldSetting.value_data } : null,
        newValues: { value },
      });
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const sequenceKey = `invoice_seq_${currentYear}`;
    
    // Default format: INV-2024-00001
    // Read the current sequence inside a transaction to prevent race conditions
    let seq = 1;
    
    await this.prisma.$transaction(async (tx) => {
      const setting = await tx.settings.findUnique({
        where: { key_name: sequenceKey }
      });
      
      if (setting) {
        seq = parseInt(setting.value_data || '0', 10) + 1;
        await tx.settings.update({
          where: { key_name: sequenceKey },
          data: { value_data: seq.toString() }
        });
      } else {
        await tx.settings.create({
          data: { key_name: sequenceKey, value_data: seq.toString() }
        });
      }
    });

    return `INV-${currentYear}-${seq.toString().padStart(5, '0')}`;
  }
}
