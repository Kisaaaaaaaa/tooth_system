import React from 'react';
import { MapPin, User, MessageSquare, FileText, Activity } from 'lucide-react';
import TechToothModel from '../common/TechToothModel';

// 首页组件
const HomePage = ({ navigateTo }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white overflow-hidden shadow-2xl h-[60vh] flex items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-stretch w-full h-full">
                <div className="flex-1 space-y-4 px-6 md:px-12 flex flex-col justify-center">
                    {/* <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full border border-cyan-500/30">
                        DENTAL AI SYSTEM v2.0
                    </span> */}
                    <h1 className="text-4xl font-bold tracking-tight">智能守护<br /><span className="text-cyan-400">您的微笑</span></h1>
                    <p className="text-slate-300 text-sm max-w-xl">
                        全流程数字化牙科管理。3D可视模型、AI辅助诊断、一键预约名医。
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => navigateTo('appointment')} className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-2 rounded-full font-medium transition shadow-lg shadow-cyan-500/25">
                            立即预约
                        </button>
                        <button onClick={() => navigateTo('hospitals')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-full font-medium transition">
                            寻找诊所
                        </button>
                    </div>
                </div>
                <div className="flex-1 w-full mt-6 md:mt-0 flex justify-center items-center h-full">
                    <TechToothModel />
                </div>
            </div>
        </div>

        {/* 快捷功能区（居中容器） */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: MapPin, label: "找医院", action: () => navigateTo('hospitals'), color: "bg-blue-100 text-blue-600" },
                    { icon: User, label: "找医生", action: () => navigateTo('doctors'), color: "bg-purple-100 text-purple-600" },
                    { icon: MessageSquare, label: "在线问诊", action: () => navigateTo('consultation'), color: "bg-green-100 text-green-600" },
                    { icon: FileText, label: "我的病历", action: () => navigateTo('records'), color: "bg-orange-100 text-orange-600" },
                ].map((item, idx) => (
                    <button key={idx} onClick={item.action} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-slate-100">
                        <div className={`p-3 rounded-xl mb-2 ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                        <span className="text-slate-700 font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* 系统状态 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={18} className="text-cyan-500" />
                        系统概况
                    </h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-slate-800">128</div>
                        <div className="text-xs text-slate-500">今日接诊</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">12</div>
                        <div className="text-xs text-slate-500">在线医生</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">98%</div>
                        <div className="text-xs text-slate-500">好评率</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default HomePage;

