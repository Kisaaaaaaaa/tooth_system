import React, { useEffect, useState } from 'react';
import api from '../../api/auth';

// 顶部导航栏组件
const Navbar = ({ currentPage, navigateTo }) => {
    const pageLabels = {
        'home': '首页',
        'model3d': '3D模型',
        'hospitals': '医院',
        'doctors': '医生',
        'consultation': '问诊',
        'appointment': '预约',
        'records': '病历',
        'aiInquiry': 'AI问询'
    };

    const [user, setUser] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('user');
        if (raw) {
            try { setUser(JSON.parse(raw)); } catch { setUser(null); }
        }

        const onStorage = (e) => {
            if (e.key === 'user' || e.key === 'authToken') {
                const r = localStorage.getItem('user');
                if (r) { try { setUser(JSON.parse(r)); } catch { setUser(null); } }
                else setUser(null);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleLogout = async () => {
        try {
            await api.logout();
        } catch (e) {
            // ignore server error, still clear client state
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('pendingRegistration');
        localStorage.removeItem('guest');
        setUser(null);
        navigateTo('home');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30">
                        D
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-800">未来诊所</span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500 items-center">
                        {['home', 'model3d', 'hospitals', 'doctors', 'consultation', 'appointment', 'records', 'aiInquiry'].map(page => (
                            <button
                                key={page}
                                onClick={() => navigateTo(page)}
                                className={`hover:text-cyan-600 transition ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                            >
                                {pageLabels[page]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <span className="text-sm text-slate-700">{user.name || user.phone || '已登录'}</span>
                                <button onClick={handleLogout} className="text-sm px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 transition">登出</button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigateTo('login')}
                                    className="text-sm px-3 py-1 rounded hover:bg-slate-100 transition"
                                >
                                    登录
                                </button>

                                <button
                                    onClick={() => navigateTo('register')}
                                    className="text-sm px-3 py-1 rounded bg-cyan-600 text-white hover:bg-cyan-700 transition"
                                >
                                    注册
                                </button>
                            </>
                        )}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                        <img src="https://i.pravatar.cc/150?u=user" alt="User" />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

