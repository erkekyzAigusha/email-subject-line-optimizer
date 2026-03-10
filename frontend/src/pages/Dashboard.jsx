import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Users, TrendingUp, Activity, ArrowUpRight, Plus, Zap, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCampaigns } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, delay, sub }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        className="glass-card flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-snow/30 rounded-xl">
                <Icon className="text-kings-plum h-6 w-6" />
            </div>
        </div>
        <div>
            <h3 className="text-slate-500 font-medium mb-1 text-sm">{title}</h3>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    </motion.div>
);

const STATUS_COLORS = {
    active: 'border-lime-500/60 text-lime-600',
    draft: 'border-slate-300 text-slate-500',
    archived: 'border-red-300/60 text-red-400',
};

const Dashboard = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getCampaigns()
            .then(({ data }) => {
                // handle both paginated and plain list responses
                setCampaigns(data.results ?? data);
            })
            .catch(() => setError('Could not load campaigns.'))
            .finally(() => setLoading(false));
    }, []);

    const active = campaigns.filter(c => c.status === 'active').length;
    const draft = campaigns.filter(c => c.status === 'draft').length;
    const archived = campaigns.filter(c => c.status === 'archived').length;
    const totalSubjects = campaigns.reduce((s, c) => s + (c.subject_count || 0), 0);

    return (
        <div className="w-full flex flex-col gap-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 px-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Hello, {user?.first_name || user?.email?.split('@')[0]} 👋
                    </h1>
                    <p className="text-slate-500 mt-1">Here's your optimization overview.</p>
                </div>
                <Link to="/campaigns/new" className="glass-button py-2.5 px-5 text-sm whitespace-nowrap">
                    <Zap size={18} />
                    New Campaign
                </Link>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Campaigns" value={loading ? '…' : campaigns.length} icon={Mail} delay={0.1} />
                <StatCard title="Active" value={loading ? '…' : active} icon={Activity} delay={0.15} sub="running now" />
                <StatCard title="Drafts" value={loading ? '…' : draft} icon={TrendingUp} delay={0.2} />
                <StatCard title="Subject Lines" value={loading ? '…' : totalSubjects} icon={Users} delay={0.25} sub="across all campaigns" />
            </div>

            {/* Campaign list */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="glass-card flex flex-col"
            >
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">My Campaigns</h3>
                    <Link to="/campaigns" className="text-sm text-kings-plum font-semibold hover:underline">View all</Link>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin text-kings-plum" size={28} />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Mail size={36} className="text-slate-300 mb-3" />
                        <p className="text-slate-600 font-semibold">No campaigns yet</p>
                        <p className="text-slate-400 text-sm mt-1">Create your first campaign to get started.</p>
                        <Link to="/campaigns/new" className="glass-button mt-4 text-sm py-2 px-5">
                            <Plus size={16} /> Create Campaign
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {campaigns.slice(0, 8).map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                className="flex items-center justify-between p-3 bg-snow/40 rounded-xl hover:bg-snow/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-pastel-magenta/20 flex items-center justify-center text-kings-plum font-bold text-sm">
                                        {c.title.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800">{c.title}</p>
                                        <p className="text-xs text-slate-400">{c.industry} · {c.subject_count ?? 0} subjects</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${STATUS_COLORS[c.status] || 'border-slate-300 text-slate-500'}`}>
                                        {c.status}
                                    </span>
                                    <Link to={`/campaigns/${c.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-kings-plum hover:bg-kings-plum/10 transition-colors">
                                        <ArrowUpRight size={16} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Dashboard;
