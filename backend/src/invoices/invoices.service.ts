import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../lib/audit';
import * as path from 'path';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private audit: AuditService,
  ) {}

  async createGrouped(data: { client_id: string, operation_ids: string[], currency?: string, notes?: string, payment_method?: string }, userId: bigint) {
    // 1. Generate Invoice Number via SettingsService (Atomic Sequence)
    const invoiceNumber = await this.settings.generateInvoiceNumber();

    // 2. Fetch all selected operations
    const operations = await this.prisma.operations.findMany({
      where: {
        id: { in: data.operation_ids.map(id => BigInt(id)) },
        client_id: BigInt(data.client_id),
        invoice_id: null,
        operation_type: 'SALE'
      },
      include: {
        products: true
      }
    });

    if (operations.length === 0) {
      throw new Error("Aucune opération valide à facturer pour ce client.");
    }

    const totalAmount = operations.reduce((sum, op) => sum + Number(op.amount_dzd || 0), 0);
    const paidAmount = operations.reduce((sum, op) => sum + (op.source_account_id ? Number(op.amount_dzd || 0) : 0), 0);
    const remainingAmount = totalAmount - paidAmount;

    let initialStatus = 'PAID';
    if (remainingAmount === totalAmount) initialStatus = 'UNPAID';
    else if (remainingAmount > 0) initialStatus = 'PARTIAL';

    // Calculate Due Date
    let minDelay = 30;
    let delayFound = false;
    operations.forEach(op => {
      const match = op.notes?.match(/\[DUE:(\d+)\]/);
      if (match) {
        const d = parseInt(match[1]);
        if (!delayFound || d < minDelay) {
          minDelay = d;
          delayFound = true;
        }
      }
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + minDelay);

    // 3. Create Invoice AND update operations in a transaction
    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoices.create({
        data: {
          invoice_number: invoiceNumber,
          client_id: BigInt(data.client_id),
          total_amount: totalAmount,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          currency: (data.currency || 'DZD') as any,
          status: initialStatus as any,
          payment_method: data.payment_method as any,
          due_date: dueDate,
          notes: data.notes
        }
      });

      // 3.1 Créer des invoice_items
      for (const op of operations) {
        await tx.invoice_items.create({
          data: {
            invoice_id: invoice.id,
            operation_id: op.id,
            description: `${op.products.name} - Op #${op.id}`,
            quantity: 1, // par défaut
            unit_price: Number(op.amount_dzd),
            total: Number(op.amount_dzd),
          }
        });

        // Historique de paiement initial
        if (op.source_account_id) {
          await tx.payments.create({
            data: {
              invoice_id: invoice.id,
              account_id: op.source_account_id,
              amount: Number(op.amount_dzd || 0),
              currency: (data.currency || 'DZD') as any,
              payment_method: 'CASH', 
              notes: `Paiement initial (Opération #${op.id})`,
              payment_date: op.operation_date,
              created_by_user_id: userId
            }
          });
        }
      }

      await tx.operations.updateMany({
        where: { id: { in: operations.map(op => op.id) } },
        data: { invoice_id: invoice.id, invoiced: true }
      });

      await this.audit.log({
        userId,
        action: 'CREATE_INVOICE',
        entityType: 'invoices',
        entityId: invoice.id,
        newValues: invoice,
      });

      return invoice;
    });
  }

  async findAll() {
    const invoices = await this.prisma.invoices.findMany({
      where: { deleted_at: null },
      include: {
        clients: true,
      },
      orderBy: { created_at: 'desc' }
    });

    const now = new Date();
    return invoices.map(inv => {
      if ((inv.status === 'UNPAID' || inv.status === 'PARTIAL') && inv.due_date && inv.due_date < now) {
        return { ...inv, status: 'OVERDUE' };
      }
      return inv;
    });
  }

  async findOne(id: bigint) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        clients: true,
        invoice_items: true,
        operations: {
          include: { products: true }
        },
        payments: {
          orderBy: { payment_date: 'desc' }
        }
      }
    });
    if (!invoice || invoice.deleted_at) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async updateStatus(id: bigint, status: string, paidAmount: number, userId: bigint) {
    const oldInvoice = await this.findOne(id);
    const total = Number(oldInvoice.total_amount);
    const remaining = Math.max(0, total - paidAmount);

    let newStatus = status as any;
    
    if (paidAmount >= total - 0.01) {
      newStatus = 'PAID';
    } else {
      if (newStatus === 'PAID') {
        newStatus = (paidAmount > 0) ? 'PARTIAL' : 'UNPAID';
      }
    }

    const updated = await this.prisma.invoices.update({
      where: { id },
      data: {
        status: newStatus,
        paid_amount: paidAmount,
        remaining_amount: remaining,
        updated_at: new Date()
      }
    });

    await this.audit.log({
      userId,
      action: 'UPDATE_INVOICE_STATUS',
      entityType: 'invoices',
      entityId: id,
      oldValues: { status: oldInvoice.status, paid_amount: oldInvoice.paid_amount },
      newValues: { status: newStatus, paid_amount: paidAmount },
    });

    return updated;
  }

  async remove(id: bigint, userId: bigint) {
    const oldInvoice = await this.findOne(id);
    await this.prisma.invoices.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    
    // Unlink operations
    await this.prisma.operations.updateMany({
      where: { invoice_id: id },
      data: { invoice_id: null, invoiced: false },
    });

    await this.audit.log({
      userId,
      action: 'SOFT_DELETE_INVOICE',
      entityType: 'invoices',
      entityId: id,
      oldValues: oldInvoice,
    });
    
    return { success: true };
  }

  async generatePdf(id: bigint): Promise<string> {
    const invoice = await this.findOne(id);
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #1a1a1a; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .box { padding: 15px; border: 1px solid #ddd; border-radius: 8px; width: 45%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .totals { width: 50%; float: right; }
            .totals div { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .totals .grand-total { font-weight: bold; font-size: 18px; border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FACTURE</div>
              <p>N°: <b>${invoice.invoice_number}</b></p>
              <p>Date: ${invoice.created_at.toLocaleDateString('fr-FR')}</p>
            </div>
            <div style="text-align: right;">
              <h2>NAJMO ERP</h2>
              <p>123 Avenue des affaires<br/>16000 Alger, Algérie</p>
            </div>
          </div>
          
          <div class="details">
            <div class="box">
              <h3>Facturé à :</h3>
              <p><b>${invoice.clients.full_name}</b></p>
              <p>${invoice.clients.address || 'Adresse non spécifiée'}</p>
              <p>${invoice.clients.email || ''}</p>
              <p>${invoice.clients.phone || ''}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>Prix Unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.invoice_items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${Number(item.quantity)}</td>
                  <td>${Number(item.unit_price).toFixed(2)} ${invoice.currency}</td>
                  <td>${Number(item.total).toFixed(2)} ${invoice.currency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div><span>Total :</span> <span>${Number(invoice.total_amount).toFixed(2)} ${invoice.currency}</span></div>
            <div><span>Montant Payé :</span> <span>${Number(invoice.paid_amount).toFixed(2)} ${invoice.currency}</span></div>
            <div class="grand-total"><span>Reste à Payer :</span> <span>${Number(invoice.remaining_amount).toFixed(2)} ${invoice.currency}</span></div>
          </div>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });
    
    const pdfDir = path.join(__dirname, '..', '..', '..', 'public', 'invoices');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `${invoice.invoice_number}-${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, filename);

    await page.pdf({ path: filePath, format: 'A4', printBackground: true });
    await browser.close();

    return `/invoices/${filename}`;
  }
}
