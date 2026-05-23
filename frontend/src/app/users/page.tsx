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
  const isAdmin = userRoles.some((r: string) => ['ADMIN', 'ADMINISTRATEUR'].includes(r));

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-rose-400 mb-4">Accès Refusé</h1>
        <p className="text-slate-400">Seul l'administrateur peut accéder à cette page.</p>
        <a href="/" className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors">
          Retour au tableau de bord
        </a>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestion des Utilisateurs</h1>
            <p className="text-slate-400 mt-1">Gérez les accès employés et comptables</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <span>+</span> Ajouter un utilisateur
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Nom Complet</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date de Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Chargement des utilisateurs...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">{user.full_name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          user.role === 'Administrateur' 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : user.role === 'Comptable'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs font-medium border border-rose-500/20">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(userIdToIdString(user.id), user.full_name)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer l'utilisateur"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
