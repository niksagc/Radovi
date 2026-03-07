'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini API
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: 'Pozdrav! Ja sam StudyWorks AI asistent. Kako vam mogu pomoći danas?'
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ai || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content: userMessage }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Format history for the model
      const history = newMessages.map(msg => `${msg.role === 'user' ? 'Korisnik' : 'Asistent'}: ${msg.content}`).join('\n');
      
      const prompt = `
        Ti si korisnički asistent za platformu StudyWorks. 
        StudyWorks je platforma gdje studenti mogu naručiti pomoć pri uređivanju, formatiranju i pripremi školskih dokumenata (eseji, seminari, završni radovi, PPT prezentacije).
        Odgovaraj na hrvatskom jeziku. Budi pristojan, profesionalan i kratak.
        
        Povijest razgovora:
        ${history}
        
        Odgovori na zadnju poruku korisnika.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      if (response.text) {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), role: 'model', content: response.text as string }
        ]);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', content: 'Oprostite, došlo je do pogreške. Molimo pokušajte ponovno kasnije.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Otvori AI asistenta"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-full max-w-[350px] sm:max-w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col z-50 transition-all origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span className="font-bold">StudyWorks AI</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-indigo-100 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-zinc-200 rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Postavite pitanje..."
              className="flex-1 px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
