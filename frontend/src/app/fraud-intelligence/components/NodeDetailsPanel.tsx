import { X, User, Phone, ShieldAlert, Activity, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NodeDetailsPanelProps {
  node: any;
  onClose: () => void;
}

export default function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  const { data } = node;
  
  const isHighRisk = data.risk_score > 0.7;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2 text-white">
          <User size={18} className="text-indigo-400" />
          Node Details
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md transition-colors">
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Header section */}
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            {data.type}
          </div>
          <div className="text-xl font-bold text-white break-all">
            {data.label}
          </div>
        </div>

        {/* Risk Score */}
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${isHighRisk ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className={`p-2 rounded-md ${isHighRisk ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Threat Level</div>
            <div className={`text-2xl font-bold ${isHighRisk ? 'text-red-500' : 'text-emerald-500'}`}>
              {(data.risk_score * 100).toFixed(0)} / 100
            </div>
            {isHighRisk && (
              <div className="text-xs text-red-400 mt-1">
                Known offender or heavily linked to mule networks.
              </div>
            )}
          </div>
        </div>

        {/* Properties List */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Activity size={16} />
            Properties
          </h3>
          <div className="space-y-2">
            {Object.entries(data.properties || {}).map(([key, value]: [string, any]) => (
              <div key={key} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="text-xs text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                <span className="text-sm text-slate-200 break-all">{String(value)}</span>
              </div>
            ))}
            {Object.keys(data.properties || {}).length === 0 && (
              <div className="text-sm text-slate-500 italic">No properties available.</div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <GitBranch size={16} />
            Actions
          </h3>
          <div className="flex flex-col gap-2">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Find Shortest Path to High-Risk
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              Expand Sub-Network
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
