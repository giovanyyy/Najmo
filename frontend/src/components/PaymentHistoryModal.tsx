"use client";

import { useState, useEffect } from "react";

interface Payment {
  id: string;
  amount: string;
  currency: string;
  payment_method: string;
  payment_date: string;
  notes?: string;
  accounts?: { name: string };
  users?: { full_name: string };
}

export default function PaymentHistoryModal({ isOpen, onClose, invoice, accessToken }: { isOpen: boolean, onClose: () => void, invoice: any, accessToken: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/invoice/${invoice.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        setPayments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching payments:", err);
        setLoading(false);
      });
    }
  }, [isOpen, invoice, accessToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">Historique des Paiements</h2>
            <p className="text-xs text-slate-400 mt-1">Facture #{invoice?.invoice_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">✕</button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-10 text-center text-slate-500">Chargement de l'historique...</div>
          ) : payments.length === 0 ? (
            <div className="py-10 text-center text-slate-500 italic">Aucun paiement enregistré pour cette facture.</div>
          ) : (
            <div className="space-y-4">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{Number(p.amount).toLocaleString('fr-FR')} {p.currency}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded font-medium uppercase">{p.payment_method}</span>
                        <span className="text-[10px] text-slate-500 italic">via {p.accounts?.name || 'Inconnu'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-300">{new Date(p.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Enregistré par {p.users?.full_name || 'Admin'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-slate-500">Total encaissé : </span>
            <span className="font-bold text-emerald-400">{Number(invoice?.paid_amount).toLocaleString('fr-FR')} {invoice?.currency}</span>
          </div>
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">Fermer</button>
        </div>
      </div>
    </div>
  );
}
