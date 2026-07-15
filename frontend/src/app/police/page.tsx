"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getHotspots, getNetworkGraph, type Hotspot, type NetworkGraph } from "@/lib/api";

// ── Sidebar views ──
type View = "alerts" | "heatmap" | "network" | "analytics" | "cases";

// ── Alert type ──
interface AlertItem {
  id: number;
  type: string;
  location: string;
  risk: "High" | "Medium" | "Low";
  time: string;
  status: string;
}

const initialAlerts: AlertItem[] = [
  { id: 1, type: "Digital Arrest", location: "Sector 45, Gurgaon", risk: "High", time: "2m ago", status: "Active" },
  { id: 2, type: "Counterfeit Currency", location: "Main Market, Connaught Place", risk: "Medium", time: "15m ago", status: "Investigating" },
  { id: 3, type: "Phishing Campaign", location: "Cyber Hub, Hyderabad", risk: "High", time: "22m ago", status: "Active" },
  { id: 4, type: "UPI Fraud Ring", location: "MG Road, Bangalore", risk: "Low", time: "1h ago", status: "Resolved" },
];

const incomingAlerts: AlertItem[] = [
  { id: 100, type: "Deepfake Voice Scam", location: "Andheri, Mumbai", risk: "High", time: "Just now", status: "Active" },
  { id: 101, type: "Fake Customs Call", location: "Salt Lake, Kolkata", risk: "High", time: "Just now", status: "Active" },
  { id: 102, type: "Investment Scam", location: "Electronic City, Bangalore", risk: "Medium", time: "Just now", status: "Active" },
  { id: 103, type: "Loan App Harassment", location: "Miyapur, Hyderabad", risk: "Medium", time: "Just now", status: "Active" },
];

