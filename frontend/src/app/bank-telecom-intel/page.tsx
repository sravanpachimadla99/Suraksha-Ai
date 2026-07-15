"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Database, Users, Bell, Search, Settings } from "lucide-react";
import RiskCard from "./components/RiskCard";
import AlertFeed from "./components/AlertFeed";
import BlacklistManager from "./components/BlacklistManager";

export default function BankTelecomIntelPage() {
  const [role, setRole] = useState<string>("police"); // default role simulation
  const [accounts, setAccounts] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, numRes, alertRes, dashRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/bank/accounts"),
          fetch("http://localhost:8000/api/v1/telecom/numbers"),
          fetch("http://localhost:8000/api/v1/bank/alerts"),
          fetch("http://localhost:8000/api/v1/intelligence/dashboard")
        ]);
        
        if (accRes.ok) setAccounts(await accRes.json());
        if (numRes.ok) setNumbers(await numRes.json());
        if (alertRes.ok) setAlerts(await alertRes.json());
        if (dashRes.ok) setDashboardData(await dashRes.json());
      } catch (err) {
        console.error(err);
        // Load fallback mocks
        setAccounts([
          { id: "1", account_number: "1234567890", bank_name: "SBI", holder_name: "Mock Holder", risk_score: 0.85, status: "SUSPENDED" }
        ]);
        setNumbers([
          { id: "2", phone_number: "9876543210", carrier: "Jio", risk_score: 0.90, spam_reports: 15, status: "BLOCKED" }
        ]);
        setAlerts([
          { id: "3", alert_type: "Repeated Scam Number", description: "Phone reported by multiple users", risk_level: "HIGH" }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Bank & Telecom Intelligence Platform</h1>
            <p className="text-sm text-slate-400">Cross-Agency Financial & Network Fraud Shield</p>
          </div>
        </div>

        {/* Role Selector Simulator */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setRole("bank")} 
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${role === 'bank' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Bank Officer
          </button>
          <button 
            onClick={() => setRole("telecom")} 
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${role === 'telecom' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Telecom Officer
          </button>
          <button 
            onClick={() => setRole("police")} 
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${role === 'police' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Police (Admin)
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto p-6 w-full space-y-6">
        
        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
             <div className="text-xs font-bold text-slate-500 uppercase">Suspended Bank Accounts</div>
             <div className="text-2xl font-bold text-white mt-1">{accounts.filter(a => a.status === 'SUSPENDED').length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
             <div className="text-xs font-bold text-slate-500 uppercase">Blocked Scam Numbers</div>
             <div className="text-2xl font-bold text-white mt-1">{numbers.filter(n => n.status === 'BLOCKED').length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg col-span-2">
             <div className="text-xs font-bold text-slate-500 uppercase">Active Intelligence Alerts</div>
             <div className="text-2xl font-bold text-red-500 mt-1 flex items-center gap-2">
                <Bell size={20} className="animate-bounce" /> {alerts.length} High-Risk Detections
             </div>
          </div>
        </div>

        {/* Dashboard Panels depending on Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left/Middle Panels: Platform view depending on RBAC Role */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Bank view or Admin Police View */}
              {(role === 'bank' || role === 'police') && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-indigo-400"/>
                      Financial Fraud Investigation Queue
                   </h2>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                         <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                               <th className="pb-3">Account Number</th>
                               <th className="pb-3">Bank Name</th>
                               <th className="pb-3">Risk Score</th>
                               <th className="pb-3">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                            {accounts.map(acc => (
                               <tr key={acc.id} className="text-slate-300">
                                  <td className="py-3 font-mono">{acc.account_number}</td>
                                  <td className="py-3">{acc.bank_name}</td>
                                  <td className="py-3">
                                     <span className={`px-2 py-0.5 rounded text-xs ${acc.risk_score > 0.7 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {(acc.risk_score * 100).toFixed(0)}%
                                     </span>
                                  </td>
                                  <td className="py-3">{acc.status}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {/* Telecom view or Admin Police View */}
              {(role === 'telecom' || role === 'police') && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Settings size={20} className="text-indigo-400"/>
                      Telecom Scam Caller Analytics
                   </h2>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                         <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                               <th className="pb-3">Phone Number</th>
                               <th className="pb-3">Carrier</th>
                               <th className="pb-3">Spam Reports</th>
                               <th className="pb-3">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                            {numbers.map(num => (
                               <tr key={num.id} className="text-slate-300">
                                  <td className="py-3 font-mono">{num.phone_number}</td>
                                  <td className="py-3">{num.carrier}</td>
                                  <td className="py-3 font-bold">{num.spam_reports}</td>
                                  <td className="py-3">{num.status}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}
           </div>

           {/* Right Panel: Alerts & Blacklist Manager */}
           <div className="space-y-6">
              <AlertFeed alerts={alerts} />
              {role === 'police' && (
                <BlacklistManager 
                  onAddAccount={async (data) => {
                     const res = await fetch("http://localhost:8000/api/v1/bank/report-account", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({...data, risk_score: 0.99})
                     });
                     if (res.ok) {
                        const newAcc = await res.json();
                        setAccounts(prev => [...prev, newAcc]);
                     }
                  }}
                />
              )}
           </div>

        </div>

      </div>
    </div>
  );
}
