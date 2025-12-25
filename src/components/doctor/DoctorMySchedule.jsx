import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import doctorApi from '../../api/doctor';

const DoctorMySchedule = () => {
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const [doctorInfo, setDoctorInfo] = useState(null);

    useEffect(() => {
        loadSchedulesForMonth(currentMonth);
    }, [currentMonth]);

    useEffect(() => {
        if (!appointmentsLoaded) {
            loadAppointments();
        }
    }, [appointmentsLoaded]);

    const loadSchedulesForMonth = async (monthDate) => {
        try {
            setScheduleLoading(true);
            const info = await doctorApi.getDoctorMe();
            setDoctorInfo(info);
            const hospitalId = info?.hospital_id || info?.hospital?.id;
            const doctorId = info?.id;
            if (!hospitalId || !doctorId) {
                setSchedules([]);
                return;
            }
            const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            const fmt = (d) => d.toISOString().slice(0, 10);
            const res = await doctorApi.getSchedules({
                hospital_id: hospitalId,
                doctor_id: doctorId,
                start: fmt(start),
                end: fmt(end),
                status: 'active'
            });
            const data = res?.data || res?.results || res;
            setSchedules(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('获取排班失败:', err);
            setSchedules([]);
        } finally {
            setScheduleLoading(false);
        }
    };

    const loadAppointments = async () => {
        try {
            setAppointmentsLoading(true);
            const res = await doctorApi.getAppointments();
            const data = res?.data?.results
                || res?.data?.data?.results
                || res?.results
                || res?.data
                || res;
            if (Array.isArray(data)) {
                setAppointments(data);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error('获取预约列表失败:', err);
            setAppointments([]);
        } finally {
            setAppointmentsLoading(false);
            setAppointmentsLoaded(true);
        }
    };

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const res = [];
        for (let i = 0; i < firstDay.getDay(); i += 1) res.push(null);
        for (let d = 1; d <= lastDay.getDate(); d += 1) res.push(new Date(year, month, d));
        return res;
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
        setSelectedDate(formatDate(dateObj));
        if (!appointmentsLoaded) {
            loadAppointments();
        }
    };

    const detailList = selectedDate ? (schedulesByDate[selectedDate] || []) : [];

    const normalizeStatus = (status) => {
        if (!status) return 'pending';
        const map = {
            upcoming: 'pending',
            'checked-in': 'checked-in',
            completed: 'completed',
            cancelled: 'cancelled'
        };
        return map[status] || status;
    };

    const normalizedAppointments = useMemo(() => appointments.map(item => ({
        ...item,
        status: normalizeStatus(item.status)
    })), [appointments]);

    const pendingAppointmentsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return normalizedAppointments.filter(a => (
            (a.status === 'pending' || a.status === 'checked-in') && a.appointment_date === selectedDate
        ));
    }, [normalizedAppointments, selectedDate]);

    return (
        <div className="space-y-6 py-6 animate-fade-in">
            <div className="flex items-center mb-4">
                <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">我的排班</h1>
                    <p className="text-sm text-gray-600 mt-1">按日查看排班计划</p>
                </div>
            </div>

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
                    {scheduleLoading && <span className="text-xs text-slate-400">加载中...</span>}
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
                                            {items.length} 个
                                        </span>
                                    )}
                                </div>
                                {items.slice(0, 2).map(item => (
                                    <div key={`${key}-${item.id}`} className="text-[11px] text-slate-500 truncate mt-1">
                                        {item.status === 'active' ? '上班' : '停用'}
                                    </div>
                                ))}
                                {items.length > 2 && (
                                    <div className="text-[11px] text-slate-400">+{items.length - 2} 更多</div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-slate-500">日期</div>
                        <div className="font-semibold text-slate-800 text-sm">{selectedDate || '请选择日期'}</div>
                    </div>
                    {doctorInfo && (
                        <div className="text-xs text-slate-500">{doctorInfo.name || ''}</div>
                    )}
                </div>
                {detailList.length === 0 ? (
                    <p className="text-sm text-slate-500">{selectedDate ? '该日暂无排班' : '请选择日期'}</p>
                ) : (
                    <ul className="space-y-2 text-sm text-slate-700">
                        {detailList.map(item => (
                            <li key={item.id} className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {item.status === 'active' ? '上班' : '停用'}
                                </span>
                                <span className="text-slate-600">{item.date}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="text-blue-500" size={18} />
                        <h3 className="font-semibold text-slate-800 text-sm">当日待进行/已签到预约</h3>
                    </div>
                    {appointmentsLoading && <span className="text-xs text-slate-400">加载中...</span>}
                </div>
                {!selectedDate ? (
                    <p className="text-sm text-slate-500">请选择日期查看预约</p>
                ) : pendingAppointmentsForSelectedDate.length === 0 ? (
                    <p className="text-sm text-slate-500">该日暂无待进行预约</p>
                ) : (
                    <div className="space-y-2">
                        {pendingAppointmentsForSelectedDate.map(apt => (
                            <div key={apt.id} className="flex items-start justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{apt.patient_name || '患者'}</p>
                                    <p className="text-xs text-slate-600 mt-1">时间：{apt.appointment_time || '待定'}</p>
                                    <p className="text-xs text-slate-600">服务：{apt.symptoms || '常规检查'}</p>
                                    {apt.patient_phone && <p className="text-xs text-slate-600">电话：{apt.patient_phone}</p>}
                                </div>
                                <div className="text-right text-xs text-slate-500">待进行</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorMySchedule;
