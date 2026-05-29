"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import CreateOperationModal from "@/components/CreateOperationModal";

interface Client {
  id: string;
  full_name: string;
}

interface Product {
  id: string;
  name: string;
}

export default function OperationsPage() {
  const { data: session, status } = useSession();
  const [operations, setOperations] = useState([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      const res = await fetch(`${apiBase}/operations`, { headers });
      if (res.ok) setOperations(await res.json());
    } catch (error) {
      console.error("Failed to fetch operations:", error);
    } finally {
      setLoading(false);
    }
  }, [session, status]);


  const fetchFilterMetadata = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      const clientsRes = await fetch(`${apiBase}/clients`, { headers });
      if (clientsRes.ok) setAllClients(await clientsRes.json());

      const productsRes = await fetch(`${apiBase}/products`, { headers });
      if (productsRes.ok) setAllProducts(await productsRes.json());
    } catch (error) {
      console.error("Failed to fetch filter metadata:", error);
    }
  }, [session, status]);

  const generateInvoice = async (op: any) => {
    if (!op.clients?.id) {
      alert("Impossible de générer une facture pour un Passant. Veuillez sélectionner un client.");
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/bulk-group`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({
          client_id: op.clients.id.toString(),
          operation_ids: [op.id.toString()],
          currency: 'DZD',
          notes: op.notes || `Facture pour l'opération ${op.products?.name || ''}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/invoices/${data.id}/print`;
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de la facture.");
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchOperations();
      fetchFilterMetadata();
    }
  }, [status, fetchOperations, fetchFilterMetadata]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClientId("");
    setSelectedProductId("");
    setSelectedCurrency("");
    setSelectedType("");
    setStartDate("");
    setEndDate("");
  };

  // Perform combinatorial client-side filtering
  const filteredOperations = operations.filter((op: any) => {
    // 1. Global Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const clientName = op.clients?.full_name?.toLowerCase() || "passant";
      const productName = op.products?.name?.toLowerCase() || "inconnu";
      const notes = op.notes?.toLowerCase() || "";
      const opId = op.id?.toString() || "";
      const matchesSearch = clientName.includes(q) || productName.includes(q) || notes.includes(q) || opId.includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Client filter
    if (selectedClientId && op.client_id?.toString() !== selectedClientId) {
      return false;
    }

    // 3. Product filter
    if (selectedProductId && op.product_id?.toString() !== selectedProductId) {
      return false;
    }

    // 4. Currency filter
    if (selectedCurrency) {
      const opCur = op.foreign_currency || "DZD";
      if (opCur.toUpperCase() !== selectedCurrency.toUpperCase()) {
        return false;
      }
    }

    // 5. Type filter
    if (selectedType && op.operation_type !== selectedType) {
      return false;
    }

    // 6. Date Range filter
    const opDate = new Date(op.operation_date || op.created_at);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (opDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (opDate > end) return false;
    }

    return true;
  });

  // Export to Excel-compatible CSV format
  const exportToExcel = () => {
    if (filteredOperations.length === 0) {
      alert("Aucune opération à exporter.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Type",
      "Client",
      "Produit",
      "Montant DZD",
      "Coût DZD",
      "Profit DZD",
      "Devise Originale",
      "Montant Original",
      "Notes"
    ];

    const rows = filteredOperations.map((op: any) => {
      const opDate = op.operation_date ? new Date(op.operation_date).toLocaleDateString('fr-FR') : '';
      const opTypeLabel = op.operation_type === 'SALE' ? 'VENTE' : 
                          op.operation_type === 'PURCHASE' ? 'ACHAT' : 
                          op.operation_type === 'EXPENSE' ? 'CHARGE' : 'VIREMENT';
      const clientName = op.clients?.full_name || 'Passant';
      const productName = op.products?.name || 'Inconnu';
      const amount = Number(op.amount_dzd || 0).toFixed(2);
      const cost = Number(op.operation_cost || 0).toFixed(2);
      const profit = Number(op.profit || 0).toFixed(2);
      const foreignCur = op.foreign_currency || 'DZD';
      const foreignAmt = Number(op.foreign_amount || op.amount_dzd).toFixed(2);
      const notes = op.notes ? op.notes.replace(/"/g, '""') : '';

      return [
        `"${op.id}"`,
        `"${opDate}"`,
        `"${opTypeLabel}"`,
        `"${clientName}"`,
        `"${productName}"`,
        `"${amount}"`,
        `"${cost}"`,
        `"${profit}"`,
        `"${foreignCur}"`,
        `"${foreignAmt}"`,
        `"${notes}"`
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const nowStr = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `najmo_export_operations_${nowStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  if (status === "loading" || (loading && operations.length === 0)) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">
      Chargement des opérations...
    </div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .print-hidden { display: none !important; }
          .print-only { display: block !important; }
          main { padding: 0 !important; }
          table { border: 1px solid #cbd5e1 !important; width: 100% !important; border-collapse: collapse !important; color: black !important; }
          th { background-color: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #cbd5e1 !important; font-weight: bold !important; text-transform: uppercase !important; }
          td, th { padding: 8px 12px !important; border: 1px solid #cbd5e1 !important; font-size: 10px !important; color: black !important; }
          .text-emerald-400, .text-rose-400, .text-slate-400, .text-white { color: black !important; font-weight: medium !important; }
          @page { size: A4 landscape; margin: 1.5cm; }
        }
      `}} />

      <CreateOperationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        accessToken={(session as any)?.accessToken} 
        onSuccess={fetchOperations}
      />

      <div className="max-w-7xl mx-auto">
        
        {/* PRINT ONLY REPORT HEADER */}
        <div className="hidden print:block mb-8">
          <div className="flex justify-between items-end border-b-2 border-slate-300 pb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">NAJMO</h1>
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mt-1">Rapport d'Activité Financière</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p>Édité le : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
              <p>Total lignes : {filteredOperations.length}</p>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 print-hidden">
          <div>
            <div className="flex items-center gap-3">
              <a href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Gestion des Opérations
              </h1>
            </div>
            <p className="text-slate-400 mt-2 ml-9">Recherchez et filtrez l'historique complet de vos transactions financières.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-900/20"
            >
              + Nouvelle Opération
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl mb-8 shadow-xl print-hidden">
          <div className="flex flex-col gap-4">
            
            {/* Row 1: Global Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Recherche globale rapide (nom de client, de produit, notes ou identifiant)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Row 2: Advanced Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Client Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Filtrer par Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                >
                  <option value="">Tous les clients</option>
                  {allClients.map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      👤 {c.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Filtrer par Produit</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                >
                  <option value="">Tous les produits</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      📦 {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Filtrer par Devise</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                >
                  <option value="">Toutes devises</option>
                  <option value="DZD">DZD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Filtrer par Statut / Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                >
                  <option value="">Tous types</option>
                  <option value="SALE">VENTE</option>
                  <option value="PURCHASE">ACHAT</option>
                  <option value="EXPENSE">CHARGE</option>
                  <option value="TRANSFER">VIREMENT</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Date Début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Date Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 3: Action triggers */}
            <div className="flex justify-between items-center mt-2 border-t border-slate-800/80 pt-4">
              
              {/* EXPORTS & PRINTING BUTTONS */}
              <div className="flex gap-3">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  📥 Exporter Excel
                </button>
                <button
                  onClick={printReport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  🖨️ Imprimer Rapport (PDF)
                </button>
              </div>

              {/* Reset filter */}
              {(searchQuery || selectedClientId || selectedProductId || selectedCurrency || selectedType || startDate || endDate) && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700"
                >
                  Clarifier les filtres 🧹
                </button>
              )}
            </div>

          </div>
        </div>

        {/* OPERATIONS LEDGER TABLE */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Client</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Produit</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Montant (DZD)</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Coût</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Profit</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Notes & PJ</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center print-hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOperations.length > 0 ? (
                  filteredOperations.map((op: any) => (
                    <tr key={op.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-xs font-mono text-slate-500">
                        #{op.id}
                      </td>
                      <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                        {op.operation_date && !isNaN(new Date(op.operation_date).getTime()) 
                          ? new Date(op.operation_date).toLocaleDateString('fr-FR') 
                          : (op.created_at && !isNaN(new Date(op.created_at).getTime()) 
                              ? new Date(op.created_at).toLocaleDateString('fr-FR') 
                              : String(op.operation_date || '-'))}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          op.operation_type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500' :
                          op.operation_type === 'PURCHASE' ? 'bg-amber-500/10 text-amber-500' :
                          op.operation_type === 'EXPENSE' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {op.operation_type === 'SALE' ? 'VENTE' : 
                           op.operation_type === 'PURCHASE' ? 'ACHAT' : 
                           op.operation_type === 'EXPENSE' ? 'CHARGE' : 'VIREMENT'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-200 whitespace-nowrap">
                        👤 {op.clients?.full_name || 'Passant'}
                      </td>
                      <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                        📦 {op.products?.name || 'Inconnu'}
                      </td>
                      <td className="p-4 text-sm text-right font-extrabold text-white font-mono">
                        {Number(op.amount_dzd || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-right text-slate-400 font-mono">
                        {Number(op.operation_cost || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-4 text-sm text-right font-extrabold font-mono ${Number(op.profit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {Number(op.profit) >= 0 ? '+' : ''}{Number(op.profit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex flex-col gap-1">
                          {op.notes && <span className="text-slate-400 text-xs truncate max-w-[150px]" title={op.notes}>{op.notes}</span>}
                          {op.attachment_url && (
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${op.attachment_url}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 font-medium print-hidden"
                            >
                              📎 Voir PJ
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center print-hidden">
                        <div className="flex items-center justify-center gap-2">
                          {op.operation_type === 'SALE' && op.clients && !op.invoice_id && (
                            <button 
                              onClick={() => generateInvoice(op)}
                              className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded text-xs font-semibold transition-colors"
                            >
                              Générer Facture
                            </button>
                          )}
                          {op.operation_type === 'SALE' && op.invoice_id && (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-xs font-extrabold cursor-default">
                              ✓ Facturé
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500 italic">
                      Aucune opération ne correspond à vos filtres de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
