import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function finalSeed() {
  // On nettoie les anciennes règles
  await prisma.product_account_compatibility.deleteMany();
  
  const accounts = await prisma.accounts.findMany();
  const products = await prisma.products.findMany();

  const getByType = (type: string) => accounts.filter(a => a.account_type === type);
  const getByNames = (names: string[]) => accounts.filter(a => names.some(n => a.name.toLowerCase().includes(n.toLowerCase())));

  for (const p of products) {
    // 1. TikTok Coins
    if (p.category === 'TIKTOK_COINS') {
      const sources = [...getByType('CCP'), ...getByType('CASH')];
      const dests = getByNames(['Payoneer', 'Redotpay']);
      for (const a of sources) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'SOURCE' } });
      for (const a of dests) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'DESTINATION' } });
    }

    // 2. Achats Dollars Tiktok
    if (p.category === 'BUY_TIKTOK_USD') {
      const sources = [...getByType('PAYPAL'), ...getByType('PAYONEER')];
      const dests = [...getByType('CCP'), ...getByType('CASH')];
      for (const a of sources) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'SOURCE' } });
      for (const a of dests) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'DESTINATION' } });
    }

    // 3. Vente USDT (dollars redotpay)
    if (p.category === 'SELL_USDT') {
      const sources = getByType('REDOTPAY');
      const dests = [...getByType('CCP'), ...getByType('CASH')];
      for (const a of sources) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'DESTINATION' } }); // Sortie stock
      for (const a of dests) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'SOURCE' } }); // Entrée DZD
    }

    // 4. Ads Meta
    if (p.category === 'ADS_META') {
      const sources = accounts.filter(a => a.currency === 'EUR' || a.account_type === 'ADS');
      const dests = [...getByType('CCP'), ...getByType('CASH')];
      for (const a of sources) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'DESTINATION' } });
      for (const a of dests) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'SOURCE' } });
    }

    // 5. Service
    if (p.category === 'SERVICE') {
      const inAccs = [...getByType('CCP'), ...getByType('CASH')];
      for (const a of inAccs) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'SOURCE' } });
    }

    // 6. Achat USDT
    if (p.category === 'BUY_USDT') {
      const sources = getByType('REDOTPAY');
      const dests = [...getByType('CCP'), ...getByType('CASH')];
      for (const a of sources) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'SOURCE' } }); // Entrée stock
      for (const a of dests) await prisma.product_account_compatibility.create({ data: { product_id: p.id, account_id: a.id, compatibility_type: 'DESTINATION' } }); // Sortie DZD
    }
  }
  console.log('✅ Configuration métier ultra-précise appliquée !');
}

finalSeed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
