"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AdsPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendNotes, setSpendNotes] = useState("");
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [rechargeData, setRechargeData] = useState({
    source_account_id: "",
    amount: "",
    source_amount: "",
    exchange_rate: "245", // Taux par défaut pour l'EUR
    notes: ""
  });

  const fetchAccounts = async () => {
    if (status === "authenticated" && (session as any)?.accessToken) {
      setLoading(true);
      try {
        const adsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/accounts`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        if (adsRes.ok) setAccounts(await adsRes.json());

        const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        if (allRes.ok) setAllAccounts(await allRes.json());
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchAccounts();
    }
  }, [status, session]);

  const handleRecordSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !spendAmount) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/spending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          account_id: selectedAccount.id.toString(),
          amount: parseFloat(spendAmount),
          currency: selectedAccount.currency,
          description: spendNotes,
        }),
      });

      if (res.ok) {
        setIsSpendModalOpen(false);
        setSpendAmount("");
        setSpendNotes("");
        fetchAccounts();
      } else {
        alert("Erreur lors de l'enregistrement de la dépense");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRecordRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const sourceAcc = allAccounts.find(a => a.id === rechargeData.source_account_id);
    const finalSourceAmount = sourceAcc?.currency !== selectedAccount?.currency 
      ? (rechargeData.source_amount || (parseFloat(rechargeData.amount) * parseFloat(rechargeData.exchange_rate)).toString())
      : rechargeData.amount;

    if (!selectedAccount || !rechargeData.source_account_id || !rechargeData.amount) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/recharge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          ads_account_id: selectedAccount.id.toString(),
          source_account_id: rechargeData.source_account_id,
          amount: parseFloat(rechargeData.amount),
          source_amount: parseFloat(finalSourceAmount),
          currency: selectedAccount.currency,
          description: rechargeData.notes,
        }),
      });

      if (res.ok) {
        setIsRechargeModalOpen(false);
        setRechargeData({ source_account_id: "", amount: "", source_amount: "", exchange_rate: "245", notes: "" });
        fetchAccounts();
      } else {
        alert("Erreur lors de la recharge");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (status === "loading" || loading) {
    return <div className="w-full py-12 flex items-center justify-center text-[#8B9CBB]">Chargement des comptes Ads...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col mb-6 items-center text-center">
        <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
          Gestion Meta Ads
        </h1>
        <p className="text-slate-400 mt-1">Suivi des crédits, dépenses et alertes de solde.</p>
      </div>

      <div className="flex flex-wrap gap-6 justify-center w-full">
        {accounts.map((acc) => (
          <div key={acc.id} className={`w-full max-w-[400px] bg-slate-900 rounded-2xl border ${acc.alert ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-slate-800'} p-6 transition-all hover:border-slate-700`}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
                {acc.alert && (
                  <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-md animate-pulse">
                    Solde Bas
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{acc.name}</h3>
              <p className="text-xs text-slate-500 mb-6">{acc.account_number || 'Pas de numéro de compte'}</p>

              <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-slate-800/50">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Crédit Disponible</div>
                <div className={`text-2xl font-black ${Number(acc.current_balance) < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  {acc.currency === 'USD' || acc.currency === 'USDT' ? '$ ' : ''}
                  {Number(acc.current_balance).toLocaleString('fr-FR')}
                  {acc.currency === 'DZD' ? ' DZD' : ''}
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setSelectedAccount(acc); setIsSpendModalOpen(true); }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
                >
                  Saisir une dépense
                </button>
                <button 
                  onClick={() => { setSelectedAccount(acc); setIsRechargeModalOpen(true); }}
                  className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-sm font-semibold transition-all border border-blue-500/20"
                >
                  Recharger le crédit
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Derniers mouvements</h4>
                <div className="space-y-3">
                  {acc.account_movements?.map((mov: any) => (
                    <div key={mov.id} className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-slate-400">{new Date(mov.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{mov.description}</span>
                      </div>
                      <span className={`font-bold ${mov.movement_type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {mov.movement_type === 'IN' ? '+' : '-'}{Number(mov.amount).toLocaleString()} {acc.currency}
                      </span>
                    </div>
                  ))}
                  {(!acc.account_movements || acc.account_movements.length === 0) && (
                    <p className="text-[10px] text-slate-600 italic">Aucun mouvement récent</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      {/* Spend Modal */}
      {isSpendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Saisir un Prélèvement Meta</h2>
              <button onClick={() => setIsSpendModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2">✕</button>
            </div>
            <form onSubmit={handleRecordSpend} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Compte Ads</label>
                <div className="p-3 bg-slate-950 rounded-lg text-sm font-bold text-blue-400 border border-slate-800">
                  {selectedAccount?.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Montant prélevé ({selectedAccount?.currency})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  autoFocus
                  required 
                  placeholder="0.00" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none focus:border-blue-500 transition-all" 
                  value={spendAmount}
                  onChange={e => setSpendAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Note / Description</label>
                <input 
                  type="text" 
                  placeholder="Ex: Spend du 15 mai" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-all" 
                  value={spendNotes}
                  onChange={e => setSpendNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsSpendModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recharge Modal */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Recharger le Crédit Ads</h2>
              <button onClick={() => setIsRechargeModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2">✕</button>
            </div>
            <form onSubmit={handleRecordRecharge} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Compte Source (D'où vient l'argent ?)</label>
                <select 
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                  value={rechargeData.source_account_id}
                  onChange={e => setRechargeData({...rechargeData, source_account_id: e.target.value})}
                >
                  <option value="">Sélectionner un compte...</option>
                  {allAccounts.filter(a => a.account_type !== 'ADS').map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({Number(acc.current_balance).toLocaleString()} {acc.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Montant à ajouter sur Meta ({selectedAccount?.currency})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0.00" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none focus:border-blue-500 transition-all" 
                  value={rechargeData.amount}
                  onChange={e => setRechargeData({...rechargeData, amount: e.target.value})}
                />
              </div>

              {rechargeData.source_account_id && allAccounts.find(a => a.id === rechargeData.source_account_id)?.currency !== selectedAccount?.currency && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Calcul automatique de conversion
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Taux de change (1 {selectedAccount?.currency} = ?)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-amber-500 transition-all" 
                        value={rechargeData.exchange_rate}
                        onChange={e => {
                          const rate = e.target.value;
                          const newSourceAmount = (parseFloat(rechargeData.amount) * parseFloat(rate)).toString();
                          setRechargeData({...rechargeData, exchange_rate: rate, source_amount: isNaN(parseFloat(newSourceAmount)) ? "" : newSourceAmount});
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Total déduit ({allAccounts.find(a => a.id === rechargeData.source_account_id)?.currency})</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-amber-500 transition-all" 
                        value={rechargeData.source_amount}
                        onChange={e => {
                          const srcAmt = e.target.value;
                          const newRate = (parseFloat(srcAmt) / parseFloat(rechargeData.amount)).toString();
                          setRechargeData({...rechargeData, source_amount: srcAmt, exchange_rate: isNaN(parseFloat(newRate)) ? rechargeData.exchange_rate : newRate});
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Note</label>
                <input 
                  type="text" 
                  placeholder="Ex: Recharge mensuelle" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-all" 
                  value={rechargeData.notes}
                  onChange={e => setRechargeData({...rechargeData, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRechargeModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all">Recharger</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
