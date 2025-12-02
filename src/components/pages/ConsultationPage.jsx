import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { MOCK_CHAT_HISTORY } from '../../data/mockData';

// 在线问诊页面
const ConsultationPage = ({currentDoctor}) => {
    const [messages, setMessages] = useState(MOCK_CHAT_HISTORY);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState('current'); // current, history

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg = {id: Date.now(), sender: 'user', text: input, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})};
        setMessages([...messages, newMsg]);
        setInput('');

        // Simulate auto reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'doctor',
                text: '收到您的信息，AI助手正在分析您的描述，医生稍后回复。',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
            }]);
        }, 1000);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 animate-fade-in">
            {/* Sidebar / History List */}
            <div className={`md:w-64 bg-slate-50 border-r border-slate-100 flex flex-col ${activeTab === 'current' ? 'hidden md:flex' : 'flex w-full'}`}>
                <div className="p-4 border-b border-slate-100 font-bold text-slate-700">问诊记录</div>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 hover:bg-white cursor-pointer border-b border-slate-100 transition">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-sm text-slate-800">张智齿 医师</span>
                            <span className="text-[10px] text-slate-400">10:00</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">医生：持续多久了？这是之前的...</p>
                    </div>
                    <div className="p-3 hover:bg-white cursor-pointer border-b border-slate-100 transition opacity-60">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-sm text-slate-800">王洁牙 医师</span>
                            <span className="text-[10px] text-slate-400">昨天</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">问诊已结束。</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${activeTab === 'history' ? 'hidden md:flex' : 'flex'}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        {currentDoctor ? (
                            <>
                                <img src={currentDoctor.avatar} className="w-8 h-8 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800">{currentDoctor.name}</h3>
                                    <span className="flex items-center gap-1 text-[10px] text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 在线</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-slate-500 text-sm">选择医生开始问诊</span>
                        )}
                    </div>
                    <button
                        className="md:hidden text-xs bg-slate-100 px-2 py-1 rounded"
                        onClick={() => setActiveTab(activeTab === 'current' ? 'history' : 'current')}
                    >
                        {activeTab === 'current' ? '查看历史' : '返回聊天'}
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-cyan-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                {msg.text}
                                <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-cyan-100' : 'text-slate-300'}`}>{msg.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入病情描述..."
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full transition shadow-lg shadow-cyan-200"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsultationPage;

