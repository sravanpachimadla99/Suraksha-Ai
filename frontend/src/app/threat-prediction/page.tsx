"use client";

import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, Cpu, Globe, RefreshCw } from "lucide-react";
import ForecastChart from "./components/ForecastChart";
import AlertCards from "./components/AlertCards";

export default function ThreatPredictionPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("XGBoost Classifier");
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const [predRes, alertRes, modelRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/prediction/current"),
        fetch("http://localhost:8000/api/v1/prediction/alerts"),
        fetch("http://localhost:8000/api/v1/prediction/models")
      ]);
      if (predRes.ok) setPredictions(await predRes.json());
      if (alertRes.ok) setAlerts(await alertRes.json());
      if (modelRes.ok) setModels(await modelRes.json());
    } catch (err) {
      console.error(err);
      // Fallback mocks
      setPredictions([
        { id: "1", category: "UPI", predicted_threat: "High Volume UPI Scam Wave", confidence: 0.88, probability: 0.82, affected_regions: ["NCR Delhi"], expected_time_window: "Next 72 Hours", severity: "HIGH", recommended_preventive_actions: ["SMS template warnings"] }
      ]);
      setAlerts([
        { id: "al1", alert_type: "New Scam Campaign", description: "High volume of Digital Arrest scams reported", severity: "HIGH" }
      ]);
      setModels([
        { name: "XGBoost Classifier", framework: "XGBoost", is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const triggerForecastRun = async (category: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/prediction/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, model_name: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Threat Prediction Dashboard</h1>
            <p className="text-sm text-slate-400">Forecasting & Proactive Early Warning System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <select 
             value={selectedModel}
             onChange={(e) => setSelectedModel(e.target.value)}
             className="bg-slate-950 border border-slate-800 text-xs rounded px-3 py-2 text-white focus:outline-none"
           >
              {models.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
           </select>
           
           <button 
             onClick={fetchPredictions}
             className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 p-2 rounded-lg transition-all"
           >
              <RefreshCw size={16} />
           </button>
        </div>
      </header>

      {/* Workspace Content */}
      <div className="flex-1 max-w-7xl mx-auto p-6 w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Left/Middle: Predictions & Forecasting Charts */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Forecast Chart Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
               <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-400"/>
                  Fraud Growth Trend Analysis
               </h2>
               <ForecastChart />
            </div>

            {/* Run Forecast Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
               <h3 className="text-sm font-semibold text-slate-300 mb-4">Proactive Incident Forecast Simulator</h3>
               <div className="flex flex-wrap gap-3">
                  {["UPI", "Voice", "QR", "Phishing", "Currency"].map((cat) => (
                     <button 
                       key={cat} 
                       onClick={() => triggerForecastRun(cat)}
                       className="bg-slate-950 border border-slate-700 hover:border-indigo-500 hover:bg-slate-900 px-4 py-2.5 rounded-lg text-sm transition-all"
                     >
                       Forecast {cat} Threats
                     </button>
                  ))}
               </div>
            </div>

            {/* Current Active Forecast Queue */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
               <h2 className="text-lg font-bold text-white mb-4">Active Threat Forecasts</h2>
               <div className="space-y-4">
                  {predictions.map((p, idx) => (
                     <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                                 {p.severity}
                              </span>
                              <h3 className="text-sm font-semibold text-white">{p.predicted_threat}</h3>
                           </div>
                           <p className="text-xs text-slate-500 mt-2">
                              Affected Regions: {p.affected_regions.join(", ")} | Window: {p.expected_time_window}
                           </p>
                           <div className="mt-3">
                              <div className="text-xs font-semibold text-slate-400">Recommended Countermeasures:</div>
                              <ul className="list-disc pl-4 text-xs text-slate-500 mt-1 space-y-1">
                                 {p.recommended_preventive_actions.map((act: string, i: number) => <li key={i}>{act}</li>)}
                              </ul>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-bold text-indigo-400">{(p.probability * 100).toFixed(0)}%</div>
                           <div className="text-[10px] uppercase text-slate-500">Confidence</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

         </div>

         {/* Right Sidebar: Warning Center Alerts */}
         <div className="space-y-6">
            <AlertCards alerts={alerts} />
            
            {/* Risk Region Watchlist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
               <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-indigo-400" />
                  Regional Hotspot Watchlist
               </h3>
               <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex justify-between border-b border-slate-800 pb-2">
                     <span>Mewat District</span> <span className="text-red-500 font-bold">CRITICAL</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-2">
                     <span>Jamtara</span> <span className="text-red-500 font-bold">CRITICAL</span>
                  </li>
                  <li className="flex justify-between pb-2">
                     <span>NCR Delhi</span> <span className="text-amber-500 font-bold">ELEVATED</span>
                  </li>
               </ul>
            </div>
         </div>

      </div>
    </div>
  );
}
