import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2, Wifi, WifiOff, Lock } from 'lucide-react';
import { useChat, getStoredUserId } from '../hooks/useChat';
import { getClientAccess } from '../services/api';

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ msg, currentUserId }) => {
  if (msg.system) return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{msg.message}</span>
    </div>
  );

  const isNutritionist = msg.senderRole === 'nutritionist';
  const isOwn          = msg.senderUserId?.toLowerCase() === currentUserId?.toLowerCase();
  const label          = isOwn ? 'You' : (isNutritionist ? 'Nutritionist' : 'Client');
  const initial        = isNutritionist ? 'N' : 'C';

  return (
    <div className={`flex items-end gap-2 mb-3 ${isNutritionist ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
        isNutritionist ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'
      }`}>
        {initial}
      </div>
      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 shadow-sm ${
        isNutritionist
          ? 'bg-emerald-500 text-white rounded-2xl rounded-br-none'
          : 'bg-blue-50 border border-blue-200 text-slate-800 rounded-2xl rounded-bl-none'
      }`}>
        <p className={`text-[10px] font-semibold mb-0.5 uppercase tracking-wide ${
          isNutritionist ? 'text-emerald-100' : 'text-blue-500'
        }`}>{label}</p>
        <p className="text-sm leading-relaxed">{msg.message}</p>
        <p className={`text-[11px] mt-1 ${isNutritionist ? 'text-emerald-100 text-right' : 'text-slate-400'}`}>
          {formatTime(msg.sentAt)}
        </p>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const currentUserId = getStoredUserId();
  const [access,   setAccess]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getClientAccess()
      .then(setAccess)
      .catch(() => setAccess(null))
      .finally(() => setLoading(false));
  }, []);

  // Use subscriptionId as the chat room — stable, unique per client
  const chatRoomId = (access?.subscriptionType === 'Personalized' && access?.hasActiveSubscription)
    ? access.subscriptionId
    : null;

  const { messages, connected, error, sendMessage } = useChat(chatRoomId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !connected || sending) return;
    setSending(true);
    try {
      await sendMessage(trimmed);
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
    </div>
  );

  // Block access if not Personalized + Active
  if (!chatRoomId) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
      <Lock className="w-10 h-10 opacity-30" />
      <p className="font-medium text-slate-600">Chat is locked</p>
      <p className="text-sm text-center max-w-xs">
        Chat with your nutritionist is available exclusively on the{' '}
        <span className="font-semibold text-emerald-600">$99 Personalized Plan</span> after admin approval.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Chat with Nutritionist</h1>
        <p className="text-slate-500 text-sm mt-0.5">Direct messaging with your assigned nutritionist</p>
      </header>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
        {/* Chat header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-sm">N</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Your Nutritionist</p>
              <p className="text-xs text-slate-500">Personalized Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <><Wifi className="w-4 h-4 text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Connected</span></>
            ) : (
              <><WifiOff className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-400">Connecting…</span></>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex-shrink-0">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 min-h-0">
          {!connected && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-400" />
              <p className="text-sm">Connecting…</p>
            </div>
          )}
          {connected && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} currentUserId={currentUserId} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? 'Type a message…' : 'Connecting…'}
              disabled={!connected || sending}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected || sending}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40
                disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center
                transition-colors flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
