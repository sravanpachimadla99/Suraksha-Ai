import { useState, useRef } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip } from 'lucide-react';

export default function MessageInput({ onSend, disabled }: { onSend: (text: string, file?: File) => void, disabled: boolean }) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSend('', e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/*,.pdf"
      />

      <button 
        type="button" 
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
        title="Upload Image/Document"
      >
        <ImageIcon size={20} />
      </button>

      <button 
        type="button"
        disabled={disabled}
        className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
        title="Voice Input"
      >
        <Mic size={20} />
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Type your security question or paste a suspicious link..."
        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
      />

      <button 
        type="submit"
        disabled={disabled || !text.trim()}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2 font-medium"
      >
        <Send size={20} />
        <span className="hidden sm:inline">Send</span>
      </button>

    </form>
  );
}
