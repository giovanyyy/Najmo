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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{account ? 'Modifier le Compte' : 'Nouveau Compte'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nom du Compte *</label>
            <input
              required
              type="text"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="Ex: CCP Samir, Payoneer NJ..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Type</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              >
                <option value="CASH">ESPÈCES</option>
                <option value="BANK">BANQUE / CCP</option>
                <option value="PAYONEER">PAYONEER</option>
                <option value="REDOTPAY">REDOTPAY</option>
                <option value="PAYPAL">PAYPAL</option>
                <option value="WISE">WISE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Devise</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="DZD">DZD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Solde Initial *</label>
            <input
              required
              type="number"
              step="0.01"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="0.00"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
            />
            <p className="text-[10px] text-slate-500 mt-1">C'est le montant présent sur le compte au moment de sa création.</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-300">Compte actif</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Chargement..." : account ? "Enregistrer" : "Créer le Compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
