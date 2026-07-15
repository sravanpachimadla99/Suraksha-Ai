export default function ForecastChart() {
  return (
    <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl relative flex items-center justify-center overflow-hidden">
       {/* Mock Time-series Line Chart layout using Tailwind/CSS */}
       <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
       
       {/* Visual Sparkline simulation */}
       <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Confidence Band */}
          <polygon points="0,70 20,60 40,65 60,40 80,45 100,20 100,60 80,85 60,80 40,90 20,85 0,90" fill="rgba(99, 102, 241, 0.08)" />
          {/* Trend line */}
          <polyline
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth="2"
            points="0,80 20,70 40,75 60,50 80,60 100,30"
          />
       </svg>
       
       <div className="absolute bottom-4 left-4 text-xs text-slate-500">Timeline: 7 Day Trend Projections (Confidence Band $\pm$10%)</div>
    </div>
  );
}
