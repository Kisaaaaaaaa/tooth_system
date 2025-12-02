import React, { useState } from 'react';
import { FileText, Brain, Star } from 'lucide-react';
import { MOCK_RECORDS } from '../../data/mockData';

// 历史就诊 & AI 分析页面
const RecordsPage = () => {
    const [analyzingId, setAnalyzingId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState({});

    const runAIAnalysis = (id) => {
        setAnalyzingId(id);
        // Mock AI delay
        setTimeout(() => {
            setAnalyzingId(null);
            setAnalysisResult({
                ...analysisResult,
                [id]: "【AI 智能分析】\n基于上传的影像结果，系统检测到左下智齿（第38号牙）存在近中阻生情况，压迫邻牙牙根。建议尽早进行微创拔除手术，以防引起第二磨牙龋坏或牙周炎。手术难度评估：中等。"
            });
        }, 2000);
    };

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
                        <span className="text-sm text-slate-500">{record.doctor} 医师</span>
                    </div>

                    <div className="p-5">
                        <h3 className="font-bold text-lg text-slate-800 mb-2">诊断：{record.diagnosis}</h3>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{record.content}</p>

                        <div className="bg-slate-100 rounded-lg p-3 mb-4 text-xs text-slate-500 flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">IMG</div>
                            <span>{record.resultImage}.jpg (医生已上传)</span>
                        </div>

                        {/* AI Analysis Section */}
                        {analysisResult[record.id] ? (
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4 text-sm text-indigo-800 relative">
                                <Brain className="absolute top-4 right-4 text-indigo-200" size={40} />
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Brain size={16} /> AI 智能分析报告
                                </h4>
                                <p className="whitespace-pre-wrap">{analysisResult[record.id]}</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => runAIAnalysis(record.id)}
                                disabled={analyzingId === record.id}
                                className="mb-4 w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                            >
                                {analyzingId === record.id ? (
                                    <>
                                        <span className="animate-spin">⌛</span> 正在调用医疗大模型分析中...
                                    </>
                                ) : (
                                    <>
                                        <Brain size={18} /> 点击进行 AI 智能分析
                                    </>
                                )}
                            </button>
                        )}

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

