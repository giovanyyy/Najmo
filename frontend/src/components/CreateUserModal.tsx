"use client";

import { useState } from "react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
}

export function CreateUserModal({ isOpen, onClose, onSuccess, accessToken }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "EMPLOYÉ",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur lors de la création de l'utilisateur");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#080C14]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2D47] border border-[rgba(255,255,255,0.18)] rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-[#8B9CBB] hover:text-white text-lg font-bold transition-colors"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-display font-extrabold text-[#F0F4FF]">
            Nouveau Collaborateur.
          </h2>
          <p className="text-[11px] text-[#8B9CBB] mt-1">
            Ajoutez un nouvel utilisateur et configurez ses habilitations.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Nom d'utilisateur (Login) *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="Ex: younes_admin"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Nom Complet *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="Ex: Younes Admin"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="Ex: younes@najmo.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Mot de passe *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] placeholder-[#4A5878] focus:border-[#3B82F6]/60 transition-all focus:outline-none"
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8B9CBB] mb-1.5 font-sans">
              Rôle *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-xs text-[#F0F4FF] focus:border-[#3B82F6]/60 transition-all focus:outline-none appearance-none font-sans"
            >
              <option value="EMPLOYÉ" className="bg-[#080C14]">Employé</option>
              <option value="COMPTABLE" className="bg-[#080C14]">Comptable</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {loading ? "Création..." : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
