"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, MessageSquare, AlertTriangle, Send } from "lucide-react";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import SuggestedPrompts from "./components/SuggestedPrompts";
import { BACKEND_URL } from "../../lib/api";

export default function CitizenAssistantPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I am the Citizen Fraud Shield AI. I can help you identify scams, verify suspicious links, or report financial fraud. How can I assist you today?",
      id: "welcome"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;
    
    // Add user message
    const userMsg = { role: "user", content: text || `[Uploaded File: ${file?.name}]`, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const endpoint = file ? "/api/v1/assistant/upload" : "/api/v1/assistant/chat";
      const b64 = file ? await toBase64(file) : "";
      const payload = file 
        ? { session_id: sessionId, file_name: file.name, file_type: file.type, content: b64 }
        : { message: text, session_id: sessionId, language: "en" };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (!sessionId) setSessionId(data.session_id);
        
        // Structure assistant response
        const assistantMsg = {
          role: "assistant",
          content: data.message,
          risk: data.risk_assessment,
          actions: data.recommended_actions,
          resources: data.related_resources,
          module: data.module_used,
          id: Date.now().toString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting to the safety servers.", id: Date.now().toString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Citizen Fraud Shield AI</h1>
            <p className="text-sm text-slate-400">24/7 Cyber Safety Assistant</p>
          </div>
        </div>
        <div className="text-sm text-slate-500 border border-slate-800 px-3 py-1 rounded-full bg-slate-950">
          Session ID: {sessionId || 'New'}
        </div>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4 h-[calc(100vh-80px)]">
        {/* Main Chat Area */}
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl relative">
          <ChatWindow messages={messages} loading={loading} />
          
          {messages.length === 1 && (
            <div className="absolute inset-x-0 bottom-24 p-4">
               <SuggestedPrompts onSelect={handleSendMessage} />
            </div>
          )}
          
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <MessageInput onSend={handleSendMessage} disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
