import { Bell, AlertTriangle } from 'lucide-react';

export default function AlertCards({ alerts }: { alerts: any[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
       <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
          <Bell size={16} className="text-indigo-400" />
          Proactive Warning Signals
       </h3>
       <div className="space-y-3">
          {alerts.map((al, idx) => (
             <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                   <h4 className="text-sm font-bold text-white">{al.alert_type}</h4>
                   <p className="text-xs text-slate-400 mt-1 leading-relaxed">{al.description}</p>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}
