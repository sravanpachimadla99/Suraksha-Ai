import { AlertTriangle, Link2, Smartphone, ShieldCheck } from "lucide-react";

export default function SuggestedPrompts({ onSelect }: { onSelect: (text: string) => void }) {
  const prompts = [
    {
      icon: <Link2 size={16} className="text-blue-400"/>,
      text: "Is this website safe?",
      query: "Can you check if http://example.com is a phishing site?"
    },
    {
      icon: <AlertTriangle size={16} className="text-amber-400"/>,
      text: "I shared my OTP",
      query: "I accidentally shared my OTP with someone on a call. What should I do now?"
    },
    {
      icon: <Smartphone size={16} className="text-emerald-400"/>,
      text: "Verify QR Code",
      query: "How can I verify a UPI QR code before paying?"
    },
    {
      icon: <ShieldCheck size={16} className="text-indigo-400"/>,
      text: "Check Fake Note",
      query: "How do I check if my 500 Rupee note is fake?"
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {prompts.map((p, i) => (
        <button 
          key={i}
          onClick={() => onSelect(p.query)}
          className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:border-indigo-500 text-slate-300 px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all hover:bg-slate-800 shadow-lg hover:shadow-indigo-500/10"
        >
          {p.icon}
          {p.text}
        </button>
      ))}
    </div>
  );
}
