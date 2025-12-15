import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Phone, X, Clock } from 'lucide-react';
import consultationApi from '../../api/consultation';

/**
 * 医生端在线问诊页面
 * 医生可以查看患者列表，进行在线咨询，发送和接收消息
 */
const DoctorConsultation = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchConsultationSessions();
    }, []);

    // 获取问诊会话列表
    const fetchConsultationSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await consultationApi.getConsultationSessions();
            console.log('问诊会话列表:', res);

            if (res && res.data) {
                if (res.data.results && Array.isArray(res.data.results)) {
                    setSessions(res.data.results);
                } else if (Array.isArray(res.data)) {
                    setSessions(res.data);
                } else {
                    setSessions([]);
                }
            } else if (Array.isArray(res)) {
                setSessions(res);
            } else {
                setSessions([]);
            }
        } catch (err) {
            console.error('获取问诊列表失败:', err);
            setError('获取问诊列表失败');
        } finally {
            setLoading(false);
        }
    };

    // 获取会话详情和消息记录
    const fetchSessionDetail = async (sessionId) => {
        try {
            setError(null);
            const res = await consultationApi.getConsultationDetail(sessionId);
            console.log('问诊详情响应:', res);

            // 提取实际数据（后端可能返回 { code: 0, data: {...} } 或直接 {...}）
            const sessionData = res && res.data ? res.data : res;
            console.log('问诊会话数据:', sessionData);

            if (sessionData && sessionData.id) {
                setSelectedSession(sessionData);
                
                // 提取消息，兼容多种数据结构
                let messages = [];
                if (sessionData.messages) {
                    // 如果是数组，直接使用
                    if (Array.isArray(sessionData.messages)) {
                        messages = sessionData.messages;
                    }
                    // 如果是分页对象 { results: [...], count: X, page: X }
                    else if (sessionData.messages.results && Array.isArray(sessionData.messages.results)) {
                        messages = sessionData.messages.results;
                    }
                    // 如果是普通对象，转换成数组
                    else if (typeof sessionData.messages === 'object') {
                        messages = Object.values(sessionData.messages);
                    }
                } else if (sessionData.chat_records) {
                    // 兼容其他字段名
                    if (Array.isArray(sessionData.chat_records)) {
                        messages = sessionData.chat_records;
                    } else if (sessionData.chat_records.results && Array.isArray(sessionData.chat_records.results)) {
                        messages = sessionData.chat_records.results;
                    } else if (typeof sessionData.chat_records === 'object') {
                        messages = Object.values(sessionData.chat_records);
                    }
                }
                
                console.log('提取的消息:', messages);
                console.log('消息数量:', messages.length);
                setMessages(messages);
            }
        } catch (err) {
            console.error('获取问诊详情失败:', err);
            setError('获取问诊详情失败');
        }
    };

    // 处理选择会话
    const handleSelectSession = (session) => {
        setSelectedSession(session);
        fetchSessionDetail(session.id);
    };

    // 发送消息
    const handleSendMessage = async () => {
        if (!input.trim() || !selectedSession) return;

        try {
            setSending(true);
            console.log('即将发送消息，consultationId:', selectedSession.id, '消息内容:', input);

            const res = await consultationApi.sendMessage(selectedSession.id, input);
            console.log('发送消息响应:', res);

            // 判断成功：HTTP 200 + 有响应数据即可（不依赖 code 字段）
            if (res && res.data) {
                // 乐观更新：立即添加到消息列表
                const newMessage = {
                    id: Date.now(),
                    sender: 'doctor',
                    sender_id: null, // 医生ID
                    content: input,
                    text: input,
                    created_at: new Date().toISOString(),
                    role: 'doctor'
                };
                setMessages([...messages, newMessage]);
                setInput('');
                console.log('消息发送成功');
            } else {
                setError('发送消息失败');
                console.warn('响应没有 data 字段', res);
            }
        } catch (err) {
            console.error('发送消息失败:', err);
            setError('发送消息失败');
        } finally {
            setSending(false);
        }
    };

    // 关闭会话
    const handleCloseSession = async () => {
        if (!selectedSession) return;

        try {
            const res = await consultationApi.closeConsultationSession(selectedSession.id);
            console.log('关闭问诊响应:', res);

            // 只要有响应就认为成功（HTTP 200）
            if (res) {
                alert('问诊已关闭');
                setSelectedSession(null);
                setMessages([]);
                fetchConsultationSessions();
            }
        } catch (err) {
            console.error('关闭会话失败:', err);
            setError('关闭会话失败');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-slate-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-6 animate-fade-in">
            {/* 错误提示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                {/* 左侧：问诊列表 */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare size={20} className="text-blue-600" />
                            在线问诊列表
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">共 {sessions.length} 个问诊</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {sessions.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">
                                <MessageSquare className="mx-auto mb-3 opacity-30" size={40} />
                                <p>暂无问诊记录</p>
                            </div>
                        ) : (
                            sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => handleSelectSession(session)}
                                    className={`p-4 border-b border-slate-100 cursor-pointer transition ${
                                        selectedSession?.id === session.id
                                            ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                            : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            {session.patient_name || session.patient}
                                        </h3>
                                        <span className="text-xs text-slate-400">
                                            {session.created_at ? new Date(session.created_at).toLocaleTimeString() : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 truncate">
                                        {session.latest_message || session.content || '开始问诊...'}
                                    </p>
                                    <div className="mt-2 flex gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            session.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {session.status === 'active' ? '进行中' : '已结束'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 右侧：聊天区域 */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    {selectedSession ? (
                        <>
                            {/* 聊天头部 */}
                            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        {selectedSession.patient_name || selectedSession.patient}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Clock size={14} />
                                        {selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleString() : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseSession}
                                    className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                                    title="关闭问诊"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* 消息列表 */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        <p>暂无消息</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${
                                                msg.role === 'doctor' || msg.sender === 'doctor'
                                                    ? 'justify-end'
                                                    : 'justify-start'
                                            }`}
                                        >
                                            <div
                                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                                    msg.role === 'doctor' || msg.sender === 'doctor'
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                                }`}
                                            >
                                                <p className="text-sm">{msg.content || msg.text}</p>
                                                <p className="text-xs mt-1 opacity-70">
                                                    {msg.created_at
                                                        ? new Date(msg.created_at).toLocaleTimeString()
                                                        : msg.time || ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* 输入框 */}
                            <div className="p-4 border-t border-slate-100 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="输入回复信息..."
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={sending}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending || !input.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <div className="text-center">
                                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                                <p>选择一个问诊开始</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorConsultation;