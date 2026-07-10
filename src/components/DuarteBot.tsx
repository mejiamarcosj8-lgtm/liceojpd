import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Sparkles, Minus } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export default function DuarteBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      sender: 'bot', 
      text: '¡Hola! Soy DuarteBot, el asistente inteligente del Centro Educativo Juan Pablo Duarte. ¿En qué puedo ayudarte hoy? Puedes consultarme sobre inscripciones, materias, horarios, historia del centro o cualquier otra inquietud.' 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSendChat = (messageText?: string) => {
    const textToSend = messageText || chatInput;
    if (!textToSend.trim()) return;

    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(updatedMessages);
    if (!messageText) {
      setChatInput('');
    }
    setChatLoading(true);

    fetch('/api/ai/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: textToSend,
        history: updatedMessages.slice(-6),
        user: { nombreCompleto: 'Visitante Público', role: 'visitante' }
      })
    })
      .then(res => res.json())
      .then(data => {
        setChatMessages(prev => [...prev, { sender: 'bot' as const, text: data.reply || 'Sin respuesta.' }]);
      })
      .catch(err => {
        console.error('Chatbot error:', err);
        setChatMessages(prev => [...prev, { sender: 'bot' as const, text: 'Hubo un error de conexión con DuarteBot. Por favor, intente de nuevo en unos momentos.' }]);
      })
      .finally(() => {
        setChatLoading(false);
      });
  };

  const suggestions = [
    '¿Cuáles son los requisitos de inscripción?',
    '¿Qué materias imparten en el centro?',
    '¿Cuál es el horario de clases?',
    '¿Quién fue Juan Pablo Duarte?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-[#5A2D1A] hover:bg-[#7D4229] border border-[#D4AF37]/50 text-[#D4AF37] shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
          aria-label="Abrir Asistente AI DuarteBot"
          id="btn-duartebot-toggle"
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
          <span className="absolute -top-12 right-0 bg-neutral-900 text-white text-[10px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            ¿Dudas? Chatea con DuarteBot
          </span>
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-950" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-[360px] sm:w-[380px] h-[520px] flex flex-col overflow-hidden animate-fade-in"
          id="duartebot-panel"
        >
          {/* Header */}
          <div className="bg-[#5A2D1A] text-white p-4 flex items-center justify-between border-b border-[#D4AF37]/30">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-neutral-900/40 flex items-center justify-center border border-[#D4AF37]/30">
                  <Sparkles className="h-4.5 w-4.5 text-[#D4AF37]" />
                </div>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-[#5A2D1A]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  DuarteBot
                  <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">AI</span>
                </h3>
                <span className="text-[10px] text-neutral-300 block font-light">Asistente de Orientación Escolar</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/85 hover:text-white"
                aria-label="Minimizar chat"
                id="btn-duartebot-minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/85 hover:text-white"
                aria-label="Cerrar chat"
                id="btn-duartebot-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950/20">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#5A2D1A] text-white rounded-br-none'
                      : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-100 dark:border-neutral-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start items-center space-x-2 animate-pulse pl-1">
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]/60" />
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]/30" />
                <span className="text-[10px] text-neutral-400 font-light">DuarteBot está procesando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Bubbles */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950/40 border-t border-neutral-100 dark:border-neutral-800/60 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendChat(s)}
                disabled={chatLoading}
                className="bg-white dark:bg-neutral-900 hover:bg-[#5A2D1A] hover:text-white dark:hover:bg-[#5A2D1A] border border-neutral-200 dark:border-neutral-800 rounded-full px-3 py-1.5 text-[10px] text-neutral-600 dark:text-neutral-300 font-medium transition-all shrink-0 cursor-pointer shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat Input Footer */}
          <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center space-x-2 bg-white dark:bg-neutral-900">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendChat();
                }
              }}
              disabled={chatLoading}
              placeholder="Pregunte sobre admisiones, materias, horario..."
              className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#5A2D1A] focus:border-[#5A2D1A] dark:text-white"
            />
            <button
              onClick={() => handleSendChat()}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-[#5A2D1A] hover:bg-[#7D4229] disabled:opacity-40 text-white p-2.5 rounded-xl shadow transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
