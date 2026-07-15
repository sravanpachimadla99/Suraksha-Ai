import { useState } from 'react';
import { Send, MapPin } from 'lucide-react';

export default function ComplaintForm({ onSubmit, loading }: { onSubmit: (data: any) => void, loading: boolean }) {
  const [fraudType, setFraudType] = useState('UPI Fraud');
  const [description, setDescription] = useState('');

  const fraudTypes = [
    "Digital Arrest", "UPI Fraud", "OTP Scam", "Voice Scam", 
    "Website Fraud", "QR Fraud", "Counterfeit Currency", 
    "Investment Scam", "Identity Theft"
  ];

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-2">Report an Incident</h2>
      <p className="text-sm text-slate-400 mb-6">Please provide as much detail as possible. The AI will extract relevant entities automatically.</p>
      
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ fraudType, description }); }} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Type of Fraud</label>
          <select 
            value={fraudType} 
            onChange={(e) => setFraudType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {fraudTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Incident Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            placeholder="E.g., I received a call from +91 9876543210 asking for OTP. I shared it and lost money via scammer@ybl..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800 rounded-lg text-slate-300"><MapPin size={18}/></div>
             <div>
                <div className="text-sm font-medium text-white">Location Services</div>
                <div className="text-xs text-slate-500">Attach GPS coordinates to this report.</div>
             </div>
          </div>
          <button type="button" className="text-indigo-400 text-sm font-medium hover:text-indigo-300">Detect Location</button>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading || !description}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Processing...' : 'Submit Details & Continue'} <Send size={18} />
          </button>
        </div>

      </form>
    </div>
  );
}
