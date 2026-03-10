import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Mail, FileText, Search, ShieldOff, ShieldCheck, Trash2, Loader,
    ExternalLink, ChevronDown, ChevronUp, Bot, User as UserIcon, CheckCircle,
    XCircle, Filter, RefreshCw,
} from 'lucide-react';
import {
    adminGetUsers, adminBlockUser,
    adminGetCampaigns, adminUpdateCampaign, adminDeleteCampaign,
    adminGetSubjects, adminDeleteSubject,
} from '../services/endpoints';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const map = {
        active: 'bg-lime-100 text-lime-700',
        draft: 'bg-slate-100 text-slate-500',
        archived: 'bg-red-100 text-red-400',
    };
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
            {status}
        </span>
    );
};

const SectionHeader = ({ label, count }) => (
    <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        {count != null && (
            <span className="text-xs px-2 py-0.5 bg-kings-plum/10 text-kings-plum rounded-full font-semibold">{count}</span>
        )}
    </div>
);

/* ─── Users Tab ───────────────────────────────────────── */
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBlocked, setFilterBlocked] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (filterBlocked !== 'all') params.is_blocked = filterBlocked === 'blocked';
        adminGetUsers(params)
            .then(({ data }) => setUsers(data.results ?? data))
            .finally(() => setLoading(false));
    }, [search, filterBlocked]);

    // Debounced search
    const timer = useRef(null);
    useEffect(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(fetchUsers, 350);
        return () => clearTimeout(timer.current);
    }, [fetchUsers]);

    const handleBlockToggle = async (u) => {
        setActionLoading(u.id);
        try {
            await adminBlockUser(u.id, !u.is_blocked);
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: !u.is_blocked, is_active: u.is_blocked } : x));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input className="glass-input pl-9 py-2.5 text-sm" placeholder="Search by email…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 shrink-0">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
                        { key: 'blocked', label: 'Blocked' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilterBlocked(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterBlocked === f.key ? 'bg-kings-plum text-snow shadow-md' : 'glass text-slate-600 hover:bg-snow/60'}`}>
                            {f.label}
                        </button>
                    ))}
                    <button onClick={fetchUsers} className="p-2.5 glass rounded-xl text-slate-500 hover:text-kings-plum transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <SectionHeader label="Users" count={loading ? null : users.length} />

            {loading ? (
                <div className="flex justify-center py-16"><Loader className="animate-spin text-kings-plum" size={28} /></div>
            ) : users.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No users found.</p>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {users.map((u, i) => (
                        <motion.div key={u.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                            className="glass rounded-2xl overflow-hidden"
                        >
                            {/* Row */}
                            <div className="flex items-center justify-between gap-4 p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-kings-plum/20 to-pastel-magenta/20 flex items-center justify-center font-bold text-kings-plum shrink-0">
                                        {u.email.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-800 text-sm truncate">{u.email}</p>
                                            {u.is_admin && (
                                                <span className="px-1.5 py-0.5 bg-kings-plum/10 text-kings-plum rounded text-[10px] font-bold">ADMIN</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                                            {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'} &nbsp;·&nbsp; {u.campaign_count ?? 0} campaigns &nbsp;·&nbsp; Joined {new Date(u.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Status */}
                                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${u.is_blocked ? 'bg-red-100 text-red-600' : 'bg-lime-100 text-lime-700'}`}>
                                        {u.is_blocked
                                            ? <XCircle size={12} />
                                            : <CheckCircle size={12} />}
                                        {u.is_blocked ? 'Blocked' : 'Active'}
                                    </div>

                                    {/* Block / Unblock */}
                                    {!u.is_admin && (
                                        <button
                                            onClick={() => handleBlockToggle(u)}
                                            disabled={actionLoading === u.id}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${u.is_blocked ? 'bg-lime-50 text-lime-700 hover:bg-lime-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                        >
                                            {actionLoading === u.id ? <Loader size={12} className="animate-spin" />
                                                : u.is_blocked ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                                            {u.is_blocked ? 'Unblock' : 'Block'}
                                        </button>
                                    )}

                                    {/* Expand */}
                                    <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                                        className="p-1.5 glass rounded-lg text-slate-400 hover:text-kings-plum transition-colors">
                                        {expandedId === u.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {expandedId === u.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-snow/50 px-4 pb-4 pt-3"
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { label: 'ID', value: `#${u.id}` },
                                                { label: 'Role', value: u.is_admin ? 'Admin' : 'User' },
                                                { label: 'Active', value: u.is_active ? 'Yes' : 'No' },
                                                { label: 'Campaigns', value: u.campaign_count ?? 0 },
                                            ].map(item => (
                                                <div key={item.label} className="bg-snow/50 rounded-xl p-3">
                                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                                                    <p className="font-bold text-slate-700 text-sm">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Campaigns Tab ───────────────────────────────────── */
const CAMPAIGN_STATUSES = ['all', 'active', 'draft', 'archived'];

const CampaignsTab = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editStatus, setEditStatus] = useState('');

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        const params = {};
        if (filterStatus !== 'all') params.status = filterStatus;
        if (search) params.owner = search;
        adminGetCampaigns(params)
            .then(({ data }) => setCampaigns(data.results ?? data))
            .finally(() => setLoading(false));
    }, [search, filterStatus]);

    const timer = useRef(null);
    useEffect(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(fetchCampaigns, 350);
        return () => clearTimeout(timer.current);
    }, [fetchCampaigns]);

    const handleStatusSave = async (id) => {
        setActionLoading(`edit-${id}`);
        try {
            const { data } = await adminUpdateCampaign(id, { status: editStatus });
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: data.status } : c));
            setEditingId(null);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete campaign "${title}"?`)) return;
        setActionLoading(`del-${id}`);
        try {
            await adminDeleteCampaign(id);
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input className="glass-input pl-9 py-2.5 text-sm" placeholder="Filter by owner email…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                    {CAMPAIGN_STATUSES.map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filterStatus === s ? 'bg-kings-plum text-snow shadow-md' : 'glass text-slate-600 hover:bg-snow/60'}`}>
                            {s}
                        </button>
                    ))}
                    <button onClick={fetchCampaigns} className="p-2.5 glass rounded-xl text-slate-500 hover:text-kings-plum transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <SectionHeader label="All Campaigns" count={loading ? null : campaigns.length} />

            {loading ? (
                <div className="flex justify-center py-16"><Loader className="animate-spin text-kings-plum" size={28} /></div>
            ) : campaigns.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No campaigns found.</p>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {campaigns.map((c, i) => (
                        <motion.div key={c.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                            className="glass p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-800">{c.title}</p>
                                    <span className="text-xs text-slate-400 capitalize px-2 py-0.5 bg-pastel-magenta/10 text-kings-plum rounded-full">
                                        {c.industry}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Owner: <span className="font-medium text-slate-500">{c.owner}</span>
                                    &nbsp;·&nbsp; {c.subject_count ?? 0} subjects
                                    &nbsp;·&nbsp; {new Date(c.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                {editingId === c.id ? (
                                    <>
                                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                                            className="glass-input py-1.5 text-sm w-32">
                                            {['draft', 'active', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button onClick={() => handleStatusSave(c.id)}
                                            disabled={actionLoading === `edit-${c.id}`}
                                            className="px-3 py-1.5 bg-kings-plum text-snow rounded-xl text-xs font-bold flex items-center gap-1">
                                            {actionLoading === `edit-${c.id}` ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                            Save
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 glass rounded-xl text-xs font-bold text-slate-500">
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <StatusBadge status={c.status} />
                                        <button onClick={() => { setEditingId(c.id); setEditStatus(c.status); }}
                                            className="px-3 py-1.5 glass rounded-xl text-xs font-semibold text-slate-500 hover:text-kings-plum transition-colors flex items-center gap-1.5">
                                            <Filter size={12} /> Set Status
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleDelete(c.id, c.title)}
                                    disabled={actionLoading === `del-${c.id}`}
                                    className="p-2 text-red-400 hover:text-red-600 bg-red-50 rounded-xl transition-colors"
                                >
                                    {actionLoading === `del-${c.id}` ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Subjects Tab ────────────────────────────────────── */
const SubjectsTab = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAI, setFilterAI] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editScore, setEditScore] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchSubjects = useCallback(() => {
        setLoading(true);
        const params = {};
        if (filterAI !== 'all') params.is_ai_generated = filterAI === 'ai';
        adminGetSubjects(params)
            .then(({ data }) => setSubjects(data.results ?? data))
            .finally(() => setLoading(false));
    }, [filterAI]);

    useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

    const handleScoreSave = async (id) => {
        const score = parseInt(editScore, 10);
        if (isNaN(score) || score < 0 || score > 100) return;
        setActionLoading(`edit-${id}`);
        try {
            const { data } = await adminUpdateSubject(id, { performance_score: score });
            setSubjects(prev => prev.map(s => s.id === id ? { ...s, performance_score: data.performance_score } : s));
            setEditingId(null);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this subject line permanently?')) return;
        setActionLoading(`del-${id}`);
        try {
            await adminDeleteSubject(id);
            setSubjects(prev => prev.filter(s => s.id !== id));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Filter */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'all', label: 'All Subjects' },
                        { key: 'ai', label: '🤖 AI Generated' },
                        { key: 'manual', label: '✍ Manual' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilterAI(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterAI === f.key ? 'bg-kings-plum text-snow shadow-md' : 'glass text-slate-600 hover:bg-snow/60'}`}>
                            {f.label}
                        </button>
                    ))}
                    <button onClick={fetchSubjects} className="p-2.5 glass rounded-xl text-slate-500 hover:text-kings-plum transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
                <SectionHeader label="Total" count={loading ? null : subjects.length} />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader className="animate-spin text-kings-plum" size={28} /></div>
            ) : subjects.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No subject lines found.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {subjects.map((s, i) => (
                        <motion.div key={s.id}
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            className="glass p-3.5 rounded-xl flex items-center justify-between gap-3 group"
                        >
                            {/* Origin icon */}
                            <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${s.is_ai_generated ? 'bg-kings-plum/10 text-kings-plum' : 'bg-slate-100 text-slate-400'}`}>
                                {s.is_ai_generated ? <Bot size={15} /> : <UserIcon size={15} />}
                            </div>

                            {/* Text + meta */}
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{s.text}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Campaign #{s.campaign} &nbsp;·&nbsp;
                                    <span className="capitalize">{s.tone}</span> &nbsp;·&nbsp;
                                    {new Date(s.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Score edit / display */}
                            <div className="flex items-center gap-2 shrink-0">
                                {editingId === s.id ? (
                                    <>
                                        <input type="number" min="0" max="100"
                                            className="glass-input w-20 py-1 text-sm text-center"
                                            value={editScore}
                                            onChange={e => setEditScore(e.target.value)}
                                            placeholder="0-100" />
                                        <button onClick={() => handleScoreSave(s.id)}
                                            disabled={actionLoading === `edit-${s.id}`}
                                            className="px-2.5 py-1.5 bg-kings-plum text-snow rounded-lg text-xs font-bold">
                                            {actionLoading === `edit-${s.id}` ? <Loader size={12} className="animate-spin" /> : 'Save'}
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="px-2.5 py-1.5 glass rounded-lg text-xs text-slate-500">×</button>
                                    </>
                                ) : (
                                    <>
                                        {s.performance_score != null ? (
                                            <button onClick={() => { setEditingId(s.id); setEditScore(s.performance_score); }}
                                                className="px-2.5 py-1 bg-soothing-lime/30 text-lime-700 rounded-lg text-xs font-bold hover:bg-soothing-lime/50 transition-colors">
                                                Score: {s.performance_score}
                                            </button>
                                        ) : (
                                            <button onClick={() => { setEditingId(s.id); setEditScore(''); }}
                                                className="px-2.5 py-1 glass rounded-lg text-xs text-slate-400 hover:text-kings-plum transition-colors opacity-0 group-hover:opacity-100">
                                                + Score
                                            </button>
                                        )}
                                    </>
                                )}

                                <span className="text-xs px-2 py-0.5 bg-pastel-magenta/10 text-kings-plum rounded-full capitalize hidden md:inline">
                                    {s.tone}
                                </span>

                                <button
                                    onClick={() => handleDelete(s.id)}
                                    disabled={actionLoading === `del-${s.id}`}
                                    className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {actionLoading === `del-${s.id}` ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Main AdminPanel ─────────────────────────────────── */
const TABS = [
    { key: 'users', label: 'Users', icon: <Users size={17} /> },
    { key: 'campaigns', label: 'Campaigns', icon: <Mail size={17} /> },
    { key: 'subjects', label: 'Subject Lines', icon: <FileText size={17} /> },
];

const AdminPanel = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('users');

    if (!user?.is_admin) return (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-center gap-3">
            <ShieldOff size={36} className="text-red-400" />
            <h3 className="text-xl font-bold text-slate-700">Access Denied</h3>
            <p className="text-slate-500 text-sm">You must be an administrator to view this page.</p>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
                    <p className="text-slate-500 mt-1 text-sm">Platform-wide management of users, campaigns, and subject lines</p>
                </div>
                <a
                    href="http://127.0.0.1:8000/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button py-2.5 px-5 text-sm whitespace-nowrap"
                >
                    <ExternalLink size={16} /> Django Admin UI
                </a>
            </header>

            {/* Tabs */}
            <div className="glass-card py-3 px-4 flex items-center gap-2 flex-wrap">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-kings-plum text-snow shadow-lg shadow-kings-plum/20' : 'glass text-slate-600 hover:bg-snow/60'
                            }`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {tab === 'users' && <UsersTab />}
                    {tab === 'campaigns' && <CampaignsTab />}
                    {tab === 'subjects' && <SubjectsTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AdminPanel;
