import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, BarChart2, MessageSquare, CheckCircle } from 'lucide-react';

/* ── Floating particle component ─────────────────── */
const Orb = ({ style }) => (
    <div className="absolute rounded-full pointer-events-none" style={style} />
);

/* ── Animated counter ─────────────────────────────── */
const features = [
    {
        icon: <Zap size={22} />,
        title: 'AI-Powered Suggestions',
        desc: 'Get subject lines crafted by advanced language models trained on millions of high-performing emails.',
    },
    {
        icon: <BarChart2 size={22} />,
        title: 'Performance Analytics',
        desc: 'Track open rates, click-through rates, and A/B test results from one elegant dashboard.',
    },
    {
        icon: <MessageSquare size={22} />,
        title: 'Interactive AI Chat',
        desc: 'Brainstorm, iterate, and refine subject lines in a natural conversation with your AI partner.',
    },
];

const stats = [
    { value: '3.2×', label: 'Avg. Open Rate Lift' },
    { value: '98%', label: 'AI Accuracy Score' },
    { value: '12k+', label: 'Campaigns Optimized' },
];

/* ── Page ─────────────────────────────────────────── */
const LandingPage = () => (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">

        {/* ── Background atmosphere ── */}
        <div className="fixed inset-0 -z-10 bg-slate-950">
            <Orb style={{ top: '-12%', left: '-10%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(173,17,126,0.35) 0%, transparent 70%)' }} />
            <Orb style={{ bottom: '-15%', right: '-8%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(211,133,223,0.25) 0%, transparent 70%)' }} />
            <Orb style={{ top: '45%', left: '55%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(214,229,116,0.12) 0%, transparent 70%)' }} />
        </div>

        {/* ── Nav ── */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-14 py-5">
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kings-plum to-pastel-magenta flex items-center justify-center shadow-lg shadow-kings-plum/30">
                    <Sparkles size={18} className="text-snow" />
                </div>
                <span className="text-snow font-bold text-lg tracking-tight">SubjectAI</span>
            </div>
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-snow/60 hover:text-snow text-sm font-medium transition-colors hidden md:block">Dashboard</Link>
                <Link
                    to="/login"
                    className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-snow text-sm font-semibold hover:bg-white/15 transition-all"
                >
                    Sign In
                </Link>
            </div>
        </nav>

        {/* ── Hero ── */}
        <main className="flex-grow flex flex-col items-center justify-center text-center px-6 pt-8 pb-20 relative z-10">

            {/* Badge */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-kings-plum/40 bg-kings-plum/10 backdrop-blur-md text-pastel-magenta text-xs font-semibold mb-8"
            >
                <Sparkles size={12} />
                Powered by Next-Gen AI · v2.0 Launch
            </motion.div>

            {/* Headline */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-extrabold text-snow leading-[1.08] tracking-tighter max-w-4xl"
            >
                Email subjects that{' '}
                <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-kings-plum via-pastel-magenta to-soothing-lime bg-clip-text text-transparent">
                        actually get opened
                    </span>
                    {/* Underline glow */}
                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-kings-plum to-pastel-magenta opacity-60" />
                </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-lg md:text-xl text-snow/55 max-w-2xl leading-relaxed"
            >
                Harness the power of AI to craft irresistible subject lines, run
                smart A/B tests, and lift your open rates — all from one sleek platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row items-center gap-4"
            >
                <Link
                    to="/dashboard"
                    className="group inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-kings-plum to-[#c9159a] text-snow font-bold text-base shadow-xl shadow-kings-plum/30 hover:shadow-kings-plum/50 hover:-translate-y-0.5 transition-all"
                >
                    Get Started Free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                    to="/ai"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-sm text-snow/80 font-semibold text-base hover:bg-white/14 hover:text-snow transition-all"
                >
                    <MessageSquare size={18} />
                    Try the AI Chat
                </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="mt-16 flex flex-col sm:flex-row items-center gap-6 sm:gap-12"
            >
                {stats.map((s, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pastel-magenta to-soothing-lime bg-clip-text text-transparent">{s.value}</span>
                        <span className="text-snow/45 text-sm mt-1 font-medium">{s.label}</span>
                    </div>
                ))}
            </motion.div>

            {/* ── Feature Cards ── */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full">
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                        className="group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-left hover:border-kings-plum/40 hover:bg-white/8 transition-all cursor-default"
                    >
                        {/* Icon */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-kings-plum/30 to-pastel-magenta/20 flex items-center justify-center text-pastel-magenta mb-4 group-hover:shadow-lg group-hover:shadow-kings-plum/20 transition-all">
                            {f.icon}
                        </div>
                        <h3 className="text-snow font-bold text-base mb-2">{f.title}</h3>
                        <p className="text-snow/50 text-sm leading-relaxed">{f.desc}</p>
                        {/* Glow on hover */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-kings-plum/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                ))}
            </div>

            {/* ── Trust line ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-16 flex items-center gap-2 text-snow/35 text-xs"
            >
                <CheckCircle size={14} className="text-soothing-lime" />
                No credit card required · Free tier available · GDPR compliant
            </motion.div>

        </main>
    </div>
);

export default LandingPage;
