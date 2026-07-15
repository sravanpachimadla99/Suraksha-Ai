import { ShieldAlert } from 'lucide-react';

interface RiskProps {
  title: string;
  value: string;
  riskScore: number;
}

export default function RiskCard({ title, value, riskScore }: RiskProps) {
  const color = riskScore > 0.8 ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5';
  
  return (
    <div className={`border p-4 rounded-xl flex items-center justify-between ${color}`}>
       <div>
          <div className="text-xs uppercase font-semibold opacity-60">{title}</div>
          <div className="text-lg font-mono font-bold mt-1">{value}</div>
       </div>
       <div className="text-right">
          <div className="text-2xl font-black">{(riskScore * 100).toFixed(0)}%</div>
          <div className="text-[10px] uppercase tracking-wider opacity-60">Risk Index</div>
       </div>
    </div>
  );
}
