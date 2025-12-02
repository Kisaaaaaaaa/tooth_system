import React from 'react';
import { Activity, User, Calendar, MessageSquare, FileText } from 'lucide-react';

// 移动端底部导航组件
const BottomNav = ({ currentPage, navigateTo }) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-50">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-cyan-600' : 'text-slate-400'}`}>
                <div className="p-1"><Activity size={20} /></div>
            </button>
            <button onClick={() => navigateTo('model3d')} className={`flex flex-col items-center gap-1 ${currentPage === 'model3d' ? 'text-cyan-600' : 'text-slate-400'}`}>
                <div className="p-1"><User size={20} /></div>
            </button>
            <button onClick={() => navigateTo('doctors')} className={`flex flex-col items-center gap-1 ${currentPage === 'doctors' ? 'text-cyan-600' : 'text-slate-400'}`}>
                <div className="p-1"><User size={20} /></div>
            </button>
            <div className="relative -top-6">
                <button onClick={() => navigateTo('appointment')} className="bg-cyan-500 text-white p-4 rounded-full shadow-lg shadow-cyan-500/40">
                    <Calendar size={24} />
                </button>
            </div>
            <button onClick={() => navigateTo('consultation')} className={`flex flex-col items-center gap-1 ${currentPage === 'consultation' ? 'text-cyan-600' : 'text-slate-400'}`}>
                <div className="p-1"><MessageSquare size={20} /></div>
            </button>
            <button onClick={() => navigateTo('records')} className={`flex flex-col items-center gap-1 ${currentPage === 'records' ? 'text-cyan-600' : 'text-slate-400'}`}>
                <div className="p-1"><FileText size={20} /></div>
            </button>
        </div>
    );
};

export default BottomNav;

