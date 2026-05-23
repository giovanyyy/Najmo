"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ProductModal from "@/components/ProductModal";

export default function ProductsPage() {
  const { data: session } = useSession();
  const userRoles = ((session as any)?.user?.roles || []).map((r: string) => r.toUpperCase());
  const isAdmin = userRoles.some((r: string) => ['ADMIN', 'ADMINISTRATEUR'].includes(r));
  const isComptable = userRoles.some((r: string) => ['COMPTABLE', 'ACCOUNTANT'].includes(r));
  const canToggle = isAdmin || isComptable;
  const canEdit = isAdmin;

  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const fetchData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      const [pRes, aRes] = await Promise.all([
        fetch(`${apiBase}/products`, { headers }),
        fetch(`${apiBase}/accounts`, { headers })
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);


  const toggleStatus = async (id: any, currentStatus: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id.toString()}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (res.ok) {
        setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
        alert("✅ Statut mis à jour !");
      } else {
        const err = await res.json();
        alert(`❌ Erreur ${res.status}: ${JSON.stringify(err)}`);
      }
    } catch (error: any) {
      alert(`🚨 Erreur Fatale: ${error.message}`);
    }
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Catalogue Produits & Services
            </h1>
            <p className="text-slate-400 mt-1">Gérez vos produits et leurs règles de compatibilité.</p>
          </div>
          <div className="flex gap-4">
            <input 
              type="text"
              placeholder="Rechercher un produit..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isAdmin && (
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
              >
                + Nouveau Produit
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Produit</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Catégorie</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Comptes Compatibles</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Statut</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chargement...</td></tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</div>
                      <div className="text-[10px] text-slate-500">ID: #{p.id.toString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-bold border border-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {p.product_account_compatibility && p.product_account_compatibility.length > 0 ? (
                          p.product_account_compatibility.map((c: any) => (
                            <span key={c.id} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                              c.compatibility_type === 'SOURCE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              c.compatibility_type === 'DESTINATION' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {(c.accounts?.name || c.account?.name || 'Inconnu')} ({c.compatibility_type === 'SOURCE' ? 'IN' : c.compatibility_type === 'DESTINATION' ? 'OUT' : 'BOTH'})
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-600 italic">Aucune règle</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {p.is_active ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {isAdmin && (
                          <button 
                            onClick={() => handleEdit(p)}
                            className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-all"
                            title="Modifier les associations"
                          >
                            ✏️
                          </button>
                        )}
                        <button 
                          disabled={!canToggle}
                          onClick={() => toggleStatus(p.id, p.is_active)}
                          className={`text-[10px] font-bold px-3 py-1 rounded transition-colors ${
                            !canToggle ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500' :
                            p.is_active ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {p.is_active ? 'DÉSACTIVER' : 'ACTIVER'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 italic">Aucun produit trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accessToken={(session as any)?.accessToken}
        product={selectedProduct}
        accounts={accounts}
        onSuccess={fetchData}
      />
    </div>
  );
}
