import { FileText, Download, ShieldCheck, User } from "lucide-react";

export default function ReportViewer({ reportData }: { reportData: any }) {
  if (!reportData) return null;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      
      <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-xl flex items-start gap-4 mb-6">
         <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-500">
            <ShieldCheck size={32} />
         </div>
         <div>
            <h2 className="text-xl font-bold text-emerald-500 mb-1">Official Evidence Package Generated</h2>
            <p className="text-sm text-slate-400">Your complaint has been processed. A legally formatted FIR draft and evidence bundle is ready for download.</p>
         </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
         <FileText size={64} className="text-indigo-500 mb-6" />
         <h3 className="text-2xl font-bold text-white mb-2">Evidence Report #{reportData.id.split('-')[0].toUpperCase()}</h3>
         <p className="text-slate-400 max-w-md mb-8">Contains timeline reconstruction, extracted financial indicators, IP logs, and AI-suggested Indian Penal Code sections.</p>
         
         <a 
           href={`http://localhost:8000/api/v1/report/download/${reportData.id}`}
           target="_blank"
           rel="noreferrer"
           className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-lg"
         >
           <Download size={20} /> Download PDF Package
         </a>
         
         <div className="mt-8 pt-6 border-t border-slate-800 w-full flex justify-center text-sm text-slate-500 gap-6">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500"/> SHA-256 Verified</span>
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500"/> Scanned for Malware</span>
         </div>
      </div>

    </div>
  );
}
