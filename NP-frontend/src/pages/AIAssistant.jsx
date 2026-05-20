import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { aiChat } from '../services/api';

const QUICK_QUESTIONS = [
  "What can I substitute for chicken?",
  "Low-calorie snack ideas",
  "Is brown rice healthier than white rice?",
  "How much protein do I need?",
  "Best foods for weight loss?",
  "What are healthy breakfast options?",
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: "Hello! I'm your AI nutrition assistant. I can help you with:\n• Finding healthy food alternatives\n• Answering nutrition questions\n• Meal suggestions\n• Dietary advice\n\nHow can I help you today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const Message = ({ msg }) => {
  const isAI = msg.role === 'ai';
  return (
    <div className={`flex items-start mb-6 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-emerald-100 mr-3' : 'bg-slate-200 ml-3'}`}>
        {isAI
          ? <Bot className="w-4 h-4 text-emerald-600" />
          : <User className="w-4 h-4 text-slate-600" />}
      </div>
      <div className={`rounded-2xl p-4 max-w-2xl shadow-sm ${isAI ? 'bg-slate-100 rounded-tl-none' : 'bg-emerald-500 rounded-tr-none'}`}>
        <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isAI ? 'text-slate-800' : 'text-white'}`}>
          {msg.text}
        </p>
        <span className={`text-xs mt-2 block ${isAI ? 'text-slate-400' : 'text-emerald-100'}`}>{msg.time}</span>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-start mb-6">
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3 flex-shrink-0">
      <Bot className="w-4 h-4 text-emerald-600" />
    </div>
    <div className="bg-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
      <div className="flex space-x-1.5 items-center h-4">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await aiChat(trimmed);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">AI Nutrition Assistant</h1>
            <p className="text-slate-500 mt-1">Ask me anything about nutrition and healthy eating</p>
          </header>

          <div className="flex flex-col lg:flex-row gap-6 flex-1">
            {/* Chat */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" style={{ height: '600px' }}>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">NutriBot</p>
                  <p className="text-xs text-emerald-500">● Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about nutrition, food alternatives..."
                    disabled={loading}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 transition-all text-sm"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-2 p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Questions */}
            <div className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
              <h3 className="font-bold text-slate-900 mb-4">Quick Questions</h3>
              <div className="space-y-3">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button key={idx} onClick={() => sendMessage(q)} disabled={loading}
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
    </div>
  );
};

export default AIAssistantPage;
