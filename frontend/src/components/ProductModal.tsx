"use client";

import { useState, useEffect } from "react";

export default function ProductModal({ isOpen, onClose, accessToken, product, onSuccess, accounts }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "TIKTOK_COINS",
    is_active: true,
    compatibility: [] as any[]
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        is_active: product.is_active,
        compatibility: product.product_account_compatibility || []
      });
    } else {
      setFormData({ name: "", category: "TIKTOK_COINS", is_active: true, compatibility: [] });
    }
  }, [product, isOpen]);

  const toggleAccount = (accountId: string, type: string) => {
    const exists = formData.compatibility.find((c: any) => c.account_id.toString() === accountId.toString() && c.compatibility_type === type);
    if (exists) {
      setFormData({ ...formData, compatibility: formData.compatibility.filter((c: any) => !(c.account_id.toString() === accountId.toString() && c.compatibility_type === type)) });
    } else {
      setFormData({ ...formData, compatibility: [...formData.compatibility, { account_id: accountId, compatibility_type: type }] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = product 
        ? `${process.env.NEXT_PUBLIC_API_URL}/products/${product.id.toString()}` 
        : `${process.env.NEXT_PUBLIC_API_URL}/products`;
      
      const res = await fetch(url, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("✅ Produit sauvegardé !");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(`❌ Erreur ${res.status}: ${JSON.stringify(err)}`);
      }
    } catch (error: any) {
      alert(`🚨 Erreur Fatale: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{product ? "Modifier Produit" : "Nouveau Produit"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nom du Produit</label>
              <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Catégorie</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="TIKTOK_COINS">TikTok Coins</option>
                <option value="BUY_TIKTOK_USD">Achat $ Tiktok</option>
                <option value="SELL_USDT">Vente USDT</option>
                <option value="BUY_USDT">Achat USDT</option>
                <option value="ADS_META">Ads Meta</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              🛡️ Association des Comptes (Prisma)
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{acc.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{acc.account_type} - {acc.currency}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toggleAccount(acc.id, 'SOURCE')} className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${formData.compatibility.find((c:any) => c.account_id.toString() === acc.id.toString() && c.compatibility_type === 'SOURCE') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>ENTRÉE</button>
                    <button type="button" onClick={() => toggleAccount(acc.id, 'DESTINATION')} className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${formData.compatibility.find((c:any) => c.account_id.toString() === acc.id.toString() && c.compatibility_type === 'DESTINATION') ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>SORTIE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20">{loading ? "Enregistrement..." : "Sauvegarder"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
