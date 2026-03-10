import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trash2, Plus, ArrowLeft, Edit3, Loader, Bot, User, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
    getCampaign, deleteCampaign, deleteSubjectLine,
    createSubjectLine, generateSubjects
} from '../services/endpoints';

const TONE_CHOICES = ['professional', 'casual', 'urgent', 'curious', 'funny'];

const CampaignDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState('');
    const [newSubject, setNewSubject] = useState({ text: '', tone: 'professional' });
    const [addingSubject, setAddingSubject] = useState(false);
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        getCampaign(id)
            .then(({ data }) => setCampaign(data))
            .catch(() => setError('Could not load campaign.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    const handleDeleteCampaign = async () => {
        if (!window.confirm('Delete this campaign and all its subject lines?')) return;
        await deleteCampaign(id);
        navigate('/campaigns');
    };

    const handleDeleteSubject = async (subId) => {
        await deleteSubjectLine(subId);
        setCampaign(prev => ({ ...prev, subject_lines: prev.subject_lines.filter(s => s.id !== subId) }));
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.text.trim()) return;
        setAddingSubject(true);
        try {
            const { data } = await createSubjectLine(id, newSubject);
            setCampaign(prev => ({ ...prev, subject_lines: [data, ...prev.subject_lines] }));
            setNewSubject({ text: '', tone: 'professional' });
        } catch (err) {
            setError(err.response?.data?.text?.[0] || 'Failed to add subject line.');
        } finally {
            setAddingSubject(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setGenResult('');
        try {
            const { data } = await generateSubjects(id);
            setGenResult(data.result);
            // Reload campaign to show newly saved subjects
            load();
        } catch (err) {
            setError(err.response?.data?.error || 'AI generation failed.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-kings-plum" size={36} />
        </div>
    );
    if (!campaign) return <p className="text-center text-red-500 mt-12">{error || 'Campaign not found.'}</p>;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <header className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/campaigns')} className="p-2 glass rounded-xl text-slate-500 hover:text-kings-plum transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{campaign.title}</h1>
                        <p className="text-slate-500 text-sm mt-0.5">{campaign.industry} · {campaign.status}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to={`/campaigns/${id}/edit`} className="glass-button-secondary py-2 px-4 text-sm">
                        <Edit3 size={16} /> Edit
                    </Link>
                    <button onClick={handleDeleteCampaign} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </header>

            {/* Description */}
            {campaign.description && (
                <div className="glass-card py-4">
                    <p className="text-slate-600 text-sm leading-relaxed">{campaign.description}</p>
                    {campaign.target_audience && (
                        <p className="text-xs text-slate-400 mt-2">🎯 Target: {campaign.target_audience}</p>
                    )}
                </div>
            )}

            {/* AI Generate button */}
            <motion.div className="glass-card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Bot size={20} className="text-kings-plum" />
                        <h3 className="font-bold text-slate-800">AI Generation</h3>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="glass-button py-2 px-4 text-sm"
                    >
                        {generating ? <><Loader size={16} className="animate-spin" /> Generating…</> : <><Zap size={16} /> Generate Subject Lines</>}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <AnimatePresence>
                    {genResult && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-snow/60 border border-snow rounded-xl p-4 mt-3 overflow-hidden"
                        >
                            <div className="flex items-center gap-2 text-lime-700 font-semibold mb-3 text-xs">
                                <CheckCircle size={14} /> AI subjects saved to this campaign below
                            </div>
                            <div className="ai-markdown">
                                <ReactMarkdown>{genResult}</ReactMarkdown>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Add Subject Manually */}
            <div className="glass-card">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-kings-plum" /> Add Subject Line Manually
                </h3>
                <form onSubmit={handleAddSubject} className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        className="glass-input flex-grow"
                        placeholder="Enter your subject line text…"
                        value={newSubject.text}
                        onChange={e => setNewSubject(p => ({ ...p, text: e.target.value }))}
                        maxLength={150}
                        required
                    />
                    <select
                        className="glass-input md:w-44"
                        value={newSubject.tone}
                        onChange={e => setNewSubject(p => ({ ...p, tone: e.target.value }))}
                    >
                        {TONE_CHOICES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="submit" disabled={addingSubject} className="glass-button py-2.5 px-5 whitespace-nowrap">
                        {addingSubject ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                        Add
                    </button>
                </form>
            </div>

            {/* Subject Lines List */}
            <div className="glass-card">
                <h3 className="font-bold text-slate-800 mb-4">
                    Subject Lines ({campaign.subject_lines?.length ?? 0})
                </h3>
                {campaign.subject_lines?.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No subject lines yet. Generate some with AI or add manually.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {campaign.subject_lines.map(s => (
                            <motion.div
                                key={s.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between gap-3 p-3 bg-snow/40 rounded-xl group hover:bg-snow/60 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {s.is_ai_generated
                                        ? <Bot size={16} className="text-kings-plum shrink-0" />
                                        : <User size={16} className="text-slate-400 shrink-0" />
                                    }
                                    <p className="text-sm text-slate-700 truncate font-medium">{s.text}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs px-2 py-0.5 bg-pastel-magenta/10 text-kings-plum rounded-full capitalize hidden md:inline">{s.tone}</span>
                                    {s.performance_score != null && (
                                        <span className="text-xs px-2 py-0.5 bg-soothing-lime/30 text-lime-700 rounded-full">Score: {s.performance_score}</span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteSubject(s.id)}
                                        className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 bg-snow/60 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignDetail;
