"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Account {
  id: string;
  name: string;
  currency: string;
  current_balance: string;
}

interface Transfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  source_amount: string;
  destination_amount: string;
  exchange_rate: string | null;
  notes: string | null;
  transfer_date: string;
  accounts_internal_transfers_source_account_idToaccounts?: {
    name: string;
    currency: string;
  };
  accounts_internal_transfers_destination_account_idToaccounts?: {
    name: string;
    currency: string;
  };
  users?: {
    full_name: string;
  };
}

export default function TransfersPage() {
  const { data: session } = useSession();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [sourceAmount, setSourceAmount] = useState("");
  const [destinationAmount, setDestinationAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [notes, setNotes] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);

  // Helper variables for currencies
  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const destAccount = accounts.find((a) => a.id === destinationAccountId);
  const isSameCurrency = sourceAccount && destAccount && sourceAccount.currency === destAccount.currency;

  const fetchInitialData = async () => {
    try {
      // 1. Fetch Accounts
      const accountsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
        if (accountsData.length > 1) {
          setSourceAccountId(accountsData[0].id);
          setDestinationAccountId(accountsData[1].id);
        }
      }

      // 2. Fetch Transfers
      const transfersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/internal-transfers`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setTransfers(transfersData);
      }
    } catch (error) {
      console.error("Failed to load transfers data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoConvert = async () => {
    if (!sourceAccount || !destAccount || !sourceAmount || isNaN(Number(sourceAmount))) {
      alert("Veuillez renseigner un montant source valide pour effectuer la conversion.");
      return;
    }

    setConverting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exchange-rates/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          from: sourceAccount.currency,
          to: destAccount.currency,
          amount: Number(sourceAmount),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDestinationAmount(data.amount.toFixed(2));
        setExchangeRate(data.rate.toFixed(6));
      } else {
        alert("Impossible d'auto-convertir. Aucun taux n'est enregistré pour cette paire de devises.");
      }
    } catch (error) {
      console.error("Auto conversion error:", error);
      alert("Une erreur de communication est survenue lors de la conversion.");
    } finally {
      setConverting(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !destinationAccountId) {
      alert("Veuillez sélectionner le compte source et de destination.");
      return;
    }
    if (sourceAccountId === destinationAccountId) {
      alert("Le compte source et le compte cible doivent être différents.");
      return;
    }
    if (!sourceAmount || isNaN(Number(sourceAmount)) || Number(sourceAmount) <= 0) {
      alert("Veuillez entrer un montant source valide.");
      return;
    }
    if (!destinationAmount || isNaN(Number(destinationAmount)) || Number(destinationAmount) <= 0) {
      alert("Veuillez entrer un montant cible valide.");
      return;
    }
    if (!transferDate) {
      alert("Veuillez sélectionner la date du virement.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/internal-transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          source_account_id: sourceAccountId,
          destination_account_id: destinationAccountId,
          source_amount: Number(sourceAmount),
          destination_amount: Number(destinationAmount),
          exchange_rate: exchangeRate ? Number(exchangeRate) : undefined,
          notes: notes || undefined,
          transfer_date: new Date(transferDate).toISOString(),
        }),
      });

      if (res.ok) {
        alert("✅ Virement interne enregistré avec succès !");
        setSourceAmount("");
        setDestinationAmount("");
        setExchangeRate("");
        setNotes("");
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.message || "Erreur lors de l'enregistrement du virement.");
      }
    } catch (error) {
      console.error("Virement creation error:", error);
      alert("Une erreur est survenue lors de la communication.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm("Voulez-vous vraiment annuler ce virement interne ? Les fonds seront recrédités et débités à l'état initial.")) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/internal-transfers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (res.ok) {
        alert("✅ Virement annulé avec succès ! Soldes restaurés.");
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.message || "Erreur lors de l'annulation.");
      }
    } catch (error) {
      console.error("Delete virement error:", error);
      alert("Impossible de contacter le serveur.");
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [session]);


  // Handle auto-matching same currency behavior
  useEffect(() => {
    if (isSameCurrency && sourceAmount) {
      setDestinationAmount(sourceAmount);
      setExchangeRate("1");
    }
  }, [sourceAmount, sourceAccountId, destinationAccountId]);

  // Set default date
  useEffect(() => {
    if (!transferDate) {
      setTransferDate(new Date().toISOString().split("T")[0]);
    }
  }, []);

  const userRoles = ((session?.user as any)?.roles || []).map((r: string) => r.toUpperCase());
  const isAdmin = userRoles.some((r: string) => ["ADMIN", "ADMINISTRATEUR"].includes(r));
  const isComptable = userRoles.some((r: string) => ["COMPTABLE", "ACCOUNTANT"].includes(r));
  const hasAccess = isAdmin || isComptable;

  if (loading) {
    return (
      <div className="w-full py-12 flex items-center justify-center text-[#8B9CBB] font-medium">
        Chargement du gestionnaire de virements...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen bg-slate-950 text-slate-50">
        <h1 className="text-3xl font-bold text-rose-400 mb-4">Accès Refusé</h1>
        <p className="text-slate-400">Seuls l'administrateur ou le comptable ont accès aux virements internes.</p>
        <a href="/" className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors">
          Retour au tableau de bord
        </a>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            Virements Internes
          </h1>
          <p className="text-slate-400 mt-2">Gérez les transferts de fonds et la conversion de devises entre vos comptes de trésorerie</p>
        </div>
      </div>

        {/* INTERACTIVE PANEL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* TRANSFER FORM PANEL */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <span>🔄</span> Nouvelle Opération de Virement
            </h3>

            <form onSubmit={handleCreateTransfer} className="space-y-6">
              
              {/* Account Selectors Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">💳 Compte Émetteur (Source)</label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  >
                    <option value="" disabled>Sélectionnez le compte</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Dispo : {Number(acc.current_balance).toLocaleString()} {acc.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">💳 Compte Bénéficiaire (Cible)</label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  >
                    <option value="" disabled>Sélectionnez le compte</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Dispo : {Number(acc.current_balance).toLocaleString()} {acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amounts and conversion block */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Montant Source</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={sourceAmount}
                        onChange={(e) => setSourceAmount(e.target.value)}
                        placeholder="Ex: 500"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none transition-colors font-mono font-bold"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 uppercase">
                        {sourceAccount?.currency || "DEV"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Taux Appliqué</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      disabled={isSameCurrency || !sourceAccountId || !destinationAccountId}
                      placeholder="Ex: 1.000"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Montant Reçu (Cible)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={destinationAmount}
                        onChange={(e) => setDestinationAmount(e.target.value)}
                        disabled={isSameCurrency || !sourceAccountId || !destinationAccountId}
                        placeholder="Ex: 500"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none transition-colors font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 uppercase">
                        {destAccount?.currency || "DEV"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Autoconvert button Helper if currencies are different */}
                {!isSameCurrency && sourceAccountId && destinationAccountId && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAutoConvert}
                      disabled={converting}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <span>💱</span> {converting ? "Calcul..." : "Auto-convertir via taux système"}
                    </button>
                  </div>
                )}
              </div>

              {/* Date & notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Date du virement</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Approvisionnement caisse secondaire..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
                >
                  {submitting ? "Exécution..." : "Valider le Virement"}
                </button>
              </div>

            </form>
          </div>

          {/* RULES / EXPLANATIONS */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
                <span>🛡️</span> Règles de Virement
              </h3>
              <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                <div className="flex gap-3">
                  <span className="text-teal-400">✔</span>
                  <p><strong>Impact en temps réel :</strong> Le solde du compte source est immédiatement débité tandis que celui du compte de destination est immédiatement crédité.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal-400">✔</span>
                  <p><strong>Multi-devises fluide :</strong> Si vous convertissez, vous pouvez adapter manuellement le taux final ou importer directement le dernier taux actif de l'ERP via l'auto-conversion.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal-400">✔</span>
                  <p><strong>Annulation à la demande :</strong> L'annulation ré-injecte immédiatement les soldes initiaux pour corriger les erreurs comptables d'un clic.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/60 text-[10px] text-slate-500">
              Chaque opération génère 2 mouvements (IN et OUT) pour une rigueur financière absolue.
            </div>
          </div>
        </div>

        {/* TIMELINE HISTORICAL TABLE */}
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>📜</span> Historique des Virements Internes
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Compte Source</th>
                  <th className="px-6 py-4">Compte Cible</th>
                  <th className="px-6 py-4">Montant Débité</th>
                  <th className="px-6 py-4">Montant Crédité</th>
                  <th className="px-6 py-4">Taux appliqué</th>
                  <th className="px-6 py-4">Par</th>
                  <th className="px-6 py-4">Date de virement</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500 italic">
                      Aucun virement interne n'a été enregistré.
                    </td>
                  </tr>
                ) : (
                  transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-slate-200 font-semibold">
                        💳 {tr.accounts_internal_transfers_source_account_idToaccounts?.name || "Inconnu"}
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-semibold">
                        💳 {tr.accounts_internal_transfers_destination_account_idToaccounts?.name || "Inconnu"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-rose-400 font-mono">
                          -{Number(tr.source_amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {tr.accounts_internal_transfers_source_account_idToaccounts?.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-400 font-mono">
                          +{Number(tr.destination_amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {tr.accounts_internal_transfers_destination_account_idToaccounts?.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                        {tr.exchange_rate ? Number(tr.exchange_rate).toFixed(4) : "1.0000"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {tr.users?.full_name || "Système"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(tr.transfer_date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteTransfer(tr.id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-semibold transition-all"
                          title="Annuler le virement"
                        >
                          🗑 Annuler
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
