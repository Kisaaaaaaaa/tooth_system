import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Loader2, AlertCircle, ArrowLeft, ShieldAlert, RefreshCw } from 'lucide-react';
import consultationApi from '../../api/consultations';
import doctorsApi from '../../api/doctors';
import hospitalsApi from '../../api/hospitals';


// 在线问诊页面
const ConsultationPage = ({ currentDoctor, consultationAuthRequired = false }) => {
    // 简单登录检测
    const isAuthed = () => {
        return !!(localStorage.getItem('access_token') || localStorage.getItem('authToken'));
    };
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const doctorFromState = location.state?.doctor;

    const [doctor, setDoctor] = useState(doctorFromState || currentDoctor || null);
    const doctorIdFromQuery = searchParams.get('doctorId');
    const doctorId = useMemo(() => doctor?.id || (doctorIdFromQuery ? parseInt(doctorIdFromQuery, 10) : undefined), [doctor, doctorIdFromQuery]);

    const [consultationId, setConsultationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [doctorLoading, setDoctorLoading] = useState(false);
    const [doctorError, setDoctorError] = useState('');
    const [creating, setCreating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [consultationHistories, setConsultationHistories] = useState([]);
    const [hospitals, setHospitals] = useState([]);

    const listRef = useRef(null);

    // 医生切换时重置会话与消息
    useEffect(() => {
        setConsultationId(null);
        setMessages([]);
        setError('');
        setInput('');
    }, [doctorId]);

    // 滚动到底部
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    // 如果外部传入 doctor 发生变化，更新本地 doctor
    useEffect(() => {
        if (currentDoctor) setDoctor(currentDoctor);
    }, [currentDoctor]);

    // 回填医生信息（刷新后仅有 doctorId）
    useEffect(() => {
        const loadDoctor = async () => {
            if (!doctorId || doctor) return;
            setDoctorLoading(true);
            setDoctorError('');
            try {
                const resp = await doctorsApi.getDoctorDetail(doctorId);
                setDoctor(resp.data || resp);
            } catch (err) {
                console.error('获取医生信息失败:', err);
                setDoctorError('获取医生信息失败，已使用本地数据');
                // 如果API请求失败，从本地数据中查找医生
                setDoctor({ id: doctorId, name: '未知医生', avatar: 'https://i.pravatar.cc/150?u=default', title: '医生', specialty: '口腔医疗', hospital_id: null });
            } finally {
                setDoctorLoading(false);
            }
        };
        loadDoctor();
    }, [doctorId, doctor]);

    // // 当医生信息更新时，检查是否需要添加到侧边栏聊天记录
    // useEffect(() => {
    //     if (!doctor) return;

    //     // 检查该医生是否已在聊天记录中
    //     const isDoctorInHistory = consultationHistories.some(
    //         history => history.doctor_id === doctor.id
    //     );

    //     if (!isDoctorInHistory) {
    //         // 创建新的聊天记录项
    //         const newHistory = {
    //             consultation_id: Date.now(),
    //             doctor_id: doctor.id,
    //             doctor_name: doctor.name,
    //             doctor_avatar: doctor.avatar,
    //             doctor_title: doctor.title,
    //             doctor_hospital: hospitals.find(hospital => hospital.id === doctor.hospital_id)?.name || '未知医院',
    //             last_message: '',
    //             last_time: '',
    //             unread: 0,
    //             messages: [],
    //             last_active_time: Date.now() // 设置当前时间为活动时间
    //         };

    //         // 添加到侧边栏聊天记录并保持排序
    //         setConsultationHistories(prev => {
    //             const updated = [...prev, newHistory];
    //             // 按活动时间降序排序
    //             updated.sort((a, b) => b.last_active_time - a.last_active_time);
    //             return updated;
    //         });
    //     }
    // }, [doctor, consultationHistories]);

    // 加载医院数据
    useEffect(() => {
        const loadHospitals = async () => {
            try {
                const resp = await hospitalsApi.getHospitals({
                    page_size: 100 // 获取足够多的医院数据
                });
                const hospitalsData = resp.data?.results || resp.results || [];
                setHospitals(hospitalsData);
            } catch (err) {
                console.error('加载医院数据失败:', err);
                setHospitals([]);
            }
        };

        loadHospitals();
    }, []);

    // // 加载会诊历史记录
    // useEffect(() => {
    //     const loadConsultationHistories = async () => {
    //         try {
    //             const resp = await consultationApi.ListConsultations();
    //             const histories = resp.data?.results || [];

    //             // 为每个历史记录添加last_active_time字段用于排序
    //             const sortedHistories = histories.map(item => ({
    //                 ...item,
    //                 last_active_time: Date.now() - Math.random() * 1000000 // 暂时使用随机值，实际应该从API获取
    //             }));

    //             // 按活动时间降序排序
    //             sortedHistories.sort((a, b) => b.last_active_time - a.last_active_time);

    //             setConsultationHistories(sortedHistories);
    //         } catch (err) {
    //             console.error('加载会诊历史记录失败:', err);
    //             setConsultationHistories([]);
    //         }
    //     };

    //     loadConsultationHistories();
    // }, []);
    useEffect(() => {
        const loadConsultationHistories = async () => {
            try {
                const resp = await consultationApi.ListConsultations();
                const list = resp.data?.results || [];

                // 拉医生信息补全左边展示
                const enriched = await Promise.all(
                    list.map(async (c) => {
                        try {
                            const detail = await consultationApi.GetConsultationDetail(c.id);
                            const msgs = detail.data?.messages?.results || [];

                            // ⭐ 核心过滤条件
                            if (msgs.length === 0) return null;

                            const dResp = await doctorsApi.getDoctorDetail(c.doctor_id);
                            const d = dResp.data || dResp;

                            return {
                                id: c.id,
                                doctor_id: c.doctor_id,
                                doctor_name: d.name,
                                doctor_avatar: d.avatar,
                                last_message: msgs[msgs.length - 1]?.text || '',
                                last_time: msgs[msgs.length - 1]?.time || '',
                            };
                        } catch {
                            return null;
                        }
                    })
                );

                setConsultationHistories(enriched.filter(Boolean));
            } catch (err) {
                console.error('加载会诊历史失败', err);
                setConsultationHistories([]);
            }
        };

        loadConsultationHistories();
    }, []);
    // ⭐ 自动续聊：如果已存在与该医生的会诊，自动打开
    useEffect(() => {
        if (!doctorId || consultationHistories.length === 0) return;

        const existing = consultationHistories.find(
            h => h && h.doctor_id === doctorId
        );

        if (existing) {
            setConsultationId(existing.id);
            fetchMessages(existing.id);
        } else {
            setConsultationId(null);
            setMessages([]);
        }
    }, [doctorId, consultationHistories]);


    // 创建会话并拉取消息
    useEffect(() => {
        const bootstrap = async () => {
            if (!doctorId) return;
            if (consultationAuthRequired && !isAuthed()) {
                setError('当前问诊需登录后使用，请先登录。');
                return;
            }
            // await ensureSessionAndMessages();
            if (consultationId) {
                await fetchMessages(consultationId);
            }
        };
        bootstrap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctorId, consultationAuthRequired]);

    const ensureSessionAndMessages = async () => {
        try {
            if (!consultationId) {
                setCreating(true);
                const resp = await consultationApi.CreateConsultation({ doctor_id: doctorId });
                const newId = resp.data?.id || resp.id;
                setConsultationId(newId);
                setCreating(false);
                await fetchMessages(newId);
            } else {
                await fetchMessages(consultationId);
            }
        } catch (err) {
            setCreating(false);
            setError(err.message || '创建会话失败');
            // 离线兜底展示本地消息
            if (!messages.length) setMessages([]);
        }
    };

    const fetchMessages = async (cid) => {
        const id = cid || consultationId;
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const resp = await consultationApi.GetConsultationDetail(id, { page_size: 100 });
            const remoteMessages = resp.data?.messages?.results || resp.data?.messages || resp.messages || [];
            setMessages(remoteMessages.map((m, idx) => ({
                id: m.id || idx,
                sender: m.sender || 'doctor',
                text: m.text || m.content || '',
                time: m.time || m.created_at || ''
            })));
            // 如果接口返回医生详情且当前缺失，回填
            if (!doctor && resp.data?.doctor) setDoctor(resp.data.doctor);
        } catch (err) {
            setError(err.message || '获取消息失败');
            // 如果获取消息失败且没有现有消息，使用空数组
            if (!messages.length) setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const formatNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleSend = async () => {
        const content = input.trim();
        if (!content) return;
        if (consultationAuthRequired && !isAuthed()) {
            setError('发送前请先登录。');
            return;
        }
        if (!doctorId) {
            setError('请选择医生后再发送消息。');
            return;
        }

        setError('');
        setSending(true);

        let activeId = consultationId;
        try {
            if (!activeId) {
                const resp = await consultationApi.CreateConsultation({ doctor_id: doctorId });
                activeId = resp.data?.id || resp.id;
                setConsultationId(activeId);
            }

            const tempMessage = { id: `temp-${Date.now()}`, sender: 'user', text: content, time: formatNow(), pending: true };
            setMessages((prev) => [...prev, tempMessage]);
            setInput('');
            //先保证左侧存在这条会诊
            setConsultationHistories(prev => {
                const exists = prev?.some(
                    item => item && item.doctor_id === doctorId
                );

                if (exists) return prev;

                return [
                    {
                        id: activeId,
                        doctor_id: doctorId,
                        doctor_name: doctor?.name,
                        doctor_avatar: doctor?.avatar,
                        unread: 0,
                        last_message: content,
                        last_time: formatNow(),
                        last_active_time: Date.now()
                    },
                    ...(prev || [])
                ];
            });

            // 更新当前聊天记录的时间，确保它保持在顶部
            const now = Date.now();
            setConsultationHistories(prev => {
                const updated = prev.map(item =>
                    item.doctor_id === doctorId
                        ? {
                            ...item,
                            unread: 0,
                            last_active_time: now + 1000000000, // 设置极高时间值确保置顶
                            last_message: content,
                            last_time: formatNow()
                        }
                        : item
                );

                // 按活动时间降序重新排序
                updated.sort((a, b) => b.last_active_time - a.last_active_time);
                return updated;
            });

            const resp = await consultationApi.SendConsultationMessage(activeId, { text: content });
            const saved = resp.data || resp;
            setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? {
                id: saved.id || tempMessage.id,
                sender: saved.sender || 'user',
                text: saved.text || content,
                time: saved.time || saved.created_at || tempMessage.time
            } : m)));
        } catch (err) {
            setError(err.message || '发送失败，请稍后重试');
        } finally {
            setSending(false);
        }
    };

    const renderDoctorCard = () => {
        if (doctorLoading) {
            return (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
                    <Loader2 className="animate-spin text-cyan-600" size={20} />
                    <span className="text-sm text-slate-600">正在加载医生信息...</span>
                </div>
            );
        }

        if (!doctor) {
            return (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-slate-600 mb-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-700">
                        <AlertCircle size={18} className="text-amber-500" />
                        <span>请选择医生开始问诊</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/doctors')}
                            className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm hover:bg-cyan-600 transition"
                        >
                            前往选择医生
                        </button>
                        <button
                            onClick={() => navigate('/hospitals')}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition"
                        >
                            浏览医院
                        </button>
                    </div>
                    {doctorError && <p className="text-sm text-red-500">{doctorError}</p>}
                </div>
            );
        }

        return (
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-4 flex items-center gap-4">
                <img src={doctor.avatar} alt={doctor.name} className="w-14 h-14 rounded-full object-cover border-2 border-cyan-100" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">{doctor.name}</h3>
                        <span className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-100">{doctor.title}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{doctor.specialty} · {hospitals.find(hospital => hospital.id === doctor.hospital_id)?.name || '未知医院'}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> 在线</p>
                </div>
            </div>
        );
    };

    const renderSidebar = () => {
        return (
            <div className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-16'}`}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className={`font-bold text-slate-800 transition-all duration-300 ${sidebarOpen ? 'text-lg' : 'text-xs text-center w-full'}`}>
                        {sidebarOpen ? '聊天记录' : '记录'}
                    </h3>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded-full hover:bg-slate-100 transition flex items-center justify-center"
                    >
                        <span className={`text-lg font-bold transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}>&lt;</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {consultationHistories
                        .filter(h => h && h.doctor_id)
                        .map((history) => {
                            const isActive = history.doctor_id === doctorId;
                            return (
                                <div
                                    key={history.id || history.consultation_id}
                                    // onClick={async () => {
                                    //     try {

                                    //         const resp = await doctorsApi.getDoctorDetail(history.doctor_id);
                                    //         const doctorData = resp.data || resp;

                                    //         setDoctor(doctorData);
                                    //         setConsultationId(history.id || history.consultation_id || null);
                                    //         setMessages([]); // 由后续 fetchMessages 拉取


                                    //         const now = Date.now();
                                    //         setConsultationHistories(prev => {
                                    //             const updated = prev.map(item =>
                                    //                 item.doctor_id === history.doctor_id
                                    //                     ? { ...item, unread: 0, last_active_time: now + 1000000000 }
                                    //                     : item
                                    //             );
                                    //             updated.sort((a, b) => b.last_active_time - a.last_active_time);
                                    //             return updated;
                                    //         });
                                    //     } catch (e) {
                                    //         console.error('切换医生失败', e);
                                    //     }
                                    // }}
                                    onClick={async () => {
                                        try {
                                            setConsultationId(history.id);
                                            setMessages([]);

                                            const resp = await doctorsApi.getDoctorDetail(history.doctor_id);
                                            setDoctor(resp.data || resp);

                                            await fetchMessages(history.id);
                                        } catch (e) {
                                            console.error('切换会诊失败', e);
                                        }
                                    }}

                                    className={`p-3 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition ${isActive ? 'bg-cyan-50 border-l-4 border-cyan-500' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={history.doctor_avatar} alt={history.doctor_name} className="w-10 h-10 rounded-full object-cover" />
                                        {sidebarOpen && (
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-slate-800 truncate">{history.doctor_name}</h4>
                                                    <span className="text-xs text-slate-400">{history.last_time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 truncate">{history.last_message}</span>
                                                    {history.unread > 0 && (
                                                        <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{history.unread}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
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
        if (!messages.length) return [];

        const grouped = [];
        let currentGroup = { messages: [], time: formatMessageTime(messages[0].time) };

        messages.forEach((msg, index) => {
            const msgTime = formatMessageTime(msg.time);

            // 如果是第一条消息，或者时间间隔超过一定阈值（如5分钟），则创建新分组
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

    const renderMessages = () => {
        if (!doctorId) return null;
        if (loading) {
            return (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-cyan-600" size={20} />
                        <span>加载历史消息...</span>
                    </div>
                </div>
            );
        }

        if (error && !messages.length) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <AlertCircle className="text-amber-500 mb-2" size={24} />
                    <p>{error}</p>
                </div>
            );
        }

        if (!messages.length) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <p>暂无历史消息，开始问诊吧</p>
                </div>
            );
        }

        const groupedMessages = groupMessagesByTime();

        return (
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6">
                {groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                        {/* 时间分隔 */}
                        <div className="flex justify-center">
                            <div className="px-3 py-1 bg-slate-200 rounded-full text-xs text-slate-600">
                                {group.time}
                            </div>
                        </div>

                        {/* 消息列表 */}
                        <div className="space-y-3">
                            {group.messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-cyan-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                        {msg.text || '（空消息）'}
                                        {msg.pending && <span className="text-[10px] mt-1 text-right text-cyan-100"> · 发送中</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const disableInput = sending || loading || !doctorId || (consultationAuthRequired && !isAuthed());

    return (
        <div className="flex bg-slate-50 animate-fade-in overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
            {/* 侧边栏 */}
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
                {/* 顶部医生卡片 */}
                <div className="bg-white p-4 border-b border-slate-200 flex-shrink-0">
                    {renderDoctorCard()}
                </div>

                {/* 聊天容器 */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                        <div className="text-sm text-slate-700">
                            {doctor ? `正在与 ${doctor.name} 医生沟通` : '请选择医生后开始问诊'}
                        </div>
                        <div className="flex items-center gap-3">
                            {consultationAuthRequired && !isAuthed() && (
                                <div className="flex items-center gap-1 text-amber-600 text-xs">
                                    <ShieldAlert size={14} /> 登录后才可发送
                                </div>
                            )}
                            <button
                                onClick={() => navigate('/doctors')}
                                className="flex items-center gap-2 text-sm px-3 py-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-md transition-transform transform hover:-translate-y-0.5"
                            >
                                <RefreshCw size={16} />
                                <span>换个医生咨询</span>
                            </button>
                        </div>
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
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Loader2 className="animate-spin text-cyan-600" size={20} />
                                    <span>加载历史消息...</span>
                                </div>
                            </div>
                        ) : error && !messages.length ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <AlertCircle className="text-amber-500 mb-2" size={24} />
                                <p>{error}</p>
                            </div>
                        ) : !messages.length ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <p>暂无历史消息，开始问诊吧</p>
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
                                            {group.messages.map((msg) => (
                                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-cyan-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                                        {msg.text || '（空消息）'}
                                                        {msg.pending && <span className="text-[10px] mt-1 text-right text-cyan-100"> · 发送中</span>}
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
                        {error && (
                            <div className="text-xs text-amber-600 flex items-center gap-1 mb-2">
                                <AlertCircle size={14} />{error}
                            </div>
                        )}
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-cyan-200 transition-all focus-within:border-cyan-500 focus-within:shadow-lg">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={doctorId ? '输入病情描述，按 Enter 发送' : '请选择医生后开始问诊'}
                                    className="flex-1 bg-transparent border-none text-sm focus:outline-none disabled:opacity-60 placeholder:text-slate-400"
                                    disabled={disableInput}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={disableInput}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-cyan-200/50 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 hover:shadow-xl"
                            >
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={18} />}
                                <span className="text-sm font-semibold">发送</span>
                            </button>
                        </div>
                        {creating && <p className="text-[11px] text-slate-400 mt-2">正在创建会话...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultationPage;

