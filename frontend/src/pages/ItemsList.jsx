import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Mail, Edit3, Trash2, ArrowUpRight, Loader } from 'lucide-react';
import { getCampaigns, deleteCampaign } from '../services/endpoints';

const STATUS_COLORS = {
    active: 'bg-lime-100/60 text-lime-700',
    draft: 'bg-slate-100 text-slate-500',
    archived: 'bg-red-100/50 text-red-400',
};

const INDUSTRY_LABELS = {
    ecommerce: 'E-commerce', saas: 'SaaS', finance: 'Finance',
    healthcare: 'Healthcare', education: 'Education', other: 'Other',
};

const CampaignsList = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    const fetchCampaigns = () => {
        setLoading(true);
        getCampaigns()
            .then(({ data }) => setCampaigns(data.results ?? data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete campaign "${title}"? This also removes all its subject lines.`)) return;
        setDeletingId(id);
        try {
            await deleteCampaign(id);
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch {
            alert('Delete failed. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = campaigns.filter(c => {
        if (filter !== 'all' && c.status !== filter) return false;
        if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="w-full flex flex-col gap-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 px-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Campaigns</h1>
                    <p className="text-slate-500 mt-1">Manage your email marketing campaigns</p>
                </div>
                <Link to="/campaigns/new" className="glass-button py-2.5 px-5 text-sm whitespace-nowrap">
                    <Plus size={18} /> New Campaign
                </Link>
            </header>

            {/* Controls */}
            <div className="glass-card flex flex-col md:flex-row justify-between items-center gap-4 py-4">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="text" placeholder="Search campaigns…" className="glass-input pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                    {['all', 'active', 'draft', 'archived'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${filter === s ? 'bg-kings-plum text-snow shadow-md' : 'glass text-slate-600 hover:bg-snow/50'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader className="animate-spin text-kings-plum" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filtered.map((c, i) => (
                            <motion.div key={c.id} layout
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ duration: 0.25, delay: i * 0.04 }}
                                className="glass p-6 rounded-3xl group hover:-translate-y-1 hover:shadow-xl hover:shadow-kings-plum/10 transition-all flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-pastel-magenta/20 text-kings-plum">
                                        {INDUSTRY_LABELS[c.industry] || c.industry}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${STATUS_COLORS[c.status]}`}>
                                        {c.status}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{c.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 flex-grow">{c.description || 'No description'}</p>

                                <div className="mt-4 pt-4 flex items-center justify-between border-t border-snow/50">
                                    <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                        <Mail size={14} /> {c.subject_count ?? 0} subject lines
                                    </span>
                                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link to={`/campaigns/${c.id}`} className="p-2 text-slate-400 hover:text-kings-plum bg-snow/50 rounded-lg transition-colors">
                                            <ArrowUpRight size={16} />
                                        </Link>
                                        <Link to={`/campaigns/${c.id}/edit`} className="p-2 text-slate-400 hover:text-kings-plum bg-snow/50 rounded-lg transition-colors">
                                            <Edit3 size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(c.id, c.title)}
                                            disabled={deletingId === c.id}
                                            className="p-2 text-slate-400 hover:text-red-500 bg-snow/50 rounded-lg transition-colors"
                                        >
                                            {deletingId === c.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filtered.length === 0 && (
                        <div className="col-span-full glass-card flex flex-col items-center justify-center p-12 h-64 text-center">
                            <Mail size={32} className="text-slate-300 mb-3" />
                            <h3 className="text-xl font-bold text-slate-700">No campaigns found</h3>
                            <p className="text-slate-500 mt-2 text-sm">Try adjusting your search or filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CampaignsList;
