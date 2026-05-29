"use client";

import { useState, useEffect } from "react";

export default function AccountModal({ isOpen, onClose, account, accessToken, onSuccess }: { isOpen: boolean, onClose: () => void, account: any, accessToken: string, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    account_type: "BANK",
    currency: "DZD",
    initial_balance: "",
    is_active: true
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        account_type: account.account_type,
        currency: account.currency,
        initial_balance: account.initial_balance.toString(),
        is_active: account.is_active
      });
    } else {
      setFormData({
        name: "",
        account_type: "BANK",
        currency: "DZD",
        initial_balance: "0",
        is_active: true
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = account 
        ? `${process.env.NEXT_PUBLIC_API_URL}/accounts/${account.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/accounts`;
      
      const res = await fetch(url, {
        method: account ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          ...formData,
          initial_balance: parseFloat(formData.initial_balance)
        })
      });

      if (res.ok) {
        alert(account ? 'Compte modifié avec succès !' : 'Nouveau compte créé avec succès !');
        onSuccess();
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080C14]/80 backdrop-blur-md p-4">
      <div className="bg-[#1E2D47] border border-[rgba(255,255,255,0.18)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-[#8B9CBB] hover:text-white text-lg font-bold transition-colors"
        >
          ✕
        </button>

        <div className="p-6 pb-2">
          <h2 className="text-xl font-display font-extrabold text-[#F0F4FF]">
            {account ? 'Modifier le Compte.' : 'Nouveau Compte.'}
          </h2>
          <p className="text-[11px] text-[#8B9CBB] mt-1">
            {account ? 'Ajustez les informations de ce compte de trésorerie.' : 'Ajoutez un nouveau compte ou coffre pour suivre vos mouvements de fonds.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Nom du Compte *
            </label>
            <input
              required
              type="text"
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="Ex: CCP Samir, Payoneer NJ..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
                Type
              </label>
              <select
                className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] focus:border-[#3B82F6]/60 transition-all focus:outline-none appearance-none"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              >
                <option value="CASH" className="bg-[#080C14]">ESPÈCES</option>
                <option value="BANK" className="bg-[#080C14]">BANQUE / CCP</option>
                <option value="PAYONEER" className="bg-[#080C14]">PAYONEER</option>
                <option value="REDOTPAY" className="bg-[#080C14]">REDOTPAY</option>
                <option value="PAYPAL" className="bg-[#080C14]">PAYPAL</option>
                <option value="WISE" className="bg-[#080C14]">WISE</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
                Devise
              </label>
              <select
                className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] focus:border-[#3B82F6]/60 transition-all focus:outline-none appearance-none"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="DZD" className="bg-[#080C14]">DZD</option>
                <option value="USD" className="bg-[#080C14]">USD</option>
                <option value="EUR" className="bg-[#080C14]">EUR</option>
                <option value="USDT" className="bg-[#080C14]">USDT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Solde Initial *
            </label>
            <input
              required
              type="number"
              step="0.01"
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="0.00"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
            />
            <p className="text-[9px] text-[#8B9CBB] mt-1.5 leading-relaxed">C'est le montant présent sur le compte au moment de sa création.</p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-[rgba(255,255,255,0.08)] bg-[#080C14] text-[#3B82F6] focus:ring-[#3B82F6]/50"
            />
            <label htmlFor="is_active" className="text-xs text-[#8B9CBB] select-none cursor-pointer">Compte actif</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#8B9CBB] rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? "Chargement..." : account ? "Enregistrer" : "Créer le Compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
