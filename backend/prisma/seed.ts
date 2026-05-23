import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Seeding starting...');

  // 1. Users
  const user = await prisma.users.upsert({
    where: { email: 'admin@najmo.dz' },
    update: {},
    create: {
      email: 'admin@najmo.dz',
      full_name: 'Younes Admin',
      role: 'ADMIN',
      is_active: true,
    },
  });

  // 2. Settings (Invoice Sequence)
  await prisma.settings.upsert({
    where: { key_name: 'INVOICE_SEQUENCE' },
    update: {},
    create: {
      key_name: 'INVOICE_SEQUENCE',
      value_data: '1000'
    }
  });

  // 3. Products
  const products = [
    { name: 'TikTok Coins', category: 'TIKTOK_COINS' },
    { name: 'USDT (Sell)', category: 'SELL_USDT' },
    { name: 'USDT (Buy)', category: 'BUY_USDT' },
    { name: 'Meta Ads Credits', category: 'ADS_META' },
    { name: 'Conseil / Service', category: 'SERVICE' },
  ];

  for (const p of products) {
    await prisma.products.upsert({
      where: { name: p.name },
      update: {},
      create: {
        name: p.name,
        category: p.category as any,
        is_active: true,
      },
    });
  }

  // 4. Accounts (Treasury)
  const accounts = [
    { name: 'Caisse Principale (DZD)', account_type: 'CASH', currency: 'DZD', balance: 1500000 },
    { name: 'CCP', account_type: 'CCP', currency: 'DZD', balance: 500000 },
    { name: 'BaridiMob', account_type: 'BANK', currency: 'DZD', balance: 250000 },
    { name: 'Binance Wallet (USDT)', account_type: 'PAYONEER', currency: 'USDT', balance: 5000 },
    { name: 'Paysera (EUR)', account_type: 'BANK', currency: 'EUR', balance: 1200 },
  ];

  for (const a of accounts) {
    await prisma.accounts.create({
      data: {
        name: a.name,
        account_type: a.account_type as any,
        currency: a.currency as any,
        current_balance: a.balance,
        is_active: true,
      }
    });
  }

  // 5. Meta Ads Accounts
  await prisma.meta_ads_accounts.create({
    data: {
      name: 'Business Manager A',
      platform: 'FACEBOOK',
      initial_credit: 150,
      currency: 'USD',
      due_date: new Date(),
      is_active: true
    }
  });

  // 6. Clients
  const clients = [
    { name: 'Sarl El Amel', phone: '0555123456', email: 'contact@elamel.dz', address: 'Alger' },
    { name: 'Karim E-commerce', phone: '0666987654', email: 'karim.shop@gmail.com', address: null },
    { name: 'Boutique Dalia', phone: '0777112233', email: 'dalia.mode@yahoo.fr', address: 'Oran' }
  ];

  for (const c of clients) {
    await prisma.clients.create({
      data: {
        full_name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        classification: 'A',
        total_operations: 0,
        total_profit: 0
      }
    });
  }

  console.log('✅ Seeding completed with realistic Algerian demo data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
