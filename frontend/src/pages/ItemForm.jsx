import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Loader } from 'lucide-react';
import { getCampaign, createCampaign, updateCampaign } from '../services/endpoints';

const STATUSES = ['draft', 'active', 'archived'];
const INDUSTRIES = ['ecommerce', 'saas', 'finance', 'healthcare', 'education', 'other'];

const ItemForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();   // present when editing
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        title: '', description: '', industry: 'other',
        target_audience: '', status: 'draft',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    // Pre-fill form when editing
    useEffect(() => {
        if (!isEdit) return;
        setFetching(true);
        getCampaign(id)
            .then(({ data }) => setForm({
                title: data.title,
                description: data.description,
                industry: data.industry,
                target_audience: data.target_audience,
                status: data.status,
            }))
            .finally(() => setFetching(false));
    }, [id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (form.title.trim().length < 3) newErrors.title = 'Title must be at least 3 characters';
        setErrors(newErrors);
        if (Object.keys(newErrors).length) return;

        setLoading(true);
        try {
            if (isEdit) {
                await updateCampaign(id, form);
                navigate(`/campaigns/${id}`);
            } else {
                const { data } = await createCampaign(form);
                navigate(`/campaigns/${data.id}`);
            }
        } catch (err) {
            const data = err.response?.data || {};
            setErrors(data);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-kings-plum" size={32} />
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{isEdit ? 'Edit Campaign' : 'New Campaign'}</h1>
                    <p className="text-slate-500 mt-1 text-sm">{isEdit ? 'Update your campaign details' : 'Create a new email marketing campaign'}</p>
                </div>
                <button onClick={() => navigate(isEdit ? `/campaigns/${id}` : '/campaigns')} className="glass py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors text-sm">
                    <X size={16} /> Cancel
                </button>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-soothing-lime via-kings-plum to-pastel-magenta" />

                <form onSubmit={handleSubmit} className="space-y-5 mt-3">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Campaign Title <span className="text-kings-plum">*</span></label>
                        <input name="title" type="text" className={`glass-input w-full ${errors.title ? 'ring-1 ring-red-400 border-red-400' : ''}`}
                            placeholder="e.g. Black Friday 2026 Sale" value={form.title} onChange={handleChange} />
                        {errors.title && <p className="text-red-500 text-xs mt-1 ml-1">{errors.title}</p>}
                    </div>

                    {/* Industry + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Industry</label>
                            <select name="industry" className="glass-input w-full" value={form.industry} onChange={handleChange}>
                                {INDUSTRIES.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Status</label>
                            <select name="status" className="glass-input w-full" value={form.status} onChange={handleChange}>
                                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Target Audience</label>
                        <input name="target_audience" type="text" className="glass-input w-full"
                            placeholder="e.g. Women 25-40 interested in fashion" value={form.target_audience} onChange={handleChange} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Description / Notes</label>
                        <textarea name="description" rows={4} className="glass-input w-full resize-none"
                            placeholder="What is this campaign about? Include promotional details…"
                            value={form.description} onChange={handleChange} />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={loading} className="glass-button">
                            {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                            {isEdit ? 'Save Changes' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ItemForm;
