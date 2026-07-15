import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function BlacklistManager({ onAddAccount }: { onAddAccount: (data: any) => void }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('SBI');
  const [holderName, setHolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber && holderName) {
      onAddAccount({ account_number: accountNumber, bank_name: bankName, holder_name: holderName });
      setAccountNumber('');
      setHolderName('');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Flag Suspicious Account</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
         <div>
            <label className="block text-xs text-slate-500 mb-1">Account Number</label>
            <input 
              type="text" 
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
              placeholder="e.g. 1234567890"
            />
         </div>
         <div>
            <label className="block text-xs text-slate-500 mb-1">Bank Name</label>
            <select 
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
               <option value="SBI">State Bank of India</option>
               <option value="HDFC">HDFC Bank</option>
               <option value="ICICI">ICICI Bank</option>
            </select>
         </div>
         <div>
            <label className="block text-xs text-slate-500 mb-1">Holder Name</label>
            <input 
              type="text" 
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
              placeholder="Holder Name"
            />
         </div>
         <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1">
            <Plus size={14}/> Add to Blacklist
         </button>
      </form>
    </div>
  );
}
