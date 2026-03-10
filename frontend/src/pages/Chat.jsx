import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, History, MessageSquare, Trash2, Plus, Loader, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
    getChatSessions, getChatSession,
    createChatSession, deleteChatSession, sendMessage
} from '../services/endpoints';

const Chat = () => {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    /* Load session list on mount */
    useEffect(() => {
        getChatSessions()
            .then(({ data }) => setSessions(data.results ?? data))
            .finally(() => setLoadingSessions(false));
    }, []);

    /* Load messages when a session is selected */
    useEffect(() => {
        if (!activeSession) return;
        setLoadingMessages(true);
        setMessages([]);
        getChatSession(activeSession.id)
            .then(({ data }) => setMessages(data.messages))
            .finally(() => setLoadingMessages(false));
    }, [activeSession?.id]);

    /* Auto-scroll */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleNewSession = async () => {
        try {
            const { data } = await createChatSession({});
            setSessions(prev => [data, ...prev]);
            setActiveSession(data);
        } catch {
            setError('Failed to create new session.');
        }
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation();
        await deleteChatSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
            setActiveSession(null);
            setMessages([]);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || !activeSession || isTyping) return;

        // Optimistic user bubble
        const tempUserMsg = { id: `tmp-${Date.now()}`, role: 'user', content: text };
        setMessages(prev => [...prev, tempUserMsg]);
        setInputValue('');
        setIsTyping(true);
        setError('');

        try {
            const { data } = await sendMessage(activeSession.id, text);
            // Replace optimistic msg + add AI reply from server response
            setMessages(data.session.messages);
            // Update session title in sidebar if backend auto-set it
            if (data.session.title) {
                setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: data.session.title } : s));
                setActiveSession(prev => ({ ...prev, title: data.session.title }));
            }
        } catch (err) {
            setError(err.response?.data?.error || 'AI service error. Please try again.');
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="w-full min-h-[75vh] flex gap-5 mt-1">
            {/* ── Sidebar ── */}
            <aside className="hidden md:flex flex-col w-72 glass-card p-5 gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <History size={16} className="text-kings-plum" /> Chat History
                    </h2>
                    <button
                        onClick={handleNewSession}
                        className="p-1.5 glass rounded-lg text-kings-plum hover:bg-kings-plum hover:text-snow transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-grow flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                    {loadingSessions ? (
                        <div className="flex justify-center py-8"><Loader className="animate-spin text-kings-plum" size={20} /></div>
                    ) : sessions.length === 0 ? (
                        <p className="text-slate-400 text-xs text-center mt-4">No sessions yet. Click + to start.</p>
                    ) : sessions.map(s => (
                        <button key={s.id} onClick={() => setActiveSession(s)}
                            className={`text-left p-3 rounded-xl transition-all group flex flex-col gap-0.5 ${activeSession?.id === s.id
                                ? 'bg-kings-plum text-snow shadow-md'
                                : 'hover:bg-snow/60 text-slate-600'
                                }`}
                        >
                            <div className="flex justify-between items-start w-full gap-2">
                                <span className="font-semibold text-xs truncate flex items-center gap-1.5">
                                    <MessageSquare size={12} className="shrink-0" />
                                    {s.title || `Session #${s.id}`}
                                </span>
                                <button
                                    onClick={(e) => handleDeleteSession(s.id, e)}
                                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${activeSession?.id === s.id ? 'text-snow/70 hover:text-snow' : 'text-red-400 hover:text-red-600'
                                        }`}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <span className={`text-[11px] pl-4 ${activeSession?.id === s.id ? 'text-snow/60' : 'text-slate-400'}`}>
                                {s.message_count ?? 0} messages
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Main chat window ── */}
            <div className="flex-grow glass-card flex flex-col overflow-hidden p-4 md:p-6">
                {!activeSession ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kings-plum/20 to-pastel-magenta/20 flex items-center justify-center">
                            <Bot size={32} className="text-kings-plum" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">Start a Conversation</h3>
                        <p className="text-slate-500 text-sm max-w-xs">Select a session from the sidebar or create a new one to chat with the AI optimizer.</p>
                        <button onClick={handleNewSession} className="glass-button mt-2">
                            <Plus size={18} /> New Chat
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 mb-4 flex flex-col gap-5">
                            {loadingMessages ? (
                                <div className="flex justify-center py-12"><Loader className="animate-spin text-kings-plum" size={28} /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">
                                    Send a message to start optimizing.
                                </div>
                            ) : messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                                >
                                    <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center shadow ${msg.role === 'user' ? 'bg-kings-plum text-snow' : 'bg-soothing-lime text-lime-800'
                                        }`}>
                                        {msg.role === 'user' ? <User size={17} /> : <Bot size={17} />}
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-kings-plum text-snow rounded-tr-sm'
                                        : 'bg-snow border border-snow/60 text-slate-800 rounded-tl-sm shadow-sm'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <p>{msg.content}</p>
                                        ) : (
                                            <div className="ai-markdown">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                                    <div className="shrink-0 h-9 w-9 rounded-xl bg-soothing-lime text-lime-800 flex items-center justify-center">
                                        <Bot size={17} />
                                    </div>
                                    <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-snow border border-snow/60 flex items-center gap-1.5">
                                        {[0, 150, 300].map(d => (
                                            <div key={d} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Error banner */}
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl mb-3">
                                    <AlertCircle size={16} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input */}
                        <form onSubmit={handleSend} className="relative flex items-center gap-2">
                            <input
                                type="text"
                                className="glass-input flex-grow pr-12 py-4 rounded-2xl"
                                placeholder="Ask the AI to generate or refine subject lines…"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="absolute right-2 p-2.5 rounded-xl bg-kings-plum text-snow disabled:opacity-40 hover:bg-kings-plum/90 transition-all"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chat;
