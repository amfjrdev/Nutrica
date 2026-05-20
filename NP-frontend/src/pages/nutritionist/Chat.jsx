import { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useChat, getStoredUserId } from '../../hooks/useChat';
import { getNutritionistChatClients } from '../../services/api';

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
    </div>
  );
};

const NutritionistChat = () => {
  const currentUserId = getStoredUserId();
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeClient, setActiveClient] = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  // Track which rooms have received a new message since page load (for badge)
  const [newMsgRooms,  setNewMsgRooms]  = useState(new Set());
  const bottomRef = useRef(null);

  const { messages, connected, error, sendMessage } = useChat(activeClient?.subscriptionId ?? null);

  useEffect(() => {
    getNutritionistChatClients()
      .then((data) => {
        setClients(data);
        if (data.length > 0) setActiveClient(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When a new message arrives in the active room, update the client list preview
  useEffect(() => {
    if (!activeClient || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.system) return;

    setClients(prev => {
      const updated = prev.map(c =>
        c.subscriptionId === activeClient.subscriptionId
          ? { ...c, lastMessage: last.message, lastMessageAt: last.sentAt }
          : c
      );
      // Re-sort by most recent
      return [...updated].sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });
    });
  }, [messages]);

  // Mark room as having new messages when a message arrives in a non-active room
  // (handled via polling the client list — simple approach)
  const handleSelectClient = (client) => {
    setActiveClient(client);
    setInput('');
    setNewMsgRooms(prev => { const s = new Set(prev); s.delete(client.subscriptionId); return s; });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !connected || sending) return;
    setSending(true);
    try { await sendMessage(trimmed); setInput(''); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filtered = clients.filter((c) =>
    !searchQuery ||
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clients who have at least one message = "active conversations"
  const hasConversation = (c) => !!c.lastMessage || !!c.lastMessageAt;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {clients.length > 0
            ? `${clients.filter(hasConversation).length} active conversation${clients.filter(hasConversation).length !== 1 ? 's' : ''} · ${clients.length} total client${clients.length !== 1 ? 's' : ''}`
            : 'Chat with your Personalized plan clients'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* ── Client list ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg
                  text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                  focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No Personalized clients yet</p>
              </div>
            ) : filtered.map((client) => {
              const isActive  = activeClient?.subscriptionId === client.subscriptionId;
              const hasNew    = newMsgRooms.has(client.subscriptionId);
              const hasChat   = hasConversation(client);

              return (
                <div
                  key={client.subscriptionId}
                  onClick={() => handleSelectClient(client)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                      text-sm font-bold flex-shrink-0 ${
                        hasChat ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {client.firstName[0]}{client.lastName[0]}
                    </div>

                    {/* Name + preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-semibold text-sm truncate ${
                          isActive ? 'text-emerald-900' : 'text-slate-900'
                        }`}>
                          {client.firstName} {client.lastName}
                        </span>
                        {client.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {formatTime(client.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-xs truncate ${
                          hasNew ? 'text-slate-800 font-medium' : 'text-slate-400'
                        }`}>
                          {client.lastMessage ?? (hasChat ? '' : 'No messages yet')}
                        </p>
                        {hasNew && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat area ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm
          flex flex-col overflow-hidden min-h-0">

          {!activeClient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">Select a client</p>
              <p className="text-sm mt-1">Choose a client from the left panel</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700
                    flex items-center justify-center font-bold text-sm">
                    {activeClient.firstName[0]}{activeClient.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {activeClient.firstName} {activeClient.lastName}
                    </p>
                    <p className={`text-xs font-medium ${connected ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {connected ? '● Online' : '○ Connecting…'}
                    </p>
                  </div>
                </div>
                {connected
                  ? <Wifi className="w-4 h-4 text-emerald-500" />
                  : <WifiOff className="w-4 h-4 text-slate-400" />}
              </div>

              {error && (
                <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-600
                  text-xs rounded-lg flex-shrink-0">
                  {error}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 min-h-0">
                {!connected && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-400" />
                    <p className="text-sm">Connecting…</p>
                  </div>
                )}
                {connected && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
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
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                      text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                      focus:border-emerald-500 disabled:opacity-50 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !connected || sending}
                    className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40
                      disabled:cursor-not-allowed text-white rounded-xl flex items-center
                      justify-center transition-colors flex-shrink-0">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutritionistChat;
