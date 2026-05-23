"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import AddPaymentModal from "@/components/AddPaymentModal";
import PaymentHistoryModal from "@/components/PaymentHistoryModal";

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      const res = await fetch(`${apiBase}/invoices`, { headers });
      if (res.ok) setInvoices(await res.json());
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }, [session, status]);


  useEffect(() => {
    if (status !== "loading") {
      fetchInvoices();
    }
  }, [status, fetchInvoices]);

  const updateStatus = async (id: string, newStatus: string, paidAmount: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ status: newStatus, paid_amount: paidAmount })
      });
      if (res.ok) fetchInvoices();
    } catch (error) {
      console.error(error);
    }
  };

  const updatePaymentMethod = async (id: string, newMethod: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/payment-method`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ payment_method: newMethod })
      });
      if (res.ok) fetchInvoices();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'UNPAID': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'PARTIAL': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'OVERDUE': return 'bg-red-600/20 text-red-500 border-red-600/30 animate-pulse';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  if (status === "loading" || (loading && invoices.length === 0)) {
    return <div className="w-full py-12 flex items-center justify-center text-[#8B9CBB]">Chargement...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Gestion des Factures
            </h1>
          </div>
        </div>
      </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">N° Facture</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Client</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Total</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Payé</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Reste</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Méthode</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Statut</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.length > 0 ? (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-sm font-mono text-white font-bold">
                      {inv.invoice_number}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-200">
                      {inv.clients?.full_name || 'Inconnu'}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-sm text-right font-bold text-white">
                      {Number(inv.total_amount).toLocaleString('fr-FR')} {inv.currency}
                    </td>
                    <td className="p-4 text-sm text-right text-emerald-400">
                      {Number(inv.paid_amount).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-4 text-sm text-right text-rose-400 font-bold">
                      {Number(inv.remaining_amount).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-4 text-center">
                       <select 
                         value={inv.payment_method || ''}
                         onChange={(e) => updatePaymentMethod(inv.id.toString(), e.target.value)}
                         disabled={inv.status === 'PAID'}
                         className="px-2 py-1 text-[10px] font-bold uppercase rounded border outline-none cursor-pointer bg-slate-800 border-slate-700 text-slate-300"
                       >
                         <option value="">Aucune</option>
                         <option value="CASH">Espèces</option>
                         <option value="CCP">CCP / BaridiMob</option>
                         <option value="BANK_TRANSFER">Virement Bancaire</option>
                         <option value="PAYONEER">Payoneer</option>
                         <option value="PAYPAL">PayPal</option>
                         <option value="REDOTPAY">Redotpay</option>
                         <option value="CRYPTO">Crypto (USDT)</option>
                       </select>
                     </td>
                    <td className="p-4 text-center">
                      <select 
                        value={inv.status}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'PAID' || (val === 'PARTIAL' && Number(inv.paid_amount) === 0)) {
                            setSelectedInvoice(inv);
                            setIsPaymentModalOpen(true);
                          } else {
                            updateStatus(inv.id.toString(), val, Number(inv.paid_amount));
                          }
                        }}
                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded border outline-none cursor-pointer ${getStatusStyle(inv.status)}`}
                      >
                        <option value="DRAFT">Brouillon</option>
                        <option value="UNPAID">Non Payé</option>
                        <option value="PARTIAL">Partiel</option>
                        <option value="PAID">Payé</option>
                        <option value="OVERDUE">En Retard</option>
                      </select>
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      {inv.status !== 'DRAFT' && Number(inv.remaining_amount) > 0 && (
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                          className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-xs font-medium transition-colors"
                        >
                          Payer
                        </button>
                      )}
                      
                      {Number(inv.paid_amount) > 0 && (
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setIsHistoryModalOpen(true); }}
                          title="Voir l'historique des paiements"
                          className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Hist.
                        </button>
                      )}

                      <a 
                        href={`/invoices/${inv.id}/print`}
                        target="_blank"
                        className="px-3 py-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded text-xs font-medium transition-colors"
                      >
                        Imprimer PDF
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 italic">
                    Aucune facture générée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      <AddPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }} 
        invoice={selectedInvoice}
        accessToken={(session as any)?.accessToken}
        onSuccess={fetchInvoices}
      />

      <PaymentHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => { setIsHistoryModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        accessToken={(session as any)?.accessToken}
      />
    </div>
  );
}
