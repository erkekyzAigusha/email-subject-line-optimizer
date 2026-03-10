import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, MessageSquare, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: <Home size={22} />, label: 'Dashboard' },
        { path: '/campaigns', icon: <LayoutGrid size={22} />, label: 'Campaigns' },
        { path: '/ai', icon: <MessageSquare size={22} />, label: 'AI Chat' },
        ...(user?.is_admin ? [{ path: '/admin', icon: <Shield size={22} />, label: 'Admin' }] : []),
    ];

    return (
        <div className="min-h-screen relative flex flex-col items-center">
            {/* Background atmosphere */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]" style={{ background: 'rgba(173,17,126,0.08)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px]" style={{ background: 'rgba(211,133,223,0.15)' }} />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(214,229,116,0.08)' }} />
            </div>

            {/* Floating Navigation Dock */}
            <nav className="fixed bottom-6 z-50 glass rounded-full px-7 py-3.5 flex items-center gap-7 shadow-xl md:bottom-10">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link key={item.path} to={item.path}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 relative group ${isActive ? 'text-kings-plum' : 'text-slate-500 hover:text-kings-plum/70 hover:scale-110'
                                }`}
                        >
                            {item.icon}
                            {isActive && (
                                <motion.div layoutId="activeNav"
                                    className="absolute -bottom-2.5 w-1.5 h-1.5 rounded-full bg-kings-plum"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-snow text-xs px-2.5 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <div className="w-px h-6 bg-kings-plum/20 mx-1" />
                <button onClick={handleLogout}
                    className="text-slate-500 hover:text-red-500 hover:scale-110 transition-all group relative"
                >
                    <LogOut size={20} />
                    <span className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-snow text-xs px-2.5 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                        Logout
                    </span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="z-10 w-full max-w-7xl px-4 py-8 md:px-8 pb-32 flex-grow flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -18 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="w-full flex-grow flex flex-col"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
