"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Account {
  id: string;
  name: string;
  currency: string;
  current_balance: string;
}

interface Expense {
  id: string;
  category: string;
  amount: string;
  currency: string;
  description: string | null;
  expense_date: string;
  accounts?: {
    name: string;
  };
  users?: {
    full_name: string;
  };
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState("FONCTIONNEMENT");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("DZD");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInitialData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }

      // 1. Fetch Accounts
      const accountsRes = await fetch(`${apiBase}/accounts`, { headers });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          setAccountId(accountsData[0].id);
          setCurrency(accountsData[0].currency);
        }
      }

      // 2. Fetch Expenses
      await fetchExpenses();
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }

      let url = `${apiBase}/expenses`;
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (accountFilter) params.append("account_id", accountFilter);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleAccountChange = (id: string) => {
    setAccountId(id);
    const selectedAcc = accounts.find((a) => a.id === id);
    if (selectedAcc) {
      setCurrency(selectedAcc.currency);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }
    if (!accountId) {
      alert("Veuillez sélectionner un compte de trésorerie.");
      return;
    }
    if (!expenseDate) {
      alert("Veuillez renseigner la date de la charge.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          category,
          account_id: accountId,
          amount: Number(amount),
          currency,
          description: description || undefined,
          expense_date: new Date(expenseDate).toISOString(),
        }),
      });

      if (res.ok) {
        alert("✅ Charge enregistrée avec succès !");
        setIsModalOpen(false);
        setAmount("");
        setDescription("");
        // Reload all data
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.message || "Erreur lors de la création de la charge.");
      }
    } catch (error) {
      console.error("Create expense error:", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette charge ? Son montant sera recrédité sur le compte concerné.")) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (res.ok) {
        alert("✅ Charge supprimée et trésorerie réajustée !");
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.message || "Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Delete expense error:", error);
      alert("Impossible de contacter le serveur.");
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [session]);


  // Refetch expenses when filters change
  useEffect(() => {
    if (session) {
      fetchExpenses();
    }
  }, [categoryFilter, accountFilter]);

  // Set default date when modal opens
  useEffect(() => {
    if (isModalOpen && !expenseDate) {
      setExpenseDate(new Date().toISOString().split("T")[0]);
    }
  }, [isModalOpen]);

  const userRoles = ((session?.user as any)?.roles || []).map((r: string) => r.toUpperCase());
  const isAdmin = userRoles.some((r: string) => ["ADMIN", "ADMINISTRATEUR"].includes(r));
  const isComptable = userRoles.some((r: string) => ["COMPTABLE", "ACCOUNTANT"].includes(r));
  const hasAccess = isAdmin || isComptable;

  if (loading) {
    return (
      <div className="w-full py-12 flex items-center justify-center text-[#8B9CBB] font-medium">
        Chargement du module de charges...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen bg-slate-950 text-slate-50">
        <h1 className="text-3xl font-bold text-rose-400 mb-4">Accès Refusé</h1>
        <p className="text-slate-400">Seuls l'administrateur ou le comptable ont accès à la gestion des charges.</p>
        <a href="/" className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors">
          Retour au tableau de bord
        </a>
      </div>
    );
  }

  // Calculate dynamics KPIs (in DZD as standard base, or direct values per currency if matching)
  const getSumByCategory = (cat: string) => {
    return expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const sumFonctionnement = getSumByCategory("FONCTIONNEMENT");
  const sumPublicitaire = getSumByCategory("PUBLICITAIRE");
  const sumAutre = getSumByCategory("AUTRE");
  const totalCombined = sumFonctionnement + sumPublicitaire + sumAutre;

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "FONCTIONNEMENT":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "PUBLICITAIRE":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-700/50";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "FONCTIONNEMENT":
        return "📁 Fonctionnement";
      case "PUBLICITAIRE":
        return "📣 Publicitaire";
      default:
        return "⚙ Autre";
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            Gestion des Charges & Dépenses
          </h1>
          <p className="text-slate-400 mt-2">Contrôlez, catégorisez et suivez l'impact de vos dépenses opérationnelles et publicitaires</p>
        </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
          >
            <span>💸</span> Enregistrer une charge
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Combined</span>
            <div className="text-3xl font-extrabold text-white">
              {totalCombined.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-500 ml-1.5">UNITES</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Dépenses globales actives</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">📁 Fonctionnement</span>
            <div className="text-3xl font-extrabold text-indigo-300">
              {sumFonctionnement.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Loyer, abonnements, salaires...</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-2">📣 Publicitaires</span>
            <div className="text-3xl font-extrabold text-amber-300">
              {sumPublicitaire.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Dépenses de diffusion ads</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">⚙ Autres charges</span>
            <div className="text-3xl font-extrabold text-slate-300">
              {sumAutre.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Dépenses diverses de secours</span>
          </div>
        </div>

        {/* FILTERS & SEARCH ROW */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
            <span>🔍</span>
            <span>Filtres de recherche</span>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-initial">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              >
                <option value="">Toutes catégories</option>
                <option value="FONCTIONNEMENT">📁 Fonctionnement</option>
                <option value="PUBLICITAIRE">📣 Publicitaire</option>
                <option value="AUTRE">⚙ Autre</option>
              </select>
            </div>

            <div className="flex-1 md:flex-initial">
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              >
                <option value="">Tous les comptes</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    💳 {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* EXPENSES HISTORICAL TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Dépense / Catégorie</th>
                  <th className="px-6 py-4">Compte Source</th>
                  <th className="px-6 py-4">Montant débité</th>
                  <th className="px-6 py-4">Description / Notes</th>
                  <th className="px-6 py-4">Enregistré par</th>
                  <th className="px-6 py-4">Date de charge</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                      Aucune charge enregistrée pour ces critères.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${getCategoryBadgeClass(exp.category)}`}>
                          {getCategoryLabel(exp.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        💳 {exp.accounts?.name || "Compte Inconnu"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-rose-400 font-mono text-base">
                          -{Number(exp.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {exp.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate" title={exp.description || ""}>
                        {exp.description || <span className="text-slate-600 italic">Aucune note</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs">
                        {exp.users?.full_name || "Système"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                        {new Date(exp.expense_date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-semibold transition-all"
                          title="Supprimer la charge (recrédite le compte)"
                        >
                          🗑 Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* CREATE EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors text-xl font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent mb-6">
              Enregistrer une Charge
            </h3>
            
            <form onSubmit={handleAddExpense} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Catégorie de dépense</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                >
                  <option value="FONCTIONNEMENT">📁 Charges de fonctionnement</option>
                  <option value="PUBLICITAIRE">📣 Charges publicitaires</option>
                  <option value="AUTRE">⚙ Autres dépenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Compte à Débiter</label>
                <select
                  value={accountId}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                >
                  <option value="" disabled>Sélectionnez un compte</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Solde : {Number(acc.current_balance).toLocaleString()} {acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Montant</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 4500.00"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Devise</label>
                  <input
                    type="text"
                    value={currency}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 text-sm font-bold uppercase cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Date de la dépense</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : Paiement loyer Mai, Achat serveurs..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors border border-slate-700/60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-55"
                >
                  {submitting ? "Enregistrement..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
