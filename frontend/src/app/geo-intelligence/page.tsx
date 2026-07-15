"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, Filter, ShieldAlert, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import AnalyticsPanel from "./components/AnalyticsPanel";

// Leaflet requires window object, so we load it dynamically
const InteractiveMap = dynamic(() => import("./components/InteractiveMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-400">Loading Geospatial Engine...</p>
    </div>
  )
});

export default function GeoIntelligencePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: "", riskLevel: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.city) queryParams.append("city", filters.city);
      if (filters.riskLevel) queryParams.append("risk_level", filters.riskLevel);
      
      const [incidentRes, clusterRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/geo/incidents?${queryParams.toString()}`),
        fetch(`http://localhost:8000/api/v1/geo/clusters`)
      ]);
      
      if (incidentRes.ok) setIncidents(await incidentRes.json());
      if (clusterRes.ok) setClusters(await clusterRes.json());
    } catch (err) {
      console.error(err);
      // Mock data for display if backend is down
      setIncidents([
        { id: "1", latitude: 28.6139, longitude: 77.2090, risk_level: "HIGH", category: "Phishing", city: "New Delhi" },
        { id: "2", latitude: 19.0760, longitude: 72.8777, risk_level: "MEDIUM", category: "Mule", city: "Mumbai" }
      ]);
      setClusters([
        { cluster_id: 0, center_lat: 28.61, center_lng: 77.21, incident_count: 5, risk_score: 0.8 },
        { cluster_id: 1, center_lat: 19.08, center_lng: 72.88, incident_count: 3, risk_score: 0.6 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <MapPin size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Geospatial Crime Intelligence</h1>
              <p className="text-sm text-slate-400">Interactive Cybercrime Mapping & AI Clustering</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-all"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            >
              <option value="">All Cities</option>
              <option value="New Delhi">New Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
            </select>
            
            <select 
              className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-all"
              value={filters.riskLevel}
              onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
            >
              <option value="">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
            
            <button className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg text-white transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 flex p-4 gap-4 max-w-7xl mx-auto w-full">
        
        {/* Left: Map */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative z-0">
          <InteractiveMap incidents={incidents} clusters={clusters} />
        </div>

        {/* Right Sidebar: Analytics */}
        <div className="w-96 flex flex-col gap-4">
          <AnalyticsPanel incidents={incidents} clusters={clusters} />
        </div>

      </div>
    </div>
  );
}
