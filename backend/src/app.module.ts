import { Module } from '@nestjs/common';
import * as passport from 'passport';
import * as passportJwt from './passport-jwt/lib';
// Prevent dead code elimination
const forceInclude = { passport, passportJwt };
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientsModule } from './clients/clients.module';
import { OperationsModule } from './operations/operations.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdsModule } from './ads/ads.module';
import { UsersModule } from './users/users.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InternalTransfersModule } from './internal-transfers/internal-transfers.module';
import { TreasuryModule } from './treasury/treasury.module';
import { SettingsModule } from './settings/settings.module';
import { AccountsModule } from './accounts/accounts.module';
import { ProductsModule } from './products/products.module';
import { AlertsModule } from './alerts/alerts.module';
import { SearchModule } from './search/search.module';
import { ExportsModule } from './exports/exports.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DashboardModule,
    ClientsModule,
    OperationsModule,
    InvoicesModule,
    PaymentsModule,
    AdsModule,
    UsersModule,
    ExchangeRatesModule,
    ExpensesModule,
    InternalTransfersModule,
    TreasuryModule,
    SettingsModule,
    AccountsModule,
    ProductsModule,
    AlertsModule,
    SearchModule,
    ExportsModule,
    EmailModule,
  ],
  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
