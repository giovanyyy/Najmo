"use client";

import { useState, useEffect } from "react";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onSuccess: (newClient?: any) => void;
  clientData?: any;
  userRoles?: string[]; // Nouveau: pour gérer les droits
}

export default function ClientModal({ isOpen, onClose, accessToken, onSuccess, clientData, userRoles = [] }: ClientModalProps) {
  const isEmploye = userRoles.includes("Employé") || userRoles.includes("EMPLOYEE");
  const isAdmin = userRoles.includes("Administrateur") || userRoles.includes("ADMIN");
  const isComptable = userRoles.includes("Comptable") || userRoles.includes("ACCOUNTANT");
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    client_type: "NORMAL",
    notes: "",
  });

  // Quand clientData change (clic sur modifier), on remplit le formulaire
  useEffect(() => {
    if (clientData) {
      setFormData({
        full_name: clientData.full_name || "",
        phone: clientData.phone || "",
        email: clientData.email || "",
        address: clientData.address || "",
        client_type: clientData.client_type || "NORMAL",
        notes: clientData.notes || "",
      });
    } else {
      setFormData({ full_name: "", phone: "", email: "", address: "", client_type: "NORMAL", notes: "" });
    }
  }, [clientData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!clientData;
    const url = isEdit 
      ? `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientData.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/clients`;
    
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(isEdit ? "✅ Client mis à jour !" : "✅ Client créé !");
        const createdClient = await res.json().catch(() => null);
        onSuccess(createdClient);
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Erreur inconnue" }));
        alert(`Erreur: ${errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {clientData ? `Modifier: ${clientData.full_name}` : "Nouveau Client"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nom Complet *</label>
            <input
              required
              type="text"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="ex: Samir Ben"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Téléphone</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="05..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Type</label>
              <select
                disabled={isEmploye}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.client_type}
                onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="VIP">VIP</option>
                <option value="RISK">RISK</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="client@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Adresse</label>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Adresse complète"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notes</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors h-20 resize-none"
              placeholder="Commentaires particuliers..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
