import React, { useState } from 'react';
import { Star, MessageSquare, Calendar, Filter } from 'lucide-react';
import { MOCK_DOCTORS } from '../../data/mockData';

// 医生概况页面
const DoctorsPage = ({navigateTo, startConsultation}) => {
    const [view, setView] = useState('list'); // list, rank

    const sortedDoctors = [...MOCK_DOCTORS].sort((a, b) => view === 'rank' ? b.score - a.score : 0);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <div className="flex gap-1">
                    <button
                        onClick={() => setView('list')}
                        className={`px-4 py-1.5 rounded-lg text-sm transition ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        全部医生
                    </button>
                    <button
                        onClick={() => setView('rank')}
                        className={`px-4 py-1.5 rounded-lg text-sm transition ${view === 'rank' ? 'bg-amber-100 text-amber-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        🏆 排行榜
                    </button>
                </div>
                <Filter size={18} className="text-slate-400 mr-2" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {sortedDoctors.map((doc, index) => (
                    <div key={doc.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 relative">
                        {view === 'rank' && index < 3 && (
                            <div className="absolute top-0 right-0 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl shadow-sm">
                                TOP {index + 1}
                            </div>
                        )}
                        <div className="flex items-start gap-4">
                            <img src={doc.avatar} alt={doc.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{doc.name}</h3>
                                        <p className="text-xs text-slate-500">{doc.title} · {doc.specialty}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-bold">{doc.score}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{doc.reviews}条患者评价</p>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => startConsultation(doc)}
                                        className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-1"
                                    >
                                        <MessageSquare size={14} /> 在线问诊
                                    </button>
                                    <button
                                        onClick={() => navigateTo('appointment')}
                                        className="flex-1 py-1.5 bg-cyan-500 text-white text-xs font-medium rounded-lg hover:bg-cyan-600 transition flex items-center justify-center gap-1 shadow-sm shadow-cyan-200"
                                    >
                                        <Calendar size={14} /> 预约挂号
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorsPage;

