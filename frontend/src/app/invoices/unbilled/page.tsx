"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export default function UnbilledOperationsPage() {
  const { data: session, status } = useSession();
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CCP");

  const fetchUnbilled = useCallback(async () => {
    if (status === "authenticated" && (session as any)?.accessToken) {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/operations/unbilled`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        if (res.ok) setOperations(await res.json());
      } catch (error) {
        console.error("Failed to fetch unbilled operations:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== "loading") {
      fetchUnbilled();
    }
  }, [status, fetchUnbilled]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === operations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(operations.map(op => op.id.toString()));
    }
  };

  const generateInvoices = async () => {
    if (selectedIds.length === 0) return;

    // Group selected operations by client_id
    const selectedOps = operations.filter(op => selectedIds.includes(op.id.toString()));
    
    // Check if multiple clients are selected
    const clientIds = [...new Set(selectedOps.map(op => op.client_id?.toString()))];
    
    if (clientIds.includes(undefined)) {
      alert("Certaines opérations n'ont pas de client assigné. Facturation impossible.");
      return;
    }

    if (clientIds.length > 1) {
      alert("Veuillez sélectionner uniquement les opérations d'un seul client à la fois pour les regrouper sur une même facture.");
      return;
    }

    const clientId = clientIds[0];

    setIsGenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/bulk-group`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({
          client_id: clientId,
          operation_ids: selectedIds,
          currency: 'DZD',
          payment_method: paymentMethod
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Facture générée avec succès pour ${selectedOps.length} opération(s) !`);
        window.location.href = `/invoices/${data.id}/print`;
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de la facture.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (status === "loading" || (loading && operations.length === 0)) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>;
  }

  const selectedTotal = operations
    .filter(op => selectedIds.includes(op.id.toString()))
    .reduce((sum, op) => sum + Number(op.amount_dzd || 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Opérations Non Facturées
            </h1>
            <p className="text-slate-400 mt-1">Sélectionnez les opérations d'un même client pour générer une facture globale.</p>
          </div>
          <div className="flex gap-4">
            <a href="/invoices" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm transition-colors">
              Retour aux Factures
            </a>
          </div>
        </div>

        {/* Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between animate-fade-in">
            <div className="flex flex-wrap items-center gap-4">
              <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                {selectedIds.length} sélectionnée(s)
              </span>
              <span className="text-blue-300 font-medium">
                Total estimé : <b className="text-white">{selectedTotal.toLocaleString('fr-FR')} DZD</b>
              </span>
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Mode :</span>
                <select 
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Espèces</option>
                  <option value="CCP">CCP / BaridiMob</option>
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                  <option value="PAYONEER">Payoneer</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="REDOTPAY">Redotpay</option>
                  <option value="CRYPTO">Crypto (USDT)</option>
                </select>
              </div>
            </div>
            <button 
              onClick={generateInvoices}
              disabled={isGenerating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-all"
            >
              {isGenerating ? 'Génération...' : 'Créer la Facture Groupée'}
            </button>
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="p-4 text-center w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === operations.length && operations.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
                  />
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Client</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Produit/Service</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Montant</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {operations.length > 0 ? (
                operations.map((op: any) => {
                  const isSelected = selectedIds.includes(op.id.toString());
                  return (
                    <tr 
                      key={op.id} 
                      onClick={() => toggleSelection(op.id.toString())}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-800/30'}`}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
                        />
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(op.operation_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-200">
                        {op.clients?.full_name || 'Inconnu'}
                      </td>
                      <td className="p-4 text-sm text-slate-300">
                        {op.products?.name || 'Service'}
                      </td>
                      <td className="p-4 text-sm text-right font-bold text-white">
                        {Number(op.amount_dzd || 0).toLocaleString('fr-FR')} DZD
                      </td>
                      <td className="p-4 text-sm text-slate-500 max-w-xs truncate">
                        {op.notes}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                    Toutes vos opérations de vente sont facturées ! 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
