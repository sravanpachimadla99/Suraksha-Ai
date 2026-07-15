import { Clock, Fingerprint, MapPin, Target } from "lucide-react";

export default function TimelineViewer({ reportData }: { reportData: any }) {
  if (!reportData || !reportData.extracts) return null;
  const { entities, timeline } = reportData.extracts;

  return (
    <div className="flex gap-6 h-[calc(100%-80px)]">
      
      {/* Entities Extracted */}
      <div className="w-1/3 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
          <Fingerprint size={16} className="text-indigo-400" />
          Extracted IoCs (Indicators)
        </h3>
        <div className="space-y-4">
           {Object.keys(entities).map((type) => (
             <div key={type}>
                <div className="text-xs uppercase font-bold text-slate-500 mb-1">{type}</div>
                {entities[type].length > 0 ? entities[type].map((val: string, i: number) => (
                  <div key={i} className="bg-slate-900 border border-slate-700 p-2 rounded text-sm text-emerald-400 font-mono mb-1 select-all">
                    {val}
                  </div>
                )) : (
                  <div className="text-xs text-slate-600 italic">None detected</div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* AI Timeline */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-6">
          <Clock size={16} className="text-indigo-400" />
          Reconstructed Timeline
        </h3>
        
        <div className="relative border-l border-slate-700 ml-4 space-y-8 pb-4">
           {timeline.map((event: any, i: number) => (
              <div key={i} className="relative pl-6">
                 <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500"></div>
                 <div className="text-xs font-bold text-indigo-400 mb-1">{event.time}</div>
                 <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-sm text-slate-300">
                    {event.event}
                 </div>
              </div>
           ))}
        </div>
      </div>

    </div>
  );
}
