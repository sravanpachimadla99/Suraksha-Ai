import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';

export default function EvidenceUpload({ reportId, onComplete }: { reportId: string, onComplete: () => void }) {
  const [files, setFiles] = useState<{name: string, status: string}[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(prev => [...prev, { name: file.name, status: 'Uploading...' }]);
      
      // Mock upload process
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        await fetch(`http://localhost:8000/api/v1/report/upload?report_id=${reportId}`, {
          method: 'POST',
          body: formData
        });
        
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'Secured (SHA-256)' } : f));
      } catch (err) {
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'Failed' } : f));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      
      <div 
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/50 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors"
      >
         <UploadCloud size={48} className="text-slate-500 mb-4" />
         <div className="text-lg font-medium text-white mb-1">Click or drag to upload evidence</div>
         <div className="text-sm text-slate-500">Supports JPG, PNG, PDF, MP3 (Max 50MB)</div>
         <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />
      </div>

      <div className="flex-1">
         <h3 className="text-sm font-semibold text-slate-300 mb-3">Attached Files ({files.length})</h3>
         <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <FileIcon size={18} className="text-indigo-400" />
                    <span className="text-sm text-slate-200">{f.name}</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs">
                    {f.status === 'Uploading...' ? (
                       <span className="text-amber-500 flex items-center gap-1">Uploading...</span>
                    ) : (
                       <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={12}/> {f.status}</span>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
         <button onClick={onComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Continue to Analysis
         </button>
      </div>
    </div>
  );
}
