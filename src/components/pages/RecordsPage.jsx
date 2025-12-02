import React from 'react';
import { FileText, Star } from 'lucide-react';
import { MOCK_RECORDS } from '../../data/mockData';

// 历史就诊页面（移除 AI 分析）
const RecordsPage = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800">就诊档案</h2>

            {MOCK_RECORDS.map(record => (
                <div key={record.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <FileText className="text-cyan-500" size={20} />
                            <span className="font-bold text-slate-700">{record.date}</span>
                        </div>
                        <span className="text-sm text-slate-500">{record.doctor} 医生</span>
                    </div>

                    <div className="p-5">
                        <h3 className="font-bold text-lg text-slate-800 mb-2">诊断：{record.diagnosis}</h3>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{record.content}</p>

                        <div className="bg-slate-100 rounded-lg p-3 mb-4 text-xs text-slate-500 flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">IMG</div>
                            <span>{record.resultImage}.jpg （医生已上传）</span>
                        </div>

                        {/* Rating */}
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                            <span className="text-sm text-slate-500">就诊评价</span>
                            {record.rated ? (
                                <div className="flex text-amber-400 gap-1">
                                    {[...Array(record.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                </div>
                            ) : (
                                <button className="text-sm text-cyan-600 font-medium hover:underline">
                                    去评价
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecordsPage;

