import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Clock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import consultationApi from '../../api/consultation';

/**
 * 医生端在线问诊页面
 * 医生可以查看患者列表,进行在线咨询，发送和接收消息
 */
const DoctorConsultation = () => {
    // const STORAGE_KEY = 'doctor_consult_selected_session_id';
    const [sessions, setSessions] = useState([]);
    // 默认不选中任何会话
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const listRef = useRef(null);
    const pollingTimerRef = useRef(null);

    const normalizeMessage = (m, idx) => {
        // DoctorConsultation 里渲染兼容 msg.content/msg.text、msg.created_at/msg.time
        const text = m?.content ?? m?.text ?? '';
        const time = m?.created_at ?? m?.time ?? '';
        return {
            ...m,
            id: m?.id ?? idx,
            content: m?.content ?? text,
            text: m?.text ?? text,
            created_at: m?.created_at ?? time,
            time: m?.time ?? time,
        };
    };

    const mergeMessagesById = (prev, next) => {
        const map = new Map();
        (prev || []).forEach((m, i) => {
            if (!m) return;
            const key = m.id ?? `idx-${i}`;
            map.set(key, m);
        });
        (next || []).forEach((m, i) => {
            if (!m) return;
            const key = m.id ?? `idx-${i}`;
            map.set(key, m);
        });
        const merged = Array.from(map.values());
        merged.sort((a, b) => {
            const ta = a?.created_at || a?.time ? new Date(a.created_at || a.time).getTime() : 0;
            const tb = b?.created_at || b?.time ? new Date(b.created_at || b.time).getTime() : 0;
            if (ta !== tb) return ta - tb;
            const ia = typeof a?.id === 'number' ? a.id : Number.NaN;
            const ib = typeof b?.id === 'number' ? b.id : Number.NaN;
            if (!Number.isNaN(ia) && !Number.isNaN(ib) && ia !== ib) return ia - ib;
            return 0;
        });
        return merged;
    };

    useEffect(() => {
        // 只加载会话列表，不自动恢复上次会话
        fetchConsultationSessions();
    }, []);

    // 滚动到底部
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    // 获取患者姓名
    const getPatientName = (session) => {
        // 优先使用 user_name 或 patient_name
        if (session.user_name) return session.user_name;
        if (session.patient_name) return session.patient_name;

        // 如果有 user 对象
        if (session.user) {
            if (session.user.name) return session.user.name;
            if (session.user.phone) return `患者 ${session.user.phone.slice(-4)}`;
        }

        // 如果有 patient 对象
        if (session.patient) {
            if (session.patient.name) return session.patient.name;
            if (session.patient.phone) return `患者 ${session.patient.phone.slice(-4)}`;
        }

        // 最后尝试使用 phone 字段
        if (session.phone) return `患者 ${session.phone.slice(-4)}`;
        if (session.user_phone) return `患者 ${session.user_phone.slice(-4)}`;

        return '患者';
    };

    // 获取问诊会话列表
    const fetchConsultationSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await consultationApi.getConsultationSessions();
            console.log('问诊会话列表:', res);

            let sessionList = [];
            if (res && res.data) {
                if (res.data.results && Array.isArray(res.data.results)) {
                    sessionList = res.data.results;
                } else if (Array.isArray(res.data)) {
                    sessionList = res.data;
                }
            } else if (Array.isArray(res)) {
                sessionList = res;
            }

            setSessions(sessionList);
        } catch (err) {
            console.error('获取问诊列表失败:', err);
            setError('获取问诊列表失败');
        } finally {
            setLoading(false);
        }
    };

    // 获取会话详情和消息记录
    const fetchSessionDetail = async (sessionId, opts = {}) => {
        try {
            const { merge = false, silent = false } = opts;
            if (!silent) setError(null);
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
                const normalized = messages.map(normalizeMessage);
                if (merge) {
                    setMessages((prev) => mergeMessagesById(prev, normalized));
                } else {
                    setMessages(normalized);
                }
            }
        } catch (err) {
            console.error('获取问诊详情失败:', err);
            if (!opts?.silent) setError('获取问诊详情失败');
        }
    };

    // 选中会话后自动轮询刷新消息（无需手动刷新）
    useEffect(() => {
        if (!selectedSession?.id) return;

        const POLL_MS = 2500;
        let cancelled = false;

        const tick = async () => {
            if (cancelled) return;
            if (document.visibilityState !== 'visible') return;
            await fetchSessionDetail(selectedSession.id, { merge: true, silent: true });
        };

        tick();
        pollingTimerRef.current = setInterval(tick, POLL_MS);

        return () => {
            cancelled = true;
            if (pollingTimerRef.current) {
                clearInterval(pollingTimerRef.current);
                pollingTimerRef.current = null;
            }
        };
    }, [selectedSession?.id]);

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

            // 检查业务状态码
            const bizCode = res?.code ?? res?.status ?? res?.data?.code;
            if (bizCode && Number(bizCode) >= 400) {
                const msg = res?.message || res?.data?.message || '发送消息失败';
                setError(msg);
                console.warn('发送消息失败:', msg);
                return;
            }

            // 判断成功：HTTP 200 + 有响应数据即可（不依赖 code 字段）
            if (res && res.data) {
                // 发送成功后，避免本地重复追加，改为立即拉取最新消息（服务端权威）
                const sentText = input;
                setInput('');
                await fetchSessionDetail(selectedSession.id, { merge: true, silent: true });
                console.log('消息发送成功，已刷新会话消息');
            } else {
                setError('发送消息失败');
                console.warn('响应没有 data 字段', res);
            }
        } catch (err) {
            console.error('发送消息失败:', err);
            const errorMsg = err?.message || '发送消息失败';
            setError(errorMsg);
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
                // 关闭后清理持久化的会话ID
                try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
            }
        } catch (err) {
            console.error('关闭会话失败:', err);
            setError('关闭会话失败');
        }
    };

    // 格式化时间
    const formatMessageTime = (timeString) => {
        if (!timeString) return '';

        const now = new Date();
        const msgDate = new Date(timeString);

        // 如果时间字符串只有时间部分（如"10:00"），则添加今天的日期
        if (timeString.match(/^\d{2}:\d{2}$/)) {
            msgDate.setFullYear(now.getFullYear());
            msgDate.setMonth(now.getMonth());
            msgDate.setDate(now.getDate());
        }

        const isToday = msgDate.toDateString() === now.toDateString();

        if (isToday) {
            // 今天的消息只显示时间
            return msgDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else {
            // 非今天的消息显示完整日期时间
            return msgDate.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // 按时间分组消息
    const groupMessagesByTime = () => {
        if (!messages || !messages.length) return [];

        const grouped = [];
        let currentGroup = { messages: [], time: formatMessageTime(messages[0]?.created_at || messages[0]?.time) };

        messages.forEach((msg, index) => {
            if (!msg) return; // 跳过空消息
            const msgTime = formatMessageTime(msg.created_at || msg.time);

            // 如果是第一条消息，或者时间间隔超过一定阈值，则创建新分组
            if (index === 0 || msgTime !== currentGroup.time) {
                if (index > 0) {
                    grouped.push({ ...currentGroup });
                }
                currentGroup = { messages: [msg], time: msgTime };
            } else {
                currentGroup.messages.push(msg);
            }
        });

        grouped.push(currentGroup);
        return grouped;
    };

    // 渲染侧边栏
    const renderSidebar = () => {
        return (
            <div className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-full ${sidebarOpen ? 'w-72' : 'w-16'}`}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <h3 className={`font-bold text-slate-800 transition-all duration-300 ${sidebarOpen ? 'text-lg' : 'text-xs text-center w-full'}`}>
                        {sidebarOpen ? '问诊列表' : '列表'}
                    </h3>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded-full hover:bg-slate-100 transition flex items-center justify-center"
                    >
                        <span className={`text-lg font-bold transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}>&lt;</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                            <MessageSquare className="mx-auto mb-3 opacity-30" size={40} />
                            <p className="text-sm">暂无问诊记录</p>
                        </div>
                    ) : (
                        sessions.map(session => {
                            const isActive = selectedSession?.id === session.id;
                            return (
                                <div
                                    key={session.id}
                                    onClick={() => handleSelectSession(session)}
                                    className={`p-3 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition ${isActive ? 'bg-cyan-50 border-l-4 border-cyan-500' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                                            {getPatientName(session).charAt(0)}
                                        </div>
                                        {sidebarOpen && (
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-slate-800 truncate">{getPatientName(session)}</h4>
                                                    <span className="text-xs text-slate-400">
                                                        {session.created_at ? new Date(session.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 truncate">
                                                        {session.latest_message || session.content || '开始问诊...'}
                                                    </span>
                                                </div>
                                                <div className="mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {session.status === 'active' ? '进行中' : '已结束'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
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
        <div className="flex bg-slate-50 animate-fade-in overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
            {/* 侧边栏 - 桌面端 */}
            <div className="md:block hidden h-full">
                {renderSidebar()}
            </div>

            {/* 移动端侧边栏按钮 */}
            <div className="md:hidden absolute top-4 left-4 z-10">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white p-2 rounded-full shadow-md hover:bg-slate-50 transition"
                >
                    <ArrowLeft size={20} className={`transform transition-transform ${sidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
            </div>

            {/* 移动端侧边栏 */}
            <div className={`md:hidden absolute top-0 left-0 h-full bg-white shadow-lg z-20 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {renderSidebar()}
            </div>

            {/* 主内容区 - 固定高度布局 */}
            <div className="flex-1 flex flex-col h-full">
                {/* 错误提示 */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 flex-shrink-0">
                        <div className="flex items-center gap-2 text-red-800 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* 聊天容器 */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {selectedSession ? (
                        <>
                            {/* Header */}
                            <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                                <div>
                                    <h3 className="font-bold text-slate-800">{getPatientName(selectedSession)}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Clock size={14} />
                                        {selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleString('zh-CN') : ''}
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

                            {/* 消息区域 - 可滚动，占据剩余空间 */}
                            <div
                                ref={listRef}
                                className="flex-1 overflow-y-auto bg-slate-50"
                                style={{
                                    scrollBehavior: 'smooth',
                                    overflowAnchor: 'auto'
                                }}
                            >
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <MessageSquare className="opacity-30 mb-3" size={40} />
                                        <p>暂无消息</p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-6">
                                        {groupMessagesByTime().map((group, groupIndex) => (
                                            <div key={groupIndex} className="space-y-3">
                                                {/* 时间分隔 */}
                                                <div className="flex justify-center">
                                                    <div className="px-3 py-1 bg-slate-200 rounded-full text-xs text-slate-600">
                                                        {group.time}
                                                    </div>
                                                </div>

                                                {/* 消息列表 */}
                                                <div className="space-y-3">
                                                    {group.messages.map((msg, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`flex ${msg.role === 'doctor' || msg.sender === 'doctor'
                                                                ? 'justify-end'
                                                                : 'justify-start'
                                                                }`}
                                                        >
                                                            <div
                                                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'doctor' || msg.sender === 'doctor'
                                                                    ? 'bg-cyan-500 text-white rounded-tr-none'
                                                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                                                    }`}
                                                            >
                                                                {msg.content || msg.text || '（空消息）'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 输入框 - 固定在底部 */}
                            <div className="bg-white border-t border-slate-100 p-3 flex-shrink-0">
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-cyan-200 transition-all focus-within:border-cyan-500 focus-within:shadow-lg">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="输入回复信息，按 Enter 发送"
                                            className="flex-1 bg-transparent border-none text-sm focus:outline-none disabled:opacity-60 placeholder:text-slate-400"
                                            disabled={sending}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending || !input.trim()}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-cyan-200/50 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 hover:shadow-xl disabled:transform-none disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={18} />}
                                        <span className="text-sm font-semibold">发送</span>
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