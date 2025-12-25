import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import doctorApi from '../../api/doctor';

/**
 * 排班管理页面（管理员医生专用）
 */
const DoctorSchedule = () => {
    const [isAdminDoctor, setIsAdminDoctor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hospitalId, setHospitalId] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        checkAdminStatus();
    }, []);

    useEffect(() => {
        if (hospitalId) {
            fetchSchedulesForMonth(currentMonth);
        }
    }, [hospitalId, currentMonth]);

    const checkAdminStatus = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.is_admin === true || user.is_admin === 1) {
                    setIsAdminDoctor(true);
                    console.log('当前用户是管理员医生');
                }
            }
            
            // 如果 localStorage 没有，从后端获取
            if (!isAdminDoctor) {
                const doctorData = await doctorApi.getDoctorMe();
                console.log('医生完整数据:', doctorData);
                
                if (doctorData && (doctorData.is_admin === true || doctorData.is_admin === 1)) {
                    setIsAdminDoctor(true);
                    console.log('从后端检测到管理员医生');
                    
                    // 更新 localStorage
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        user.is_admin = doctorData.is_admin;
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                }

                // 设置医院并加载医生列表
                const hid = doctorData?.hospital_id || doctorData?.hospital?.id;
                if (hid) {
                    setHospitalId(String(hid));
                    await fetchDoctors(hid);
                }
            }
        } catch (e) {
            console.error('检查管理员状态失败:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async (hid) => {
        try {
            const res = await fetch(`${import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api'}/doctors/?hospital_id=${hid}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('authToken')}`,
                    'Accept': 'application/json'
                }
            });
            const dataText = await res.text();
            const parsed = JSON.parse(dataText || '{}');
            const list = parsed?.data?.results || parsed?.data || parsed?.results || parsed;
            if (Array.isArray(list)) setDoctors(list);
        } catch (err) {
            console.error('获取医生列表失败:', err);
        }
    };

    const fetchSchedulesForMonth = async (dateObj) => {
        try {
            setScheduleLoading(true);
            const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
            const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
            const fmt = (d) => d.toISOString().slice(0, 10);

            const res = await doctorApi.getSchedules({
                hospital_id: hospitalId,
                start: fmt(start),
                end: fmt(end),
            });

            const data = res?.data || res?.results || res;
            if (Array.isArray(data)) {
                setSchedules(data);
            } else {
                setSchedules([]);
            }
        } catch (err) {
            console.error('获取排班列表失败:', err);
            setSchedules([]);
        } finally {
            setScheduleLoading(false);
        }
    };

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const result = [];
        const leading = firstDay.getDay();
        for (let i = 0; i < leading; i += 1) result.push(null);
        for (let d = 1; d <= lastDay.getDate(); d += 1) {
            result.push(new Date(year, month, d));
        }
        return result;
    }, [currentMonth]);

    const schedulesByDate = useMemo(() => {
        const map = {};
        schedules.forEach(item => {
            if (!item.date) return;
            if (!map[item.date]) map[item.date] = [];
            map[item.date].push(item);
        });
        return map;
    }, [schedules]);

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return date;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handleSelectDay = (dateObj) => {
        if (!dateObj) return;
        const key = formatDate(dateObj);
        setSelectedDate(key);
        const existing = schedulesByDate[key] || [];
        const ids = existing.map(i => Number(i.doctor_id)).filter(Boolean);
        setSelectedDoctors(ids);
        setError('');
        setSuccess('');
    };

    const toggleDoctor = (id) => {
        setSelectedDoctors(prev => (
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        ));
    };

    const handleSaveSchedule = async () => {
        if (!selectedDate) {
            setError('请选择日期');
            return;
        }
        if (!hospitalId) {
            setError('缺少医院信息');
            return;
        }
        if (selectedDoctors.length === 0) {
            setError('请至少选择一位医生');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
            const payload = {
                hospital_id: Number(hospitalId),
                doctor_ids: selectedDoctors,
                dates: [selectedDate],
                status: 'active',
                overwrite: true
            };
            const res = await fetch(`${import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api'}/doctors/schedules/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload)
            });
            const txt = await res.text();
            let parsed = {};
            try { parsed = JSON.parse(txt); } catch (e) { parsed = { message: txt }; }
            if (res.ok && parsed.code === 200) {
                setSuccess('已保存排班');
                await fetchSchedulesForMonth(currentMonth);
            } else {
                setError(parsed.message || '保存失败');
            }
        } catch (err) {
            setError(err?.message || '保存失败');
        } finally {
            setSaving(false);
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

    if (!isAdminDoctor) {
        return (
            <div className="space-y-6 py-6 animate-fade-in">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <Calendar className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">权限不足</h2>
                    <p className="text-gray-600">仅管理员医生可以访问排班管理功能</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-6 animate-fade-in">
            <div className="flex items-center mb-4">
                <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">排班管理</h1>
                    <p className="text-sm text-gray-600 mt-1">在日历上为本院医生安排排班</p>
                </div>
            </div>

            {/* 日历快速排班 */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 hover:bg-slate-100 rounded"
                            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-semibold text-slate-800">
                            {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                        </span>
                        <button
                            className="p-2 hover:bg-slate-100 rounded"
                            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    {scheduleLoading && <span className="text-xs text-slate-400">加载排班中...</span>}
                </div>

                <div className="grid grid-cols-7 text-xs text-slate-500">
                    {['日','一','二','三','四','五','六'].map(w => (
                        <div key={w} className="py-2 text-center font-medium">{w}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-sm">
                    {daysInMonth.map((d, idx) => {
                        if (!d) return <div key={`empty-${idx}`} className="h-16" />;
                        const key = formatDate(d);
                        const items = schedulesByDate[key] || [];
                        return (
                            <button
                                key={key}
                                onClick={() => handleSelectDay(d)}
                                className={`h-16 w-full rounded-lg border text-left p-2 transition ${
                                    selectedDate === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center justify-between text-slate-700">
                                    <span className="font-semibold">{d.getDate()}</span>
                                    {items.length > 0 && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                            {items.length} 人
                                        </span>
                                    )}
                                </div>
                                {items.slice(0, 2).map(item => (
                                    <div key={`${key}-${item.doctor_id}`} className="text-[11px] text-slate-500 truncate mt-1">
                                        {item.doctor_name || `医生${item.doctor_id}`}
                                    </div>
                                ))}
                                {items.length > 2 && (
                                    <div className="text-[11px] text-slate-400">+{items.length - 2} 更多</div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 侧边选择医生 */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-slate-500">已选日期</div>
                            <div className="font-semibold text-slate-800 text-sm">{selectedDate || '请选择日期'}</div>
                        </div>
                        {success && <span className="text-green-600 text-xs flex items-center gap-1"><Check size={14} />{success}</span>}
                    </div>

                    <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                        {doctors.map(doc => (
                            <label key={doc.id} className={`flex items-center gap-2 px-2 py-1 rounded border ${selectedDoctors.includes(doc.id) ? 'border-blue-400 bg-white' : 'border-slate-200 bg-white'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600"
                                    checked={selectedDoctors.includes(doc.id)}
                                    onChange={() => toggleDoctor(doc.id)}
                                />
                                <span className="text-sm text-slate-700 truncate">{doc.name} {doc.specialty ? `(${doc.specialty})` : ''}</span>
                            </label>
                        ))}
                    </div>

                    {error && <div className="text-xs text-red-600">{error}</div>}

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveSchedule}
                            disabled={saving}
                            className={`px-4 py-2 rounded-lg text-white text-sm flex items-center gap-1 ${saving ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {saving ? '保存中...' : (<><Save size={16} /> 保存排班</>)}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DoctorSchedule;
