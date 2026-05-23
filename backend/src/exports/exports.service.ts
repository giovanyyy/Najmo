import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportTableToExcel(tableName: string, filters: any): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tableName);

    let data: any[] = [];
    let columns: any[] = [];

    switch (tableName) {
      case 'clients':
        data = await this.prisma.clients.findMany({ where: { deleted_at: null } });
        columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Nom Complet', key: 'full_name', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Téléphone', key: 'phone', width: 20 },
          { header: 'Classification', key: 'classification', width: 15 },
          { header: 'Total Achats', key: 'total_operations', width: 15 },
        ];
        break;
      
      case 'invoices':
        data = await this.prisma.invoices.findMany({
          where: { deleted_at: null },
          include: { clients: { select: { full_name: true } } }
        });
        columns = [
          { header: 'N° Facture', key: 'invoice_number', width: 20 },
          { header: 'Client', key: 'client', width: 30 },
          { header: 'Statut', key: 'status', width: 15 },
          { header: 'Total', key: 'total_amount', width: 15 },
          { header: 'Payé', key: 'paid_amount', width: 15 },
          { header: 'Reste', key: 'remaining_amount', width: 15 },
          { header: 'Date Échéance', key: 'due_date', width: 20 },
        ];
        // Flatten nested relations
        data = data.map(d => ({
          ...d,
          client: d.clients?.full_name,
          total_amount: Number(d.total_amount),
          paid_amount: Number(d.paid_amount),
          remaining_amount: Number(d.remaining_amount),
          due_date: d.due_date ? new Date(d.due_date).toLocaleDateString() : ''
        }));
        break;

      case 'operations':
        data = await this.prisma.operations.findMany({
          where: { deleted_at: null },
          include: {
            clients: { select: { full_name: true } },
            products: { select: { name: true } },
          }
        });
        columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Type', key: 'operation_type', width: 15 },
          { header: 'Client', key: 'client', width: 30 },
          { header: 'Produit', key: 'product', width: 20 },
          { header: 'Montant DZD', key: 'amount_dzd', width: 15 },
          { header: 'Montant Devise', key: 'foreign_amount', width: 15 },
          { header: 'Statut', key: 'status', width: 15 },
          { header: 'Date', key: 'operation_date', width: 20 },
        ];
        data = data.map(d => ({
          ...d,
          client: d.clients?.full_name,
          product: d.products?.name,
          amount_dzd: Number(d.amount_dzd),
          foreign_amount: Number(d.foreign_amount),
          operation_date: d.operation_date ? new Date(d.operation_date).toLocaleDateString() : ''
        }));
        break;
        
      default:
        throw new BadRequestException(`Export for table ${tableName} is not supported.`);
    }

    worksheet.columns = columns;

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    data.forEach(row => {
      // Clean up BigInts for ExcelJS
      const cleanRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        cleanRow[key] = typeof value === 'bigint' ? value.toString() : value;
      }
      worksheet.addRow(cleanRow);
    });

    const exportDir = path.join(__dirname, '..', '..', '..', 'public', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `${tableName}-export-${Date.now()}.xlsx`;
    const filePath = path.join(exportDir, filename);

    await workbook.xlsx.writeFile(filePath);

    return `/exports/${filename}`;
  }
}
