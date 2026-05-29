"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface LedgerEntry {
  id: string;
  account_id: string;
  movement_type: "IN" | "OUT";
  amount: string;
  currency: string;
  balance_before: string | null;
  balance_after: string | null;
  description: string | null;
  created_at: string;
  accounts?: {
    name: string;
    account_type: string;
  };
  operations?: {
    operation_type: string;
    notes: string | null;
  };
}

interface CurrencyFlow {
  inflows: number;
  outflows: number;
  monthlyInflows: number;
  monthlyOutflows: number;
}

interface StatsData {
  cumulativeBalances: Record<string, number>;
  flows: Record<string, CurrencyFlow>;
}

interface ForecastEntry {
  currentBalance: number;
  avgMonthlyInflow: number;
  avgMonthlyOutflow: number;
  avgMonthlyNetCashflow: number;
  projectedBalance30Days: number;
  trend: "UP" | "DOWN" | "STABLE";
}

export default function TreasuryPage() {
  const { data: session } = useSession();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [forecast, setForecast] = useState<Record<string, ForecastEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  // Currency Tab Selection
  const [selectedCurrency, setSelectedCurrency] = useState("DZD");

  // Ledger Filters
  const [accountIdFilter, setAccountIdFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      }

      // 2. Fetch Stats & Forecast
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/treasury/stats`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      const forecastRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/treasury/forecast`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (forecastRes.ok) {
        setForecast(await forecastRes.json());
      }

      // 3. Fetch Ledger
      await fetchLedger();

    } catch (error) {
      console.error("Error loading treasury data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/treasury/ledger`;
      const params = new URLSearchParams();
      params.append("currency", selectedCurrency); // Automatically scoped to the current currency tab

      if (accountIdFilter) params.append("account_id", accountIdFilter);
      if (movementTypeFilter) params.append("movement_type", movementTypeFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [session]);


  // Refetch Ledger when currency or filters change
  useEffect(() => {
    if (session && !loading) {
      fetchLedger();
    }
  }, [selectedCurrency, accountIdFilter, movementTypeFilter, startDate, endDate]);

  const userRoles = ((session?.user as any)?.roles || []).map((r: string) => r.toUpperCase());
  const isAdmin = userRoles.some((r: string) => ["ADMIN", "ADMINISTRATEUR"].includes(r));
  const isComptable = userRoles.some((r: string) => ["COMPTABLE", "ACCOUNTANT"].includes(r));
  const hasAccess = isAdmin || isComptable;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-medium">
        Chargement du journal de trésorerie analytique...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen bg-slate-950 text-slate-50">
        <h1 className="text-3xl font-bold text-rose-400 mb-4">Accès Refusé</h1>
        <p className="text-slate-400">Seuls l'administrateur ou le comptable ont accès au journal de trésorerie et cashflow.</p>
        <a href="/" className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors">
          Retour au tableau de bord
        </a>
      </div>
    );
  }

  // Current scope values
  const activeBalance = stats?.cumulativeBalances[selectedCurrency] || 0;
  const activeFlow = stats?.flows[selectedCurrency] || { inflows: 0, outflows: 0, monthlyInflows: 0, monthlyOutflows: 0 };
  const activeForecast = forecast?.[selectedCurrency] || {
    currentBalance: 0,
    avgMonthlyInflow: 0,
    avgMonthlyOutflow: 0,
    avgMonthlyNetCashflow: 0,
    projectedBalance30Days: 0,
    trend: "STABLE",
  };

  const getTrendBadge = (trend: "UP" | "DOWN" | "STABLE") => {
    switch (trend) {
      case "UP":
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-xs">📈 En hausse</span>;
      case "DOWN":
        return <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-bold text-xs">📉 En baisse</span>;
      default:
        return <span className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-700 rounded-full font-bold text-xs">➖ Stable</span>;
    }
  };

  return (
    <main className="flex-1 p-8 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <a href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Suivi de Trésorerie & Cashflow
              </h1>
            </div>
            <p className="text-slate-400 mt-2 ml-9">Supervisez les liquidités réelles, analysez les flux d'entrées/sorties et anticipez l'avenir financier</p>
          </div>
        </div>

        {/* CURRENCY SELECTOR TABS */}
        <div className="flex gap-3 mb-8 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 max-w-md">
          {["DZD", "USD", "EUR", "USDT"].map((cur) => (
            <button
              key={cur}
              onClick={() => {
                setSelectedCurrency(cur);
                setAccountIdFilter(""); // Reset account filter when shifting currencies to avoid conflicts
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold uppercase transition-all ${
                selectedCurrency === cur
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {cur}
            </button>
          ))}
        </div>

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* CUMULATIVE CASH */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">💰 Solde Cumulé Actuel</span>
              <div className="text-3xl font-black text-white font-mono">
                {activeBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                <span className="text-base font-normal text-slate-500 ml-2">{selectedCurrency}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block mt-4">Total disponible sur tous les comptes {selectedCurrency}</span>
          </div>

          {/* MONTHLY INFLOWS */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2">📈 Total Encaissements (Mois en cours)</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                +{activeFlow.monthlyInflows.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                <span className="text-base font-normal text-slate-500 ml-2">{selectedCurrency}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block mt-4">Entrées de trésorerie ce mois-ci</span>
          </div>

          {/* MONTHLY OUTFLOWS */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-2">📉 Total Décaissements (Mois en cours)</span>
              <div className="text-3xl font-black text-rose-400 font-mono">
                -{activeFlow.monthlyOutflows.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                <span className="text-base font-normal text-slate-500 ml-2">{selectedCurrency}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block mt-4">Sorties de trésorerie ce mois-ci</span>
          </div>
        </div>

        {/* CASHFLOW FORECAST CARD (PREVISION MENSUELLE) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 p-8 rounded-3xl mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-100">🔮 Prévision Mensuelle & Tendance (J+30)</h3>
                {getTrendBadge(activeForecast.trend)}
              </div>
              <p className="text-slate-400 text-xs mt-1">Projection prédictive basée sur l'historique de vos flux réels des 90 derniers jours</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Trésorerie Actuelle</span>
              <div className="text-2xl font-bold font-mono text-slate-300">
                {activeForecast.currentBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {selectedCurrency}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Flux Net Moyen Mensuel</span>
              <div className={`text-xl font-extrabold font-mono flex items-center gap-1.5 ${
                activeForecast.avgMonthlyNetCashflow >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                {activeForecast.avgMonthlyNetCashflow >= 0 ? "📈 +" : "📉 "}
                {activeForecast.avgMonthlyNetCashflow.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {selectedCurrency}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Solde Estimé à J+30</span>
              <div className="text-3xl font-black font-mono text-white">
                {activeForecast.projectedBalance30Days.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                <span className="text-sm font-bold text-emerald-400 ml-2 uppercase">
                  {selectedCurrency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LEDGER FILTERS ROW */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl mb-8 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold mb-4">
            <span>🔍</span>
            <span>Filtres du Journal de Trésorerie</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <select
                value={accountIdFilter}
                onChange={(e) => setAccountIdFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              >
                <option value="">Tous les comptes ({selectedCurrency})</option>
                {accounts
                  .filter((a) => a.currency.toUpperCase() === selectedCurrency)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      💳 {acc.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              >
                <option value="">Tous types de flux</option>
                <option value="IN">📈 Entrées (IN)</option>
                <option value="OUT">📉 Sorties (OUT)</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Date Début"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              />
            </div>

            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Date Fin"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* LEDGER JOURNAL TABLE */}
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>📜</span> Journal de Trésorerie - Flux Réels
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Compte Émetteur</th>
                  <th className="px-6 py-4">Type de Flux</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Solde Avant</th>
                  <th className="px-6 py-4">Solde Après</th>
                  <th className="px-6 py-4">Motif / Notes</th>
                  <th className="px-6 py-4">Date de Mouvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                      Aucune transaction enregistrée pour ces filtres.
                    </td>
                  </tr>
                ) : (
                  ledger.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        💳 {mov.accounts?.name || "Compte Inconnu"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          mov.movement_type === "IN"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {mov.movement_type === "IN" ? "📈 Entrée" : "📉 Sortie"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-extrabold font-mono text-base ${
                          mov.movement_type === "IN" ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {mov.movement_type === "IN" ? "+" : "-"}
                          {Number(mov.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {mov.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {mov.balance_before ? `${Number(mov.balance_before).toLocaleString()} ${mov.currency}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-mono text-xs font-semibold">
                        {mov.balance_after ? `${Number(mov.balance_after).toLocaleString()} ${mov.currency}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate" title={mov.description || ""}>
                        {mov.description || <span className="text-slate-600 italic">Aucune note</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                        {new Date(mov.created_at).toLocaleString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
