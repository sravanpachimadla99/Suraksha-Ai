"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Network, Search, AlertTriangle, Users, 
  Activity, Database, Server, Smartphone, 
  CreditCard, ShieldAlert, Eye, EyeOff
} from "lucide-react";
import NetworkGraph from "./components/NetworkGraph";
import NodeDetailsPanel from "./components/NodeDetailsPanel";
import AnalyticsPanel from "./components/AnalyticsPanel";

export default function FraudIntelligencePage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGraphData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/graph/network");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      
      const formattedNodes = data.nodes.map((n: any) => ({
        id: n.id,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        data: { 
          label: n.label, 
          type: n.type,
          risk_score: n.risk_score,
          properties: n.properties
        },
        type: "custom"
      }));

      const formattedEdges = data.links.map((l: any, idx: number) => ({
        id: `e-${idx}`,
        source: l.source,
        target: l.target,
        label: l.type,
        animated: l.type === "TRANSFERRED_TO",
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    } catch (err) {
      console.error(err);
      // Fallback dummy data if backend is down
      setNodes([
        { id: "1", position: { x: 200, y: 100 }, data: { label: "Victim A", type: "Person", risk_score: 0.1 }, type: "custom" },
        { id: "2", position: { x: 500, y: 100 }, data: { label: "Scammer", type: "Person", risk_score: 0.95 }, type: "custom" },
        { id: "3", position: { x: 350, y: 300 }, data: { label: "Mule Account", type: "Bank Account", risk_score: 0.8 }, type: "custom" },
      ]);
      setEdges([
        { id: "e1-2", source: "2", target: "1", label: "CONTACTED", animated: true },
        { id: "e1-3", source: "1", target: "3", label: "TRANSFERRED_TO", animated: true },
        { id: "e3-2", source: "3", target: "2", label: "OWNS", animated: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const handleNodeClick = (event: any, node: any) => {
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Network size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Fraud Network Intelligence</h1>
              <p className="text-sm text-slate-400">Graph AI Analysis & Community Detection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search nodes, entities..."
                className="bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 w-64 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Analytics */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
          <AnalyticsPanel nodes={nodes} edges={edges} />
        </div>

        {/* Center: Graph */}
        <div className="flex-1 relative bg-slate-950/50">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Initializing Graph Database...</p>
            </div>
          ) : (
            <NetworkGraph 
              initialNodes={nodes} 
              initialEdges={edges} 
              onNodeClick={handleNodeClick} 
            />
          )}
        </div>

        {/* Right Sidebar: Details */}
        {selectedNode && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
            <NodeDetailsPanel 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
