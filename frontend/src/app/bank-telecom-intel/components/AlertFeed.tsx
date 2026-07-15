import { Bell, AlertCircle } from 'lucide-react';

export default function AlertFeed({ alerts }: { alerts: any[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
        <Bell size={16} className="text-indigo-400" />
        Real-Time Intelligence Feed
      </h3>
      <div className="space-y-3">
         {alerts.map((al, idx) => (
            <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex gap-3 items-start">
               <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
               <div>
                  <div className="text-sm font-semibold text-white">{al.alert_type}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{al.description}</div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
