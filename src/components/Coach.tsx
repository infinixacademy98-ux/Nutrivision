import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { auth } from '../firebase';
import { checkAndIncrementAiUsage, getAiUsage } from '../services/aiQuotaService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Nutrition & Health Coach. How can I help you today? You can ask me about meal ideas, protein intake, or if a specific food is healthy."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ count: number; limit: number; remaining: number } | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchQuota = async () => {
      const user = auth.currentUser;
      if (user) {
        const info = await getAiUsage(user.uid);
        setQuotaInfo(info);
      }
    };
    fetchQuota();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const user = auth.currentUser;
    if (!user) return;

    if (cooldown) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Please wait a few seconds before sending another message." }]);
      return;
    }

    const { allowed, remaining } = await checkAndIncrementAiUsage(user.uid);
    if (!allowed) {
      setMessages(prev => [...prev, { role: 'assistant', content: "You have reached your daily AI limit. Please try again tomorrow." }]);
      return;
    }
    setQuotaInfo(prev => prev ? { ...prev, remaining } : null);

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 10000); // 10s cooldown for chat

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-2.5-flash";
      
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: "You are an expert AI Nutrition and Health Coach. Provide helpful, accurate, and encouraging advice on diet, exercise, and healthy living. Keep responses concise and use markdown for formatting. If asked about specific foods, analyze their nutritional value. If asked for meal plans, suggest balanced options.",
        },
      });

      // We send the full history for context
      const response = await chat.sendMessage({ message: userMessage });
      const aiResponse = response.text;

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("Coach Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-orange p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold">AI Health Coach</h2>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
            <span className="text-white/70 text-xs">
              {quotaInfo ? `${quotaInfo.remaining} credits left` : 'Online & Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                m.role === 'user'
                  ? 'bg-brand-orange text-white rounded-tr-none'
                  : 'bg-stone-100 text-stone-800 rounded-tl-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] font-bold uppercase tracking-wider">
                {m.role === 'user' ? (
                  <>
                    <span>You</span>
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3" />
                    <span>AI Coach</span>
                  </>
                )}
              </div>
              <div className="markdown-body text-sm leading-relaxed">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
              <span className="text-sm text-stone-500 italic">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-stone-100 bg-stone-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-brand-orange text-white p-2 rounded-xl disabled:opacity-50 hover:bg-brand-orange/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-stone-400">
          <Sparkles className="w-3 h-3" />
          <span>Powered by Gemini AI</span>
        </div>
      </div>
    </div>
  );
}
