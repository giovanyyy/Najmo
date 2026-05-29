"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CreateUserModal } from "@/components/CreateUserModal";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const headers: Record<string, string> = {};
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      const res = await fetch(`${apiBase}/users`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${fullName}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });

      const data = await res.json();
      alert(data.message);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Une erreur est survenue lors de la suppression.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);


  const userRoles = ((session?.user as any)?.roles || []).map((r: string) => r.toUpperCase());
  const isAdmin = userRoles.some((r: string) => ['ADMIN', 'ADMINISTRATEUR'].includes(r));  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#080C14] min-h-[60vh]">
        <div className="bg-[#1E2D47] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8 max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-[#EF4444]/10 text-[#EF4444] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-[#EF4444]/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            ⚠️
          </div>
          <h1 className="text-xl font-display font-extrabold text-[#F0F4FF] mb-2">Accès Refusé.</h1>
          <p className="text-xs text-[#8B9CBB] leading-relaxed">
            Seuls les administrateurs disposent des privilèges requis pour accéder à la console de gestion des collaborateurs.
          </p>
          <a 
            href="/" 
            className="mt-6 inline-block w-full py-2.5 bg-transparent hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#8B9CBB] rounded-xl font-bold text-xs transition-all active:scale-95"
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#F0F4FF]">
              Gestion des Utilisateurs.
            </h1>
            <p className="text-xs text-[#8B9CBB] mt-1 font-medium">
              Gérez les accès, rôles et habilitations des employés et comptables de votre ERP.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all flex items-center gap-1.5"
          >
            <span>+</span> Ajouter un utilisateur
          </button>
        </div>

        <div className="bg-[#141E2E] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F0F4FF]">
              <thead className="bg-[#1A2540] border-b border-[rgba(255,255,255,0.06)] text-[10px] uppercase text-[#8B9CBB] font-extrabold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Nom Complet</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date de Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] bg-[#141E2E]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#8B9CBB] font-medium">
                      Chargement des collaborateurs...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#8B9CBB] font-medium">
                      Aucun collaborateur enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#1A2540]/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#F0F4FF]">{user.full_name}</td>
                      <td className="px-6 py-4 text-[#8B9CBB] font-mono">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
                          user.role === 'Administrateur' || user.role === 'ADMINISTRATEUR' || user.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : user.role === 'Comptable' || user.role === 'COMPTABLE'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-[#10B981]/20">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-[#EF4444]/20">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#8B9CBB]">
                        {new Date(user.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(userIdToIdString(user.id), user.full_name)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Supprimer l'utilisateur"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        accessToken={(session as any)?.accessToken || ""}
      />
    </main>
  );
}

// Convert BigInt IDs or string numbers into standard strings for API routing
function userIdToIdString(id: any): string {
  if (typeof id === 'bigint') {
    return id.toString();
  }
  return String(id);
}
