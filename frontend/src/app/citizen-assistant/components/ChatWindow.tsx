import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, AlertTriangle, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function ChatWindow({ messages, loading }: { messages: any[], loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}>
            {msg.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}
          </div>

          <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
            }`}>
              
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
              
              {/* AI Metadata Tags */}
              {msg.role === 'assistant' && msg.module && (
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2 text-xs">
                  
                  {msg.risk && (
                    <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                      msg.risk === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
                      msg.risk === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <AlertTriangle size={12}/> Risk: {msg.risk}
                    </span>
                  )}
                  
                  <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    <Info size={12}/> Module: {msg.module}
                  </span>
                  
                </div>
              )}

              {/* Actionable items */}
              {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500"/> Recommended Actions
                  </div>
                  <ul className="space-y-1">
                    {msg.actions.map((act: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                         <ChevronRight size={14} className="mt-0.5 text-slate-500"/> {act}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>
      ))}

      {loading && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
             <Bot size={16} className="text-white"/>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-lg">
             <div className="flex gap-1.5 items-center h-4">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
