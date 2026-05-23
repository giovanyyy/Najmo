"use client";

import { useState, useEffect } from "react";
import ClientModal from "./CreateClientModal";

export default function CreateOperationModal({ isOpen, onClose, accessToken, onSuccess }: { isOpen: boolean, onClose: () => void, accessToken: string, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    client_id: "",
    product_id: "",
    source_account_id: "",
    destination_account_id: "",
    operation_type: "SALE",
    currency: "", // Nouveau champ pour le filtrage intelligent
    amount_dzd: "",
    amount_currency: "",
    operation_cost: "",
    profit: "",
    notes: "",
    operation_date: new Date().toISOString().slice(0, 16), // Format YYYY-MM-DDThh:mm
  });
  const [paymentDelay, setPaymentDelay] = useState("30");
  const [file, setFile] = useState<File | null>(null);

  // State pour gérer l'ouverture du modal de création client
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Calcul automatique du bénéfice
  useEffect(() => {
    if (formData.operation_type === 'SALE') {
      const montant = parseFloat(formData.amount_dzd) || 0;
      const cout = parseFloat(formData.operation_cost) || 0;
      setFormData(prev => ({ ...prev, profit: (montant - cout).toString() }));
    } else {
      setFormData(prev => ({ ...prev, profit: "0" }));
    }
  }, [formData.amount_dzd, formData.operation_cost, formData.operation_type]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsRes, productsRes, accountsRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, { headers: { Authorization: `Bearer ${accessToken}` } }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers: { Authorization: `Bearer ${accessToken}` } }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, { headers: { Authorization: `Bearer ${accessToken}` } })
          ]);
          if (clientsRes.ok) setClients(await clientsRes.json());
          if (productsRes.ok) setProducts(await productsRes.json());
          if (accountsRes.ok) {
            setAccounts(await accountsRes.json());
          }
        } catch (error) {
          console.error("Error fetching modal data:", error);
        }
      };
      fetchData();
    }
  }, [isOpen, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.client_id) {
        alert("Veuillez sélectionner ou créer un client.");
        setLoading(false);
        return;
      }

      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'notes' && formData.operation_type === 'SALE' && formData.source_account_id === "" && paymentDelay) {
          submitData.append(key, `${value} [DUE:${paymentDelay}]`.trim());
        } else {
          submitData.append(key, value as string);
        }
      });
      if (file) {
        submitData.append('attachment', file);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/operations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }, // Ne pas mettre Content-Type pour FormData (le navigateur gère le boundary)
        body: submitData
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.text();
        alert(`Erreur: ${err}`);
      }
    } catch (error) {
      console.error("Error saving operation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientCreated = async (newClient?: any) => {
    try {
      // Re-fetch la liste complète des clients pour inclure le nouveau
      const clientsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      });
      if (clientsRes.ok) {
        const updatedClients = await clientsRes.json();
        setClients(updatedClients);
        
        // Sélectionner automatiquement le client nouvellement créé !
        if (newClient && newClient.id) {
          const cleanId = newClient.id.toString().replace('n', '');
          setFormData(prev => ({ ...prev, client_id: cleanId }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch clients after creation", error);
    }
  };

  const selectedProduct = formData.product_id 
    ? products.find((p: any) => p.id.toString().replace('n', '') === formData.product_id.toString().replace('n', ''))
    : null;

  // Filtrage intelligent par Produit ET Devise
  const sourceAccounts = accounts.filter((acc: any) => {
    // 1. Currency filter (Flexible: USD matches USDT)
    if (formData.currency) {
      const isMatch = acc.currency === formData.currency || 
                     (formData.currency === 'USD' && acc.currency === 'USDT') ||
                     (formData.currency === 'USDT' && acc.currency === 'USD');
      if (!isMatch) return false;
    }
    
    // 2. Product compatibility filter
    if (selectedProduct) {
      const comp = (selectedProduct.product_account_compatibility || []).find(
        (c: any) => c.account_id.toString().replace('n', '') === acc.id.toString().replace('n', '')
      );
      return comp?.compatibility_type === 'SOURCE' || comp?.compatibility_type === 'BOTH';
    }
    return true;
  });

  const destinationAccounts = accounts.filter((acc: any) => {
    // 1. Currency filter (Flexible: USD matches USDT)
    if (formData.currency) {
      const isMatch = acc.currency === formData.currency || 
                     (formData.currency === 'USD' && acc.currency === 'USDT') ||
                     (formData.currency === 'USDT' && acc.currency === 'USD');
      if (!isMatch) return false;
    }

    // 2. Product compatibility filter
    if (selectedProduct) {
      const comp = (selectedProduct.product_account_compatibility || []).find(
        (c: any) => c.account_id.toString() === acc.id.toString()
      );
      return comp?.compatibility_type === 'DESTINATION' || comp?.compatibility_type === 'BOTH';
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Nouvelle Opération</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date de l'opération *</label>
              <input type="datetime-local" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={formData.operation_date} onChange={e => setFormData({...formData, operation_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Type *</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={formData.operation_type} onChange={e => setFormData({...formData, operation_type: e.target.value})}>
                <option value="SALE">VENTE</option>
                <option value="PURCHASE">ACHAT</option>
                <option value="EXPENSE">CHARGE</option>
                <option value="TRANSFER">VIREMENT INTERNE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Devise (Filtre intelligent)</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value, source_account_id: "", destination_account_id: ""})}>
              <option value="">Toutes les devises</option>
              <option value="DZD">DZD (Dinars)</option>
              <option value="USD">USD (Dollars)</option>
              <option value="EUR">EUR (Euros)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Produit / Service *</label>
            <select required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value, source_account_id: "", destination_account_id: ""})}>
              <option value="">Sélectionner un produit</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {['SALE', 'TRANSFER'].includes(formData.operation_type) && (
              <div className={formData.operation_type === 'SALE' ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  {formData.operation_type === 'SALE' ? 'Compte de réception (Entrée)' : 'Source (Entrée)'} {formData.operation_type !== 'SALE' && '*'}
                </label>
                <select required={formData.operation_type !== 'SALE'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={formData.source_account_id} onChange={e => setFormData({...formData, source_account_id: e.target.value})}>
                  {formData.operation_type === 'SALE' ? (
                    <option value="">⏳ À crédit (Non payé)</option>
                  ) : (
                    <option value="">Choisir...</option>
                  )}
                  {sourceAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                  ))}
                </select>
              </div>
            )}
            
            {['PURCHASE', 'EXPENSE', 'TRANSFER'].includes(formData.operation_type) && (
              <div className={['PURCHASE', 'EXPENSE'].includes(formData.operation_type) ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  {['PURCHASE', 'EXPENSE'].includes(formData.operation_type) ? 'Compte de paiement (Sortie)' : 'Dest. (Sortie)'} *
                </label>
                <select required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={formData.destination_account_id} onChange={e => setFormData({...formData, destination_account_id: e.target.value})}>
                  <option value="">Choisir...</option>
                  {destinationAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Client *</label>
              <button 
                type="button" 
                onClick={() => setIsNewClientModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                + Nouveau Client
              </button>
            </div>
            <select required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
              <option value="">Sélectionner un client</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Montant (DZD) *</label>
              <input
                required
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="0.00"
                value={formData.amount_dzd}
                onChange={(e) => setFormData({ ...formData, amount_dzd: e.target.value })}
              />
            </div>
            {formData.currency && formData.currency !== 'DZD' && (
              <div>
                <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">Montant ({formData.currency}) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-800 border border-emerald-500/30 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                  value={formData.amount_currency}
                  onChange={(e) => setFormData({ ...formData, amount_currency: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Coût de l'opération (DZD)</label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="Ex: Prix d'achat"
                value={formData.operation_cost}
                onChange={(e) => setFormData({ ...formData, operation_cost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Profit (DZD) - Auto</label>
              <input
                type="number"
                readOnly
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 outline-none font-bold cursor-not-allowed ${Number(formData.profit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                placeholder="0.00"
                value={formData.profit}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notes</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="Détails supplémentaires..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          {formData.operation_type === 'SALE' && formData.source_account_id === "" && (
            <div>
              <label className="block text-xs font-semibold text-rose-400 uppercase mb-1">Délai de paiement (jours)</label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-rose-500/30 rounded-lg px-4 py-2 text-white outline-none focus:border-rose-500 transition-colors"
                placeholder="Ex: 30"
                value={paymentDelay}
                onChange={(e) => setPaymentDelay(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-1">La facture générée sera marquée comme en retard après ce délai.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Pièce jointe</label>
            <input
              type="file"
              className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-colors"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20">{loading ? "Enregistrement..." : "Créer l'opération"}</button>
          </div>
        </form>
      </div>

      <ClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        accessToken={accessToken}
        onSuccess={handleClientCreated}
      />
    </div>
  );
}
