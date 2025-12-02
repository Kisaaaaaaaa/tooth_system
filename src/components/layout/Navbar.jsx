import React from 'react';

// 顶部导航栏组件
const Navbar = ({ currentPage, navigateTo }) => {
    const pageLabels = {
        'home': '首页',
        'hospitals': '医院',
        'doctors': '医生',
        'consultation': '问诊',
        'appointment': '预约',
        'records': '病历'
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30">
                        D
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-800">未来诊所</span>
                </div>

                <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
                    {['home', 'hospitals', 'doctors', 'consultation', 'appointment', 'records'].map(page => (
                        <button
                            key={page}
                            onClick={() => navigateTo(page)}
                            className={`hover:text-cyan-600 transition ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                        >
                            {pageLabels[page]}
                        </button>
                    ))}
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                    <img src="https://i.pravatar.cc/150?u=user" alt="User" />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

