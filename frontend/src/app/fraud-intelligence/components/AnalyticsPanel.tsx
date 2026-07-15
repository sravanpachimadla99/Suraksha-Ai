import { Activity, ShieldAlert, GitMerge, TrendingUp, Users } from "lucide-react";

export default function AnalyticsPanel({ nodes, edges }: { nodes: any[], edges: any[] }) {
  const highRiskNodes = nodes.filter(n => (n.data?.risk_score || 0) > 0.7);
  const avgRisk = nodes.length > 0 
    ? nodes.reduce((acc, n) => acc + (n.data?.risk_score || 0), 0) / nodes.length 
    : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-semibold flex items-center gap-2 text-white">
          <Activity size={18} className="text-indigo-400" />
          Network Analytics
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Top-level stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
            <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Total Nodes</div>
            <div className="text-2xl font-bold text-white">{nodes.length}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
            <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Connections</div>
            <div className="text-2xl font-bold text-white">{edges.length}</div>
          </div>
        </div>

        {/* Threat Summary */}
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
            <ShieldAlert size={16} />
            High-Risk Entities
          </h3>
          <div className="text-3xl font-bold text-red-500 mb-1">{highRiskNodes.length}</div>
          <p className="text-xs text-red-400/80">Nodes identified with critical threat levels requiring immediate attention.</p>
        </div>

        {/* Network Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Graph Metrics
          </h3>
          <div className="space-y-3">
            
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-slate-300">Avg Risk Score</div>
                <div className="text-xs text-slate-500">Across entire network</div>
              </div>
              <div className="text-lg font-bold text-indigo-400">
                {(avgRisk * 100).toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-slate-300">Density</div>
                <div className="text-xs text-slate-500">Network cohesion</div>
              </div>
              <div className="text-lg font-bold text-emerald-400">
                {nodes.length > 1 ? (edges.length / (nodes.length * (nodes.length - 1))).toFixed(2) : '0.00'}
              </div>
            </div>

          </div>
        </div>

        {/* Detected Clusters */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Users size={16} />
            Detected Clusters (AI)
          </h3>
          <div className="space-y-2">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-white">Mule Account Ring A</div>
                <div className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Critical</div>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <GitMerge size={12} /> 5 Nodes connected
              </div>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-white">Device Farm 01</div>
                <div className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">High</div>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <GitMerge size={12} /> 12 Shared IMEIs
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
