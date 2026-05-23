"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function InvoicePrintPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        setInvoice(data);
        setTimeout(() => window.print(), 800);
      });
    }
  }, [id, session, status]);

  if (!invoice) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Génération de la facture en cours...</div>;

  const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : "À réception";

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Espèces';
      case 'CCP': return 'CCP / BaridiMob';
      case 'BANK_TRANSFER': return 'Virement Bancaire';
      case 'PAYONEER': return 'Payoneer';
      case 'PAYPAL': return 'PayPal';
      case 'REDOTPAY': return 'Redotpay';
      case 'CRYPTO': return 'Crypto (USDT)';
      default: return method;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen py-10 print:py-0 print:bg-white font-sans text-slate-800 flex justify-center">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hidden { display: none !important; }
          /* Format A4 sans marges du navigateur */
          @page { size: A4 portrait; margin: 0; }
          .invoice-box { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 2cm !important; }
        }
        
        .font-inter { font-family: 'Inter', sans-serif; }
      `}} />

      {/* A4 Paper Container */}
      <div className="invoice-box font-inter bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-2xl relative overflow-hidden p-12 md:p-16">
        
        {/* Top Accent Bar */}
        <div className={`absolute top-0 left-0 w-full h-4 ${invoice.status === 'DRAFT' ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}></div>

        {invoice.status === 'DRAFT' && (
          <div className="absolute top-4 left-0 w-full bg-amber-500 text-white text-[10px] font-bold text-center py-0.5 uppercase tracking-widest">
            Document de Travail - Non Définitif
          </div>
        )}

        {/* HEADER */}
        <header className="flex justify-between items-start mt-4 mb-16">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">NAJMO<span className="text-blue-600">.</span></h1>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Solutions Financières</span>
          </div>
          
          <div className="text-right">
            <h2 className="text-4xl font-bold text-slate-200 tracking-widest uppercase">Facture</h2>
            <p className="text-sm font-semibold text-slate-500 mt-2">Référence</p>
            <p className="text-lg font-mono font-bold text-slate-900">{invoice.invoice_number}</p>
          </div>
        </header>

        {/* ADDRESSES & DATES GRID */}
        <div className="grid grid-cols-2 gap-12 mb-16">
          {/* From */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Émetteur</p>
            <h3 className="text-base font-bold text-slate-800 mb-1">NAJMO ERP</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              123 Avenue de l'Entreprise<br/>
              16000 Alger, Algérie<br/>
              +213 555 12 34 56<br/>
              contact@najmo-erp.com
            </p>
          </div>

          {/* To */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Facturé à</p>
            <h3 className="text-lg font-bold text-blue-900 mb-1">{invoice.clients?.full_name}</h3>
            {invoice.clients?.address && <p className="text-sm text-slate-600 mb-1">{invoice.clients.address}</p>}
            {invoice.clients?.email && <p className="text-sm text-slate-600">{invoice.clients.email}</p>}
            {invoice.clients?.phone && <p className="text-sm text-slate-600">{invoice.clients.phone}</p>}
          </div>
        </div>

        {/* INVOICE META */}
        <div className="flex gap-12 mb-12 border-y border-slate-100 py-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Date de facturation</p>
            <p className="text-sm font-bold text-slate-800">{invoiceDate}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Date d'échéance</p>
            <p className="text-sm font-bold text-slate-800">{dueDate}</p>
          </div>
          {invoice.payment_method && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Mode de Règlement</p>
              <p className="text-sm font-bold text-blue-600">{getPaymentMethodLabel(invoice.payment_method)}</p>
            </div>
          )}
        </div>

        {/* STATUS WATERMARK */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          {invoice.status === 'PAID' && <div className="text-[150px] font-black transform -rotate-12 text-emerald-500">PAYÉ</div>}
          {invoice.status === 'OVERDUE' && <div className="text-[120px] font-black transform -rotate-12 text-rose-500">RETARD</div>}
          {invoice.status === 'DRAFT' && <div className="text-[120px] font-black transform -rotate-12 text-slate-500">BROUILLON</div>}
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-l-lg border-b border-slate-200">Description du service / produit</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-200">Qté</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right border-b border-slate-200">Devise</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right rounded-r-lg border-b border-slate-200">Montant</th>
              </tr>
            </thead>
            <tbody>
              {invoice.operations && invoice.operations.length > 0 ? (
                invoice.operations.map((op: any, index: number) => (
                  <tr key={op.id || index} className="border-b border-slate-100">
                    <td className="py-6 px-4">
                      <p className="font-bold text-slate-800 text-base">{op.products?.name || 'Prestation de services'}</p>
                      {op.notes && <p className="text-sm text-slate-500 mt-1">{op.notes}</p>}
                    </td>
                    <td className="py-6 px-4 text-center font-medium text-slate-600">1</td>
                    <td className="py-6 px-4 text-right font-medium text-slate-600">{invoice.currency}</td>
                    <td className="py-6 px-4 text-right font-bold text-slate-900">{Number(op.amount_dzd || 0).toLocaleString('fr-FR')}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-100">
                  <td colSpan={4} className="py-6 px-4 text-center text-slate-500 italic">Aucun détail disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS SECTION */}
        <div className="flex justify-end mb-24">
          <div className="w-1/2">
            <div className="flex justify-between py-2 text-sm text-slate-600">
              <span>Sous-total HT</span>
              <span className="font-medium">{Number(invoice.total_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-200 mb-2">
              <span>TVA (0%)</span>
              <span className="font-medium">0.00 {invoice.currency}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-black text-slate-900 mb-2">
              <span>TOTAL TTC</span>
              <span className="text-blue-600">{Number(invoice.total_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
            </div>
            
            {Number(invoice.paid_amount) > 0 && (
              <div className="flex justify-between py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 mb-2">
                <span className="font-semibold">Montant Payé</span>
                <span className="font-bold">-{Number(invoice.paid_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
              </div>
            )}
            
            {Number(invoice.remaining_amount) > 0 && (
              <div className="flex justify-between py-3 text-base font-bold text-rose-600 bg-rose-50 rounded-lg px-3 border border-rose-100">
                <span>Reste à Payer</span>
                <span>{Number(invoice.remaining_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-12 left-12 right-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm font-bold text-slate-800 mb-1">Merci de votre confiance !</p>
          <p className="text-xs text-slate-400">
            Les paiements doivent être effectués dans les 30 jours suivant la date de facturation.<br/>
            Tout retard de paiement pourra entraîner des pénalités de retard.
          </p>
        </div>

        {/* ACTION BUTTONS (Hidden in Print) */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 print-hidden z-50">
          <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-2xl transition-all hover:scale-105 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
            Imprimer la Facture
          </button>
          <a href="/invoices" className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-full shadow-xl transition-all">
            Retour
          </a>
        </div>
      </div>
    </div>
  );
}
