import { Activity, ShieldAlert, AlertTriangle, TrendingUp, Map } from "lucide-react";

export default function AnalyticsPanel({ incidents, clusters }: { incidents: any[], clusters: any[] }) {
  const highRisk = incidents.filter(i => i.risk_level === "HIGH").length;
  
  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 text-slate-200 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <h2 className="font-semibold flex items-center gap-2 text-white">
          <Activity size={18} className="text-indigo-400" />
          Spatial Analytics
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Top-level stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-inner">
            <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Total Incidents</div>
            <div className="text-2xl font-bold text-white">{incidents.length}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-inner">
            <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Active Hotspots</div>
            <div className="text-2xl font-bold text-white">{clusters.length}</div>
          </div>
        </div>

        {/* Threat Summary */}
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldAlert size={64}/></div>
          <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2 relative z-10">
            <ShieldAlert size={16} />
            High-Risk Incidents
          </h3>
          <div className="text-3xl font-bold text-red-500 mb-1 relative z-10">{highRisk}</div>
          <p className="text-xs text-red-400/80 relative z-10">Requires immediate attention from regional authorities.</p>
        </div>

        {/* Detected Clusters */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Map size={16} />
            AI Detected Hotspots
          </h3>
          <div className="space-y-3">
            {clusters.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No clusters detected in current view.</div>
            ) : (
              clusters.map((c, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center transition-colors hover:border-slate-600">
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      Cluster #{c.cluster_id}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {c.incident_count} linked incidents
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-500">{(c.risk_score * 100).toFixed(0)}%</div>
                    <div className="text-[10px] uppercase text-slate-500">Threat</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Weekly Trend */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Regional Trend
          </h3>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center justify-center h-32 relative">
             <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
             <p className="text-xs text-slate-500 relative z-10 text-center">
                +14% Incident rate in mapped region over the last 7 days.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
