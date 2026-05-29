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
            {clientData ? `Modifier: ${clientData.full_name}` : "Nouveau Client."}
          </h2>
          <p className="text-[11px] text-[#8B9CBB] mt-1">
            {clientData ? "Modifiez les informations de facturation et de scoring." : "Renseignez les informations de facturation de votre nouveau tiers."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Nom Complet *
            </label>
            <input
              required
              type="text"
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="ex: Samir Ben"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
                Téléphone
              </label>
              <input
                type="text"
                className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
                placeholder="05..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
                Type
              </label>
              <select
                disabled={isEmploye}
                className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] focus:border-[#3B82F6]/60 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                value={formData.client_type}
                onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
              >
                <option value="NORMAL" className="bg-[#080C14]">NORMAL</option>
                <option value="VIP" className="bg-[#080C14]">VIP</option>
                <option value="RISK" className="bg-[#080C14]">RISK</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="client@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Adresse
            </label>
            <input
              type="text"
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="Adresse complète"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Notes
            </label>
            <textarea
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none h-20 resize-none"
              placeholder="Commentaires particuliers..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
