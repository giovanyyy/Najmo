"use client";
 
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
 
export default function InvoicePrintPage() {
  const { id } = useParams();
  const router = useRouter();
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
        setTimeout(() => window.print(), 1000);
      });
    }
  }, [id, session, status]);
 
  if (!invoice) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080C14] text-slate-400 font-sans gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
      <p className="text-xs font-bold tracking-widest uppercase">Génération de la facture en cours...</p>
    </div>
  );
 
  const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "À réception";
 
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
    <div className="bg-slate-100 min-h-screen py-12 print:py-0 print:bg-white font-sans text-slate-800 flex flex-col items-center">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .invoice-box {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 21cm;
          min-height: 29.7cm;
          box-sizing: border-box;
        }
 
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
 
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hidden { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
          .invoice-box { 
            box-shadow: none !important; 
            border: none !important; 
            width: 100% !important; 
            max-width: 100% !important; 
            margin: 0 !important; 
            padding: 2cm !important; 
          }
        }
      `}} />
 
      {/* A4 Paper Container */}
      <div className="invoice-box bg-white shadow-2xl relative overflow-hidden p-16 flex flex-col justify-between">
        
        {/* Dynamic State Accent Ribbon */}
        <div className={`absolute top-0 left-0 w-full h-2.5 ${
          invoice.status === 'PAID' ? 'bg-emerald-500' :
          invoice.status === 'PARTIAL' ? 'bg-amber-500' :
          invoice.status === 'OVERDUE' ? 'bg-rose-500' :
          'bg-slate-400'
        }`}></div>
 
        <div>
          {/* TOP PANEL: Logo & Invoice details */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  NAJMO
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Software & FinTech
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Adresse: Hydra, Alger, Algérie</p>
              <p className="text-xs text-slate-400 font-medium">NIF: 001516089012356</p>
            </div>
 
            <div className="text-right">
              <span className={`inline-block text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full mb-3 border ${
                invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                invoice.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                invoice.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {invoice.status === 'PAID' ? '✓ Facture Payée' :
                 invoice.status === 'PARTIAL' ? '⚡ Paiement Partiel' :
                 invoice.status === 'OVERDUE' ? '⚠️ En Retard' :
                 'Brouillon'}
              </span>
              <h1 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">FACTURE DE REFERENCE</h1>
              <p className="text-lg mono font-bold text-slate-900">{invoice.invoice_number}</p>
            </div>
          </div>
 
          <hr className="border-slate-100 mb-10" />
 
          {/* SENDER & CLIENT INFORMATION */}
          <div className="grid grid-cols-2 gap-16 mb-12">
            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Émetteur</h4>
              <h3 className="text-sm font-bold text-slate-950">NAJMO SOFTWARE</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Lotissement Hydra, Bureau 42A<br />
                Alger, Algérie<br />
                +213 550 12 34 56<br />
                billing@najmo.dz
              </p>
            </div>
 
            <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/80">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Facturé à</h4>
              <h3 className="text-sm font-extrabold text-slate-950 mb-2">{invoice.clients?.full_name}</h3>
              <div className="space-y-1 text-xs text-slate-500">
                {invoice.clients?.address && <p>{invoice.clients.address}</p>}
                {invoice.clients?.email && <p>✉ {invoice.clients.email}</p>}
                {invoice.clients?.phone && <p className="mono">☏ {invoice.clients.phone}</p>}
              </div>
            </div>
          </div>
 
          {/* DATES & PAYMENT DETAILS */}
          <div className="grid grid-cols-3 gap-6 bg-slate-50 rounded-xl p-5 mb-10 border border-slate-100 text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Date d'Émission</span>
              <span className="font-bold text-slate-800">{invoiceDate}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Échéance de Règlement</span>
              <span className="font-bold text-slate-800">{dueDate}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Méthode Associée</span>
              <span className="font-bold text-slate-800">{invoice.payment_method ? getPaymentMethodLabel(invoice.payment_method) : 'Aucune'}</span>
            </div>
          </div>
 
          {/* DETAILS TABLE */}
          <div className="mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                  <th className="pb-3 pl-3">Désignation du Service / Produit</th>
                  <th className="pb-3 text-center w-16">Qté</th>
                  <th className="pb-3 text-right w-24">Prix Unit.</th>
                  <th className="pb-3 text-right w-28 pr-3">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoice.operations && invoice.operations.length > 0 ? (
                  invoice.operations.map((op: any, index: number) => (
                    <tr key={op.id || index} className="text-slate-700">
                      <td className="py-5 pl-3">
                        <p className="font-bold text-slate-900">{op.products?.name || 'Prestation de Services B2B'}</p>
                        {op.notes && <p className="text-[11px] text-slate-400 mt-1">{op.notes}</p>}
                      </td>
                      <td className="py-5 text-center font-medium text-slate-500">1</td>
                      <td className="py-5 text-right font-medium text-slate-600 mono">{Number(op.amount_dzd || 0).toLocaleString('fr-FR')}</td>
                      <td className="py-5 text-right font-bold text-slate-900 pr-3 mono">{Number(op.amount_dzd || 0).toLocaleString('fr-FR')} {invoice.currency}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">Aucun détail disponible pour cette facture</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
 
          {/* TOTALS WRAPPER */}
          <div className="flex justify-end mb-16">
            <div className="w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Sous-total Brut</span>
                <span className="mono">{Number(invoice.total_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
              </div>
              <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-150">
                <span>TVA (0.00%)</span>
                <span className="mono">0.00 {invoice.currency}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                <span>TOTAL NET À PAYER</span>
                <span className="text-blue-600 mono">{Number(invoice.total_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
              </div>
 
              {Number(invoice.paid_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 font-bold">
                  <span>Montant Déjà Réglé</span>
                  <span className="mono">-{Number(invoice.paid_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
                </div>
              )}
 
              {Number(invoice.remaining_amount) > 0 && (
                <div className="flex justify-between text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5 font-black text-sm">
                  <span>RESTE À PERCEVOIR</span>
                  <span className="mono">{Number(invoice.remaining_amount).toLocaleString('fr-FR')} {invoice.currency}</span>
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* BOTTOM METADATA FOOTER */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-800 mb-1">Merci de votre confiance !</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            NAJMO Solutions Financières - Hydra, Alger<br />
            Ce document fait foi de justificatif comptable pour les prestations indiquées ci-dessus.
          </p>
        </div>
 
        {/* FLOATING ACTION TOOLBAR (Print Hidden) */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 print-hidden z-50 bg-slate-950/80 backdrop-blur-md p-3 rounded-full border border-slate-800 shadow-2xl">
          <button 
            onClick={() => window.print()} 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-full transition-all hover:scale-105 flex items-center gap-2"
          >
            🖨️ Imprimer Facture
          </button>
          <button 
            onClick={() => router.back()} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
          >
            Retour
          </button>
        </div>
 
      </div>
    </div>
  );
}
