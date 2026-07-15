"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import ComplaintForm from "./components/ComplaintForm";
import EvidenceUpload from "./components/EvidenceUpload";
import TimelineViewer from "./components/TimelineViewer";
import ReportViewer from "./components/ReportViewer";

export default function EmergencyReportingPage() {
  const [step, setStep] = useState(1);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/report/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "citizen_123",
          fraud_type: data.fraudType,
          description: data.description,
          location_data: { city: "New Delhi" }
        })
      });
      if (res.ok) {
        const result = await res.json();
        setReportData(result);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceComplete = () => {
    setStep(3);
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
       await fetch(`http://localhost:8000/api/v1/report/generate?report_id=${reportData.id}`, { method: "POST" });
       setStep(4);
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="bg-red-950/40 border-b border-red-900/50 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-red-500/20 text-red-500 rounded-lg animate-pulse">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-red-500">Emergency Cyber Reporting</h1>
            <p className="text-sm text-slate-400">Rapid Incident Response & Evidence Generation</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 flex gap-6">
        
        {/* Progress Sidebar */}
        <div className="w-64 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Filing Progress</div>
            <ul className="space-y-4">
              <li className={`flex items-center gap-3 text-sm ${step >= 1 ? 'text-indigo-400 font-medium' : 'text-slate-500'}`}>
                {step > 1 ? <CheckCircle2 size={16}/> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>}
                Incident Details
              </li>
              <li className={`flex items-center gap-3 text-sm ${step >= 2 ? 'text-indigo-400 font-medium' : 'text-slate-500'}`}>
                {step > 2 ? <CheckCircle2 size={16}/> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>}
                Upload Evidence
              </li>
              <li className={`flex items-center gap-3 text-sm ${step >= 3 ? 'text-indigo-400 font-medium' : 'text-slate-500'}`}>
                {step > 3 ? <CheckCircle2 size={16}/> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>}
                AI Analysis & Timeline
              </li>
              <li className={`flex items-center gap-3 text-sm ${step >= 4 ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                {step > 4 ? <CheckCircle2 size={16}/> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>}
                Official FIR Draft
              </li>
            </ul>
          </div>

          <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl">
             <div className="flex items-start gap-2 text-amber-500">
                <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
                <p className="text-xs leading-relaxed">
                   Filing a false report is a punishable offense under Section 182 of the Indian Penal Code.
                </p>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 min-h-[600px]">
          
          {step === 1 && (
            <ComplaintForm onSubmit={handleFormSubmit} loading={loading} />
          )}

          {step === 2 && (
            <div className="h-full flex flex-col">
               <h2 className="text-xl font-bold text-white mb-4">Attach Evidence</h2>
               <p className="text-sm text-slate-400 mb-6">Upload screenshots, transaction receipts, or audio recordings. Our AI will automatically extract entities from them.</p>
               <EvidenceUpload reportId={reportData?.id} onComplete={handleEvidenceComplete} />
            </div>
          )}

          {step === 3 && (
            <div className="h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Reconstruction</h2>
                    <p className="text-sm text-slate-400">We have extracted key entities and built a timeline.</p>
                  </div>
                  <button onClick={generatePDF} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                     {loading ? 'Generating...' : 'Generate Legal Draft'}
                  </button>
               </div>
               <TimelineViewer reportData={reportData} />
            </div>
          )}

          {step === 4 && (
             <ReportViewer reportData={reportData} />
          )}

        </div>
      </div>
    </div>
  );
}
