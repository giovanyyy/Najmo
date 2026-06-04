"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AccountModal from "@/components/AccountModal";
import MovementHistoryModal from "@/components/MovementHistoryModal";

export default function AccountsPage() {
  const { data: session }: any = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const userRoles = (session?.user?.roles || []).map((r: string) => r.toUpperCase());
  const isAdmin = userRoles.some((r: string) => ['ADMIN', 'ADMINISTRATEUR'].includes(r));
  const isComptable = userRoles.some((r: string) => ['COMPTABLE', 'ACCOUNTANT'].includes(r));

  const fetchAccounts = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      const res = await fetch(`${apiBase}/accounts`, { headers });
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [session]);


  const handleEdit = (account: any) => {
    if (!isAdmin) return;
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const getCurrencyColor = (currency: string) => {
    switch (currency) {
      case 'DZD': return 'text-emerald-400';
      case 'USD': return 'text-blue-400';
      case 'EUR': return 'text-amber-400';
      case 'USDT': return 'text-teal-400';
      default: return 'text-slate-400';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Chargement des comptes...</div>;

  return (
    <main className="p-8 min-h-screen bg-[#0f172a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Gestion des Comptes
            </h1>
            <p className="text-slate-400">Suivez vos soldes et l'historique de vos mouvements.</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              <span>+</span> Nouveau Compte
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div 
              key={account.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-slate-800 ${getCurrencyColor(account.currency)} group-hover:scale-110 transition-transform`}>
                  {account.currency === 'DZD' ? '🇩🇿' : account.currency === 'EUR' ? '🇪🇺' : '🇺🇸'}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{account.name}</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">{account.account_type}</p>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-500 uppercase">Solde Actuel</span>
                  <span className={`text-2xl font-black ${Number(account.current_balance) < 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                    {Number(account.current_balance).toLocaleString()} <span className="text-sm font-normal ml-1">{account.currency}</span>
                  </span>
                </div>
                
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${Number(account.current_balance) < 0 ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: '100%' }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 uppercase">
                  <span>Initial: {Number(account.initial_balance).toLocaleString()}</span>
                  <span className={Number(account.current_balance) < 0 ? 'text-rose-400 font-bold' : ''}>
                    {Number(account.current_balance) < 0 ? '⚠️ SOLDE NÉGATIF' : 'Opérationnel'}
                  </span>
                </div>

                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedAccount(account);
                      setIsHistoryOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    📊 Historique
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEdit(account)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <AccountModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          account={selectedAccount}
          accessToken={session?.accessToken}
          onSuccess={() => {
            fetchAccounts();
            setIsModalOpen(false);
          }}
        />
      )}
      {isHistoryOpen && (
        <MovementHistoryModal 
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          account={selectedAccount}
          accessToken={session?.accessToken}
        />
      )}
    </main>
  );
}
