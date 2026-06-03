import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../lib/audit';
import { payments_currency, payments_payment_method } from '../prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(data: {
    invoice_id: string | number;
    account_id: string | number;
    amount: string | number;
    currency: payments_currency;
    payment_method: payments_payment_method;
    reference_number?: string;
    notes?: string;
    payment_date?: string | Date;
  }, userId: bigint) {
    const amount = parseFloat(data.amount.toString());
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException("Le montant doit être supérieur à 0");
    }

    // 1. Vérifier la facture et le reste à payer
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: BigInt(data.invoice_id) }
    });

    if (!invoice) throw new BadRequestException("Facture introuvable");

    const remaining = parseFloat(invoice.remaining_amount?.toString() || '0');
    if (amount > remaining + 0.01) {
      throw new BadRequestException(`Le montant dépasse le reste à payer (${remaining})`);
    }

    // 2. Vérifier le compte
    const account = await this.prisma.accounts.findUnique({
      where: { id: BigInt(data.account_id) }
    });
    if (!account) throw new BadRequestException("Compte introuvable");

    return await this.prisma.$transaction(async (tx) => {
      // 3. Créer une opération de type PAYMENT
      const firstOp = await tx.operations.findFirst({
        where: { invoice_id: BigInt(data.invoice_id) }
      });

      const operation = await tx.operations.create({
        data: {
          operation_type: 'PAYMENT',
          product_id: firstOp?.product_id || BigInt(1),
          client_id: invoice.client_id,
          source_account_id: BigInt(data.account_id),
          amount_dzd: invoice.currency === 'DZD' ? amount : 0,
          foreign_amount: invoice.currency !== 'DZD' ? amount : 0,
          foreign_currency: invoice.currency !== 'DZD' ? invoice.currency as any : null,
          status: 'COMPLETED',
          notes: data.notes || `Paiement facture ${invoice.invoice_number}`,
          operation_date: data.payment_date ? new Date(data.payment_date) : new Date(),
          created_by_user_id: userId,
          invoice_id: BigInt(data.invoice_id)
        }
      });

      // 4. Créer le paiement
      const payment = await tx.payments.create({
        data: {
          invoice_id: BigInt(data.invoice_id),
          account_id: BigInt(data.account_id),
          amount: amount,
          currency: data.currency,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          notes: data.notes,
          payment_date: data.payment_date ? new Date(data.payment_date) : new Date(),
          created_by_user_id: userId
        }
      });

      // 5. Ajouter le mouvement de compte
      const currentBalance = parseFloat(account.current_balance?.toString() || '0');
      const newBalance = currentBalance + amount;

      await tx.account_movements.create({
        data: {
          account_id: BigInt(data.account_id),
          operation_id: operation.id,
          movement_type: 'IN',
          amount: amount,
          currency: account.currency as any,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Paiement pour la facture #${invoice.invoice_number}`
        }
      });

      // 6. Mettre à jour le solde du compte
      await tx.accounts.update({
        where: { id: BigInt(data.account_id) },
        data: { current_balance: newBalance }
      });

      // 7. Mettre à jour la facture
      const currentPaid = parseFloat(invoice.paid_amount?.toString() || '0');
      const newPaid = currentPaid + amount;
      const newRemaining = Math.max(0, remaining - amount);
      
      let newStatus = invoice.status;
      if (newRemaining <= 0.01) {
        newStatus = 'PAID';
      } else {
        newStatus = 'PARTIAL';
      }

      await tx.invoices.update({
        where: { id: BigInt(data.invoice_id) },
        data: {
          paid_amount: newPaid,
          remaining_amount: newRemaining,
          status: newStatus as any
        }
      });

      await this.audit.log({
        userId,
        action: 'CREATE_PAYMENT',
        entityType: 'payments',
        entityId: payment.id,
        newValues: payment,
      });

      return payment;
    });
  }

  async findByInvoice(invoiceId: bigint) {
    return this.prisma.payments.findMany({
      where: { invoice_id: invoiceId },
      include: {
        accounts: true,
        users: {
          select: { full_name: true }
        }
      },
      orderBy: { payment_date: 'desc' }
    });
  }
}
