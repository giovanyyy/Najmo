"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import CreateClientModal from "@/components/CreateClientModal";
import ClientDetailsModal from "@/components/ClientDetailsModal";
import { useClients, useClientMutations } from "@/hooks/useClients";

export default function ClientsPage() {
  const { data: session } = useSession();
  const { data: clients = [], isLoading: loadingClients, refetch: fetchClients } = useClients();
  const { deleteMutation } = useClientMutations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (client: any) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleQuickPayment = async (client: any) => {
    const debt = Math.abs(Number(client.total_profit));
    const amount = prompt(`Encaisser un paiement pour ${client.full_name}\nDette actuelle : ${debt} DZD\nEntrez le montant reçu :`, debt.toString());
    
    if (amount && !isNaN(Number(amount))) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/operations`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session as any)?.accessToken}`
          },
          body: JSON.stringify({
            operation_type: 'PAYMENT',
            client_id: client.id.toString(),
            product_id: "5", // ID de produit par défaut
            amount_dzd: parseFloat(amount),
            profit: 0,
            notes: `Règlement rapide de dette`
          })
        });
        
        if (res.ok) {
          alert("✅ Paiement enregistré !");
          // Optionally trigger a refresh via react-query here
        } else {
          alert("❌ Erreur lors de l'enregistrement");
        }
      } catch (error) {
        console.error("Payment error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Gestion des Clients
            </h1>
            <p className="text-slate-400 mt-1">Créez, modifiez et suivez vos fiches clients.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowOnlyDebtors(!showOnlyDebtors)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                showOnlyDebtors 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg shadow-rose-900/20' 
                : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              🚩 {showOnlyDebtors ? 'Affichage: Retards uniquement' : 'Voir les Retards'}
            </button>
            <button 
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
              + Nouveau Client
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Client</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Contact</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Opérations</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Dette/Crédit</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loadingClients ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chargement...</td></tr>
              ) : (clients as any[]).filter((c: any) => !showOnlyDebtors || Number(c.total_profit) < 0).length > 0 ? (
                (clients as any[])
                  .filter((c: any) => !showOnlyDebtors || Number(c.total_profit) < 0)
                  .map((client: any) => {
                    const isRetard = Number(client.total_profit) < 0;
                    return (
                      <tr key={client.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {client.full_name}
                            </span>
                            {isRetard && (
                              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded animate-pulse border border-rose-500/20">
                                🚩 RETARD
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">ID: #{client.id.toString()}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            client.client_type === 'VIP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {client.client_type}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-300">{client.phone}</div>
                          <div className="text-[10px] text-slate-500">{client.email}</div>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {client.total_operations}
                        </td>
                        <td className={`p-4 text-right font-bold ${isRetard ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {Number(client.total_profit).toLocaleString()} DZD
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            {isRetard && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuickPayment(client); }}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"
                                title="Encaisser paiement"
                              >
                                💰
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDetails(client)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700"
                              title="Détails"
                            >
                              👁️
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsModalOpen(true); }}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all border border-blue-500/20"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                if(confirm(`Supprimer le client ${client.full_name} ?`)) {
                                  await deleteMutation.mutateAsync(client.id.toString());
                                }
                              }}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all border border-rose-500/20"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 italic">Aucun client trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CreateClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchClients}
          accessToken={(session as any)?.accessToken}
          userRoles={(session as any)?.user?.roles || []}
          clientData={selectedClient}
        />
      )}

      {isDetailsOpen && (
        <ClientDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          client={selectedClient}
          accessToken={(session as any)?.accessToken}
        />
      )}
    </div>
  );
}
