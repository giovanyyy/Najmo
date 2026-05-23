"use client";

import { useState, useEffect } from "react";

export default function MovementHistoryModal({ isOpen, onClose, account, accessToken }: { isOpen: boolean, onClose: () => void, account: any, accessToken: string }) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && account) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/${account.id}/movements`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        setMovements(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching movements:", err);
        setLoading(false);
      });
    }
  }, [isOpen, account]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📊 Historique : <span className="text-blue-400">{account?.name}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{account?.currency} - {account?.account_type}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              Chargement des transactions...
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <div className="text-4xl">🏜️</div>
              Aucun mouvement enregistré pour ce compte.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800">
                  <th className="pb-4 font-semibold">Date</th>
                  <th className="pb-4 font-semibold">Type</th>
                  <th className="pb-4 font-semibold">Opération</th>
                  <th className="pb-4 font-semibold text-right">Montant</th>
                  <th className="pb-4 font-semibold text-right">Solde Après</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {movements.map((m) => (
                  <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 text-xs text-slate-400">
                      {new Date(m.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${m.movement_type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {m.movement_type === 'IN' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="text-sm font-medium text-slate-200">
                        {m.operations?.products?.name || 'Inconnu'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {m.operations?.clients?.name ? `Client: ${m.operations.clients.name}` : 'Passant'}
                      </div>
                    </td>
                    <td className={`py-4 text-sm font-bold text-right ${m.movement_type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.movement_type === 'IN' ? '+' : '-'}{Number(m.amount).toLocaleString()}
                    </td>
                    <td className="py-4 text-sm font-mono text-white text-right">
                      {Number(m.balance_after).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 bg-slate-800/30 border-t border-slate-800 flex justify-between items-center">
          <div className="text-[10px] text-slate-500">Affichage des 50 dernières transactions</div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase">Solde Initial</span>
                <span className="text-sm text-slate-300 font-bold">{Number(account?.initial_balance).toLocaleString()} {account?.currency}</span>
             </div>
             <div className="flex flex-col items-end border-l border-slate-700 pl-4">
                <span className="text-[10px] text-slate-500 uppercase">Solde Actuel</span>
                <span className="text-sm text-white font-black">{Number(account?.current_balance).toLocaleString()} {account?.currency}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
