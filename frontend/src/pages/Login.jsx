import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const detail = err.response?.data?.detail || 'Invalid credentials. Please try again.';
            setError(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Background orbs */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div style={{ position: 'absolute', top: '-12%', left: '-10%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(173,17,126,0.35) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-15%', right: '-8%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(211,133,223,0.25) 0%, transparent 70%)', borderRadius: '50%' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="z-10 w-full max-w-md px-4"
            >
                <div className="glass shadow-2xl rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pastel-magenta via-kings-plum to-soothing-lime" />

                    <div className="flex flex-col items-center mb-8 mt-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-kings-plum to-pastel-magenta flex items-center justify-center mb-4 shadow-lg shadow-kings-plum/30">
                            <Sparkles className="text-snow h-7 w-7" />
                        </div>
                        <h1 className="text-3xl font-bold text-center text-slate-800 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 text-center mt-1.5 text-sm">Sign in to your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-kings-plum/60" />
                                </div>
                                <input id="email" type="email" required className="glass-input pl-12" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-kings-plum/60" />
                                </div>
                                <input id="password" type="password" required className="glass-input pl-12" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="glass-button w-full mt-2" style={{ opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Signing in…' : <>Sign In <ArrowRight className="h-5 w-5" /></>}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        No account?{' '}
                        <Link to="/register" className="font-semibold text-kings-plum hover:underline">Create one</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
