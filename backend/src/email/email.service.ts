import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER') || 'test@najmo.dz',
        pass: this.configService.get<string>('SMTP_PASS') || 'password',
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
    try {
      const info = await this.transporter.sendMail({
        from: `"NAJMO ERP" <${this.configService.get<string>('SMTP_USER') || 'test@najmo.dz'}>`,
        to,
        subject,
        html,
        attachments,
      });

      this.logger.log(`Email sent: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendInvoice(to: string, invoiceNumber: string, pdfBuffer: Buffer) {
    const subject = `Votre facture ${invoiceNumber} de la part de NAJMO`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Bonjour,</h2>
        <p>Veuillez trouver en pièce jointe votre facture <b>${invoiceNumber}</b>.</p>
        <p>Merci pour votre confiance.</p>
        <br/>
        <p>L'équipe NAJMO</p>
      </div>
    `;

    return this.sendEmail(to, subject, html, [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
      }
    ]);
  }
}
