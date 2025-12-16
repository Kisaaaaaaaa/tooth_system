import React, { useState, useEffect } from 'react';
import { Check, Clock, Calendar, AlertCircle } from 'lucide-react';
import doctorApi from '../../api/doctor';

const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, checked-in, completed

    useEffect(() => {
        fetchAppointments();
    }, [filter]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            // 获取所有预约数据，不依赖API过滤
            const res = await doctorApi.getAppointments();
            console.log('API响应数据:', res);

            const payload = res?.data?.results
                || res?.data?.data?.results
                || res?.results
                || res?.data
                || res;

            if (Array.isArray(payload)) {
                setAppointments(payload);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error('获取预约列表失败:', err);
            setError(err?.message || '获取预约列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteAppointment = async (appointmentId) => {
        try {
            await doctorApi.completeAppointment(appointmentId);
            setAppointments(prev =>
                prev.map(apt =>
                    apt.id === appointmentId ? { ...apt, status: 'completed' } : apt
                )
            );
        } catch (err) {
            console.error('完成预约失败:', err);
            setError('完成预约失败');
        }
    };

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

    const getStatusBadge = (status) => {
        const normalizedStatus = normalizeStatus(status);
        const statusMap = {
            pending: { label: '待进行', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            'checked-in': { label: '已签到', color: 'bg-blue-100 text-blue-800', icon: Check },
            completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: Check },
            cancelled: { label: '已取消', color: 'bg-red-100 text-red-800', icon: AlertCircle }
        };
        const config = statusMap[normalizedStatus] || { label: normalizedStatus, color: 'bg-slate-100 text-slate-800' };
        const Icon = config.icon;
        return (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.color}`}>
                {Icon && <Icon size={14} />}
                {config.label}
            </div>
        );
    };

    const normalizeAppointments = () => appointments.map(item => ({
        ...item,
        status: normalizeStatus(item.status)
    }));

    const groupPendingByDateAndTime = (list) => {
        const grouped = {};
        list.forEach(apt => {
            const dateKey = apt.appointment_date || '未填写日期';
            const timeKey = apt.appointment_time || '未填写时间';
            if (!grouped[dateKey]) grouped[dateKey] = {};
            if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
            grouped[dateKey][timeKey].push(apt);
        });
        return grouped;
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

    const normalizedList = normalizeAppointments();
    const pendingList = normalizedList.filter(a => a.status === 'pending');
    const checkedInList = normalizedList.filter(a => a.status === 'checked-in');
    const completedList = normalizedList.filter(a => a.status === 'completed');

    const pendingCount = pendingList.length;
    const checkedInCount = checkedInList.length;
    const completedCount = completedList.length;

    // 根据过滤条件获取显示的预约列表
    const getFilteredAppointments = () => {
        if (filter === 'all') return normalizedList;
        if (filter === 'pending') return pendingList;
        if (filter === 'checked-in') return checkedInList;
        if (filter === 'completed') return completedList;
        return normalizedList;
    };

    const filteredAppointments = getFilteredAppointments();
    const groupedPending = filter === 'pending' ? groupPendingByDateAndTime(filteredAppointments) : {};

    return (
        <div className="space-y-6 py-6 animate-fade-in">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">总预约数</p>
                            <p className="text-3xl font-bold text-slate-800">{appointments.length}</p>
                        </div>
                        <Calendar className="text-blue-500 opacity-20" size={40} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">待进行</p>
                            <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
                        </div>
                        <Clock className="text-yellow-500 opacity-20" size={40} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">已签到</p>
                            <p className="text-3xl font-bold text-slate-800">{checkedInCount}</p>
                        </div>
                        <Check className="text-purple-500 opacity-20" size={40} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">已完成</p>
                            <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
                        </div>
                        <Check className="text-green-500 opacity-20" size={40} />
                    </div>
                </div>
            </div>

            {/* 过滤器 */}
            <div className="flex gap-2">
                {['all', 'pending', 'checked-in', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {status === 'all' ? '全部' : 
                         status === 'pending' ? '待进行' : 
                         status === 'checked-in' ? '已签到' : 
                         '已完成'}
                    </button>
                ))}
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {/* 预约列表 */}
            <div className="space-y-3">
                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto mb-3 text-slate-400" size={40} />
                        <p className="text-slate-600">暂无预约记录</p>
                    </div>
                ) : filter === 'pending' ? (
                    Object.entries(groupedPending).sort().map(([dateKey, timeMap]) => (
                        <div key={dateKey} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                                <Calendar size={16} />
                                <span>{dateKey}</span>
                                <span className="text-sm text-slate-500 font-normal">{Object.values(timeMap).reduce((sum, arr) => sum + arr.length, 0)} 人</span>
                            </div>
                            {Object.entries(timeMap).sort().map(([timeSlot, list]) => (
                                <div key={timeSlot} className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Clock size={14} />
                                        <span>{timeSlot}</span>
                                        <span className="text-xs text-slate-500">{list.length} 人</span>
                                    </div>
                                    <div className="space-y-2">
                                        {list.map(apt => (
                                            <div key={apt.id} className="flex items-start justify-between bg-slate-50 border border-slate-100 rounded-lg p-4">
                                                <div>
                                                    <p className="text-base font-bold text-slate-800">{apt.patient_name}</p>
                                                    <p className="text-sm text-slate-600 mt-1">电话：{apt.patient_phone || '未填写'}</p>
                                                    <p className="text-sm text-slate-600">症状：{apt.symptoms || '常规检查'}</p>
                                                </div>
                                                <div className="text-right">
                                                    {getStatusBadge(apt.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    filteredAppointments.map(apt => (
                        <div key={apt.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800">{apt.patient_name}</h3>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-slate-600">
                                        <p><span className="font-medium">日期:</span> {apt.appointment_date}</p>
                                        <p><span className="font-medium">时间:</span> {apt.appointment_time}</p>
                                        <p><span className="font-medium">服务:</span> {apt.symptoms || '常规检查'}</p>
                                        <p><span className="font-medium">电话:</span> {apt.patient_phone}</p>
                                        <div>
                                            <span className="font-medium">状态:</span>
                                            <div className="mt-1">
                                                {getStatusBadge(apt.status)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {apt.status === 'checked-in' && (
                                    <button
                                        onClick={() => handleCompleteAppointment(apt.id)}
                                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                    >
                                        完成预约
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoctorAppointments;
