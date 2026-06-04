'use client';

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("farouk@gmail.com");
  const [password, setPassword] = useState("farouk33");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Auto-setup admin account on first visit
  useEffect(() => {
    const runSetup = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : '/_/backend/api/v1');
        await fetch(`${apiBase}/auth/setup-admin`, { method: 'POST' });
        setSetupDone(true);
      } catch {
        // Backend may not be running, continue anyway
        setSetupDone(true);
      }
    };
    runSetup();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect. Essayez : farouk@gmail.com / farouk33");
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Erreur de connexion. Vérifiez que le serveur backend est démarré.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C14] text-white p-4">
      <div className="max-w-md w-full space-y-8 bg-[#141E2E] p-10 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)]">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#3B82F6] flex items-center justify-center font-bold text-white text-3xl shadow-[0_0_24px_rgba(59,130,246,0.5)]">
            F
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F0F4FF]">NAJMO ERP</h2>
          <p className="mt-2 text-sm text-[#8B9CBB]">
            Système de Gestion Financière Multi-devises
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#8B9CBB] uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.1)] focus:border-[#3B82F6] text-[#F0F4FF] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              placeholder="farouk@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B9CBB] uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#080C14] border border-[rgba(255,255,255,0.1)] focus:border-[#3B82F6] text-[#F0F4FF] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-bold rounded-xl shadow-[0_0_16px_rgba(59,130,246,0.4)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Credentials hint */}
        <div className="mt-4 p-4 bg-[#080C14] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-[#4A5878]">
          <p className="font-bold text-[#8B9CBB] mb-1">🔑 Accès par défaut :</p>
          <p>Email : <span className="text-[#3B82F6] font-mono">farouk@gmail.com</span></p>
          <p>Mot de passe : <span className="text-[#3B82F6] font-mono">farouk33</span></p>
        </div>
      </div>
    </div>
  );
}