// ── Risk Color Utility ──
function riskColor(risk: string) {
  switch (risk) {
    case "High": return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500" };
    case "Medium": return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500" };
    default: return { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500" };
  }
}

// ── SVG Donut Chart Component ──
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        {data.map((d, i) => {
          const dashLength = (d.value / total) * circumference;
          const dashOffset = (cumulative / total) * circumference;
          cumulative += d.value;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="12"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
        })}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center" fill="white" fontSize="14" fontWeight="bold">
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-400">{d.label}</span>
            <span className="font-bold text-white ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Network Visualization (SVG) ──
function NetworkViz({ data }: { data: NetworkGraph }) {
  // Position nodes in a circle layout
  const cx = 140, cy = 100, r = 70;
  const nodes = data.nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / data.nodes.length - Math.PI / 2;
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const nodeColors: Record<number, string> = { 1: "#3b82f6", 2: "#ef4444", 3: "#f59e0b" };

  return (
    <svg viewBox="0 0 280 200" className="w-full h-full">
      {/* Links */}
      {data.links.map((link, i) => {
        const source = nodes.find((n) => n.id === link.source);
        const target = nodes.find((n) => n.id === link.target);
        if (!source || !target) return null;
        return (
          <g key={`link-${i}`}>
            <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 6} textAnchor="middle" fontSize="7" fill="#64748b">{link.value}</text>
          </g>
        );
      })}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <circle cx={n.x} cy={n.y} r="16" fill={nodeColors[n.group] || "#6366f1"} opacity="0.15" />
          <circle cx={n.x} cy={n.y} r="10" fill={nodeColors[n.group] || "#6366f1"} />
          <text x={n.x} y={n.y + 24} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="600">
            {n.label.length > 20 ? n.label.slice(0, 18) + "…" : n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function PoliceDashboard() {
  const [activeView, setActiveView] = useState<View>("alerts");
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [networkData, setNetworkData] = useState<NetworkGraph | null>(null);
  const [alertIdx, setAlertIdx] = useState(0);

  // Fetch backend data
  useEffect(() => {
    async function loadData() {
      const h = await getHotspots();
      if (h) setHotspots(h);
      const n = await getNetworkGraph();
      if (n) setNetworkData(n);
    }
    loadData();
  }, []);

  // Simulate live incoming alerts every 8 seconds
  const addAlert = useCallback(() => {
    setAlertIdx((prev) => {
      const next = prev % incomingAlerts.length;
      const newAlert = { ...incomingAlerts[next], id: Date.now(), time: "Just now" };
      setAlerts((a) => [newAlert, ...a.slice(0, 9)]);
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(addAlert, 8000);
    return () => clearInterval(interval);
  }, [addAlert]);

  // Stats
  const highCount = alerts.filter((a) => a.risk === "High").length;
  const medCount = alerts.filter((a) => a.risk === "Medium").length;
  const lowCount = alerts.filter((a) => a.risk === "Low").length;

  const sidebarItems: { id: string; icon: string; label: string; url?: string }[] = [
    { id: "alerts", icon: "🚨", label: "Live Alerts" },
    { id: "heatmap", icon: "🗺️", label: "Threat Map", url: "/geo-intelligence" },
    { id: "network", icon: "🕸️", label: "Network Graph", url: "/fraud-intelligence" },
    { id: "bank_telecom", icon: "🏦", label: "Shared Intel", url: "/bank-telecom-intel" },
    { id: "prediction", icon: "🔮", label: "Threat Predict", url: "/threat-prediction" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* ═══ Top Bar ═══ */}
      <header className="bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 shadow-lg shadow-blue-900/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]">S</div>
          </Link>
          <div>
            <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">SurakshaAI Command</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live System Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
            <span className="text-slate-500">Officer:</span>
            <span className="font-bold text-blue-400">Insp. Sharma</span>
            <div className="w-px h-3 bg-slate-700" />
            <span className="text-slate-500">Station:</span>
            <span className="font-bold text-white">HQ-01</span>
          </div>
          <Link href="/" className="text-xs text-slate-500 hover:text-white transition-colors font-medium">Exit ↗</Link>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-64 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

        {/* ═══ Sidebar ═══ */}
        <aside className="w-56 bg-[#0F172A]/50 backdrop-blur-md border-r border-slate-800/80 p-3 hidden md:flex flex-col z-10">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-3">Intelligence</div>
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.url ? window.location.href = item.url : setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${
                  activeView === item.id
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner font-semibold"
                    : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.id === "alerts" && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{alerts.length}</span>
                )}
              </button>
            ))}
          </nav>
          {/* Quick Info */}
          <div className="mt-auto p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-500">
            <div className="font-bold text-slate-400 mb-1">System Uptime</div>
            <div className="text-emerald-400 font-bold">99.97% — 14d 6h</div>
          </div>
        </aside>

        {/* ═══ Main Content ═══ */}
        <main className="flex-1 p-5 overflow-y-auto relative z-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Active Threats", value: highCount.toString(), color: "text-red-400", gradient: "from-red-500/10 to-transparent", icon: "🔴" },
                { label: "Prevented Today", value: "45", color: "text-emerald-400", gradient: "from-emerald-500/10 to-transparent", icon: "✅" },
                { label: "Mule Acc. Flagged", value: "8", color: "text-amber-400", gradient: "from-amber-500/10 to-transparent", icon: "🏦" },
                { label: "Units Dispatched", value: "3", color: "text-blue-400", gradient: "from-blue-500/10 to-transparent", icon: "🚔" },
              ].map((stat, i) => (
                <div key={i} className="relative overflow-hidden bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group">
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${stat.gradient} opacity-50`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                      <span className="text-lg">{stat.icon}</span>
                    </div>
                    <div className={`text-4xl font-black ${stat.color} animate-count-up`}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left Column: Alerts Feed */}
              <div className="col-span-1 lg:col-span-2 bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50">
                  <h2 className="font-bold text-white flex items-center gap-2 text-sm">
                    <span className="text-red-500">⚡</span> Real-Time Threat Feed
                    <span className="ml-2 bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full animate-pulse font-bold">{alerts.length} LIVE</span>
                  </h2>
                  <div className="flex gap-2">
                    <button className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">Filter</button>
                    <button className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30">Auto-Assign</button>
                  </div>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 max-h-[420px] scrollbar-hide">
                  {alerts.map((alert) => {
                    const rc = riskColor(alert.risk);
                    return (
                      <div key={alert.id} className="bg-slate-800/40 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all group animate-fade-in-up">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
                            <span className={`font-bold text-sm ${rc.text}`}>{alert.type}</span>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                              {alert.risk}
                            </span>
                            {alert.time === "Just now" && (
                              <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">NEW</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>📍 {alert.location}</span>
                            <span className="text-slate-700">•</span>
                            <span>⏱️ {alert.time}</span>
                          </div>
                        </div>
                        <button className="w-full sm:w-auto bg-slate-700 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors border border-slate-600 hover:border-blue-500 shadow-sm">
                          Investigate →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-1 flex flex-col gap-5">

                {/* Threat Breakdown Donut */}
                <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <h2 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                    <span className="text-amber-400">📊</span> Threat Breakdown
                  </h2>
                  <DonutChart
                    data={[
                      { label: "High Risk", value: highCount, color: "#ef4444" },
                      { label: "Medium Risk", value: medCount, color: "#f59e0b" },
                      { label: "Low Risk", value: lowCount, color: "#3b82f6" },
                    ]}
                  />
                </div>

                {/* Network Graph */}
                <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <h2 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                    <span className="text-indigo-400">🕸️</span> Fraud Network
                  </h2>
                  <div className="border border-slate-700/50 rounded-xl bg-slate-900/50 p-2 min-h-[200px] relative overflow-hidden">
                    {networkData ? (
                      <NetworkViz data={networkData} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px]">
                        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
                        <span className="text-xs text-slate-500">Loading Network Data...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Predictive Insight */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 backdrop-blur-md rounded-2xl border border-indigo-500/20 p-5 shadow-[0_0_30px_rgba(79,70,229,0.12)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-[50px]" />
                  <h3 className="font-bold text-white text-sm mb-2 relative z-10 flex justify-between items-center">
                    <span className="flex items-center gap-2">🧠 AI Prediction</span>
                    {hotspots.length > 0 && (
                      <span className="bg-red-500/20 text-red-400 text-[9px] px-2 py-0.5 rounded font-bold">{hotspots[0].category}</span>
                    )}
                  </h3>
                  <p className="text-xs text-indigo-200/70 relative z-10 leading-relaxed mb-3">
                    High probability of coordinated &quot;{hotspots.length > 0 ? hotspots[0].category : "Digital Arrest"}&quot; calls targeting citizens in the next 48 hours. Pattern matches intercepted SMS data.
                  </p>
                  {hotspots.length > 0 && (
                    <div className="flex gap-2 flex-wrap relative z-10 mb-3">
                      {hotspots.map((h, i) => (
                        <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                          {h.category} — {h.intensity * 100}% intensity
                        </span>
                      ))}
                    </div>
                  )}
                  <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold relative z-10 w-full shadow-lg shadow-indigo-500/20">
                    🚀 Deploy Preventive SMS Blast
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
