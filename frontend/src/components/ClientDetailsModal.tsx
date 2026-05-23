"use client";

import { useState, useEffect } from "react";

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  accessToken: string;
}

export default function ClientDetailsModal({ isOpen, onClose, client, accessToken }: ClientDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && client) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) setDetails(await res.json());
        } catch (error) {
          console.error("Error fetching client details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, client, accessToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{client.full_name}</h2>
            <p className="text-slate-400 text-sm">Historique et Finances</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : details ? (
            <>
              {/* Financial Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Opérations</p>
                  <p className="text-2xl font-bold text-white">{details._count?.operations || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 relative">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Solde Actuel</p>
                  <p className={`text-2xl font-bold ${Number(details.total_profit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Number(details.total_profit).toLocaleString()} DZD
                  </p>
                  {Number(details.total_profit) < 0 && details.operations?.length > 0 && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-rose-500/10 border border-rose-500/50 text-rose-500 text-[10px] font-bold rounded animate-pulse">
                      RETARD : {Math.floor((new Date().getTime() - new Date(details.operations[0].operation_date).getTime()) / (1000 * 3600 * 24))} JOURS
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions History */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📜 Historique des Transactions</span>
                </h3>
                <div className="space-y-3">
                  {details.operations && details.operations.length > 0 ? (
                    details.operations.map((op: any) => (
                      <div key={op.id} className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              op.operation_type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500' : 
                              op.operation_type === 'PURCHASE' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {op.operation_type}
                            </span>
                            <span className="text-xs text-slate-500">
                              {op.operation_date ? new Date(op.operation_date).toLocaleDateString('fr-FR') : '-'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">{op.notes || "Pas de description"}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${op.operation_type === 'SALE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {op.operation_type === 'SALE' ? '+' : '-'}{Number(op.amount_dzd || 0).toLocaleString('fr-FR')} DZD
                          </p>
                          <p className="text-[10px] text-slate-600 uppercase font-bold">{op.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                      <p className="text-slate-500 italic">Aucune transaction enregistrée.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500">Impossible de charger les détails.</p>
          )}
        </div>
      </div>
    </div>
  );
}
