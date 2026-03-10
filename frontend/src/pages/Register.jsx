import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { register } from '../services/endpoints';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', first_name: '', last_name: '', password: '', confirm_password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            await register(form);
            navigate('/login');
        } catch (err) {
            setErrors(err.response?.data || { non_field_errors: ['Registration failed. Please try again.'] });
        } finally {
            setLoading(false);
        }
    };

    const fieldError = (key) =>
        errors[key] ? <p className="text-red-500 text-xs mt-1 ml-1">{errors[key]}</p> : null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 py-10">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div style={{ position: 'absolute', top: '-12%', right: '-10%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(173,17,126,0.3) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(211,133,223,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="z-10 w-full max-w-md px-4">
                <div className="glass shadow-2xl rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-soothing-lime via-kings-plum to-pastel-magenta" />

                    <div className="flex flex-col items-center mb-7 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-kings-plum to-pastel-magenta flex items-center justify-center mb-4 shadow-lg shadow-kings-plum/30">
                            <Sparkles className="text-snow h-7 w-7" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
                        <p className="text-slate-500 text-sm mt-1.5 text-center">Start optimizing your email subjects</p>
                    </div>

                    {errors.non_field_errors && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                            {errors.non_field_errors}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">First Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-kings-plum/60" /></div>
                                    <input name="first_name" type="text" className="glass-input pl-10 py-2.5" placeholder="Jane" value={form.first_name} onChange={handleChange} />
                                </div>
                                {fieldError('first_name')}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Last Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-kings-plum/60" /></div>
                                    <input name="last_name" type="text" className="glass-input pl-10 py-2.5" placeholder="Doe" value={form.last_name} onChange={handleChange} />
                                </div>
                                {fieldError('last_name')}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-kings-plum/60" /></div>
                                <input name="email" type="email" required className="glass-input pl-12" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                            </div>
                            {fieldError('email')}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-kings-plum/60" /></div>
                                <input name="password" type="password" required minLength={8} className="glass-input pl-12" placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
                            </div>
                            {fieldError('password')}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-kings-plum/60" /></div>
                                <input name="confirm_password" type="password" required className="glass-input pl-12" placeholder="Repeat password" value={form.confirm_password} onChange={handleChange} />
                            </div>
                            {fieldError('confirm_password')}
                        </div>

                        <button type="submit" disabled={loading} className="glass-button w-full mt-2">
                            {loading ? 'Creating account…' : <><UserPlus size={18} />Create Account</>}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-kings-plum hover:underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
