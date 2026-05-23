import React, { useState, useEffect } from 'react';

export default function AddPaymentModal({ isOpen, onClose, invoice, accessToken, onSuccess }: { isOpen: boolean, onClose: () => void, invoice: any, accessToken: string, onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default amount to remaining amount
      if (invoice?.remaining_amount) {
        setAmount(invoice.remaining_amount.toString());
      }
      // Pre-select payment method from invoice
      if (invoice?.payment_method) {
        setPaymentMethod(invoice.payment_method);
      }
      // Fetch accounts
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(res => res.json())
      .then(data => setAccounts(data))
      .catch(err => console.error(err));
    }
  }, [isOpen, invoice, accessToken]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      alert("Veuillez sélectionner un compte de réception.");
      return;
    }
    if (parseFloat(amount) > parseFloat(invoice.remaining_amount) + 0.01) {
      alert("Le montant saisi est supérieur au reste à payer.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          invoice_id: invoice.id.toString(),
          account_id: accountId,
          amount: amount,
          currency: invoice.currency,
          payment_method: paymentMethod,
          reference_number: reference,
          notes: notes,
          payment_date: paymentDate
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
        // Reset form
        setAmount('');
        setAccountId('');
        setReference('');
        setNotes('');
      } else {
        const errText = await res.text();
        alert(`Erreur: ${errText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'enregistrement du paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Enregistrer un paiement</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
            <p className="text-sm text-slate-400">Reste à payer sur {invoice.invoice_number}</p>
            <p className="text-2xl font-bold text-rose-500">{Number(invoice.remaining_amount).toLocaleString('fr-FR')} {invoice.currency}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Montant du paiement *</label>
            <input required type="number" step="0.01" max={invoice.remaining_amount} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Compte de réception (Caisse) *</label>
            <select required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">Sélectionner un compte</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Méthode *</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="CASH">Espèces</option>
                <option value="CCP">CCP / BaridiMob</option>
                <option value="BANK_TRANSFER">Virement Bancaire</option>
                <option value="PAYONEER">Payoneer</option>
                <option value="PAYPAL">PayPal</option>
                <option value="REDOTPAY">Redotpay</option>
                <option value="CRYPTO">Crypto (USDT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date *</label>
              <input required type="datetime-local" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Référence (Optionnel)</label>
            <input type="text" placeholder="Ex: N° de transaction BaridiMob" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" value={reference} onChange={e => setReference(e.target.value)} />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
