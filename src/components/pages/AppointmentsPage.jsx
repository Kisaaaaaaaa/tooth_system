import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Navigation } from 'lucide-react';
import appointmentsApi from '../../api/appointments';
import hospitalsApi from '../../api/hospitals';
import doctorsApi from '../../api/doctors';
import { getAMapLocation } from '../../api/amapLocation';

// 预约管理页面
const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [hospitalsMap, setHospitalsMap] = useState({});
    const [doctorsMap, setDoctorsMap] = useState({});
    const [doctorsLoadError, setDoctorsLoadError] = useState(false);

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'upcoming': return { border: 'border-cyan-500', badge: 'bg-cyan-100 text-cyan-700' };
            case 'checked-in': return { border: 'border-purple-500', badge: 'bg-purple-100 text-purple-700' };
            case 'completed': return { border: 'border-green-500', badge: 'bg-green-100 text-green-700' };
            case 'cancelled': return { border: 'border-rose-500', badge: 'bg-rose-100 text-rose-700' };
            default: return { border: 'border-slate-300', badge: 'bg-slate-100 text-slate-500' };
        }
    };

    const fetchList = async (p = page, s = statusFilter) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appointmentsApi.getAppointments({ status: s || undefined, page: p, page_size: pageSize });
            // API 返回 success_response 包装：{ code, message, data }
            const data = res.data || res;
            setAppointments(data.results || []);
            setTotal(data.count || 0);
            setPage(data.page || p);
        } catch (err) {
            console.error('获取预约列表失败', err);
            setError('获取预约列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(1, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    // load hospitals once to map id -> hospital info (name, address...)
    useEffect(() => {
        let mounted = true;
        const loadHospitals = async () => {
            try {
                const resp = await hospitalsApi.getHospitals({ page: 1, page_size: 1000 });
                const hospitalsData = resp.data?.results || resp.results || [];
                if (!mounted) return;
                const map = {};
                hospitalsData.forEach(h => {
                    if (h && typeof h.id !== 'undefined') map[h.id] = h;
                });
                setHospitalsMap(map);
            } catch (err) {
                // keep silent but log for debugging
                console.error('加载医院列表失败', err);
            }
        };
        loadHospitals();
        return () => { mounted = false; };
    }, []);

    // load doctors map from backend; if it fails, set error flag and keep map empty
    useEffect(() => {
        let mounted = true;
        const loadDoctors = async () => {
            setDoctorsLoadError(false);
            try {
                const resp = await doctorsApi.getDoctors({ view: 'list', page_size: 1000 });
                const docs = resp.data?.results || resp.results || [];
                if (!mounted) return;
                const map = {};
                docs.forEach(d => { if (d && typeof d.id !== 'undefined') map[d.id] = d; });
                setDoctorsMap(map);
            } catch (err) {
                console.error('加载医生列表失败', err);
                if (!mounted) return;
                setDoctorsMap({});
                setDoctorsLoadError(true);
            }
        };
        loadDoctors();
        return () => { mounted = false; };
    }, []);

    // 签到 loading 和错误提示
    const [checkinLoadingId, setCheckinLoadingId] = useState(null);
    const [checkinError, setCheckinError] = useState('');
    const [checkinErrorModal, setCheckinErrorModal] = useState(false);

    // 获取地理位置：统一使用高德定位
    const getLocation = () => getAMapLocation();

    const handleCheckIn = async (id) => {
        setCheckinLoadingId(id);
        setCheckinError('');
        setCheckinErrorModal(false);
        try {
            const loc = await getLocation();
            await appointmentsApi.checkinAppointment(id, loc.latitude, loc.longitude);
            setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: 'checked-in' } : apt));
            alert('签到成功');
        } catch (err) {
            setCheckinError(err?.message || '签到失败');
            setCheckinErrorModal(true);
        } finally {
            setCheckinLoadingId(null);
        }
    };

    // 取消预约弹窗相关
    const [cancelId, setCancelId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const openCancelDialog = (id) => {
        setCancelId(id);
        setCancelReason('');
        setCancelError('');
    };
    const closeCancelDialog = () => {
        setCancelId(null);
        setCancelReason('');
        setCancelError('');
    };
    const handleCancelAppointment = async () => {
        if (!cancelId) return;
        setCancelLoading(true);
        setCancelError('');
        try {
            await appointmentsApi.cancelAppointment(cancelId, cancelReason);
            // 刷新列表
            fetchList(page, statusFilter);
            closeCancelDialog();
        } catch (err) {
            setCancelError(err?.message || '取消失败');
        } finally {
            setCancelLoading(false);
        }
    };

    return (
        <div className="relative">
            <div className="max-w-4xl mx-auto p-4 pb-24 space-y-4 animate-fade-in">
                <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded md:mb-0">
                        请在预约时间后的30分钟内完成签到
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded p-2">
                            <option value="">全部状态</option>
                            <option value="upcoming">待就诊</option>
                            <option value="checked-in">已签到</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                        </select>
                        <button onClick={() => fetchList(1, statusFilter)} className="px-3 py-2 bg-cyan-600 text-white rounded">刷新</button>
                    </div>
                </div>

                {loading && <div className="text-center p-6">加载中...</div>}
                {error && <div className="text-red-500">{error}</div>}

                <div className="space-y-4">
                    {appointments.map(apt => {
                        const hospital = hospitalsMap[apt.hospital] || { name: apt.hospital_name || (apt.hospital ? `医院ID:${apt.hospital}` : ''), address: '' };
                        // support multiple appointment shapes for doctor id
                        const docId = apt.doctor_id ?? apt.doctorId ?? (apt.doctor && (apt.doctor.id ?? apt.doctor.doctor_id)) ?? apt.doctor;
                        const doctor = doctorsMap[docId];
                        const color = getStatusColorClass(apt.status);
                        return (
                            <div key={apt.id} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${color.border} flex flex-col md:flex-row justify-between md:items-center items-start gap-4`}>
                                <div className="md:w-3/4 w-full">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${color.badge}`}>
                                            {apt.status === 'upcoming' ? '待就诊' : apt.status === 'completed' ? '已完成' : apt.status === 'checked-in' ? '已签到' : '已取消'}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="text-sm text-slate-400 block truncate">{hospital.name}</span>
                                            {hospital.address ? <div className="text-xs text-slate-400 truncate">{hospital.address}</div> : null}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-2">
                                        <Calendar size={18} className="text-slate-400" />
                                        <span className="truncate">{apt.appointment_date}</span>
                                        <Clock size={18} className="text-slate-400 ml-2" />
                                        <span className="truncate">{apt.appointment_time}</span>
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1 truncate">主治医师：{doctor?.name ?? (doctorsLoadError ? '未知医生' : (apt.doctor_name || '未知医生'))}</p>
                                    {/* 症状描述展示 */}
                                    {apt.symptoms || apt.symptom || apt.description || apt.desc || apt['症状描述'] ? (
                                        <div className="text-sm text-slate-600 mt-1 truncate">
                                            <span className="font-medium text-slate-500">症状描述：</span>
                                            {apt.symptoms || apt['症状描述']}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="md:w-1/4 w-full flex items-center justify-end pr-4">
                                    {apt.status === 'upcoming' ? (
                                        <div className="flex flex-row items-center gap-2 md:gap-3 transform -translate-x-2 flex-nowrap whitespace-nowrap">
                                            <button
                                                onClick={() => openCancelDialog(apt.id)}
                                                className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg text-sm hover:bg-rose-50 transition flex-shrink-0"
                                            >
                                                取消预约
                                            </button>
                                            <button
                                                onClick={() => handleCheckIn(apt.id)}
                                                className="px-6 py-2 bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-md shadow-cyan-200 hover:bg-cyan-600 transition flex items-center justify-center gap-1 flex-shrink-0"
                                                disabled={checkinLoadingId === apt.id}
                                            >
                                                {checkinLoadingId === apt.id ? '签到中...' : (<><Navigation size={14} /> 我已到达</>)}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500">&nbsp;</div>
                                    )}
                                    {/* 签到错误弹窗（全局唯一） */}
                                    {checkinErrorModal && checkinError && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                                            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                                                <h3 className="text-lg font-bold mb-2 text-red-600">签到失败</h3>
                                                <div className="mb-4 text-sm text-slate-700">{checkinError}</div>
                                                <div className="flex justify-end">
                                                    <button onClick={() => setCheckinErrorModal(false)} className="px-4 py-1 bg-rose-500 text-white rounded text-sm">关闭</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* 取消预约弹窗（全局渲染，避免嵌套错误） */}
                                    {cancelId && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                                            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                                                <h3 className="text-lg font-bold mb-2">取消预约</h3>
                                                <div className="mb-2 text-sm text-slate-600">如需取消，请填写原因（可选）：</div>
                                                <textarea
                                                    className="w-full border rounded p-2 mb-2 text-sm"
                                                    rows={3}
                                                    value={cancelReason}
                                                    onChange={e => setCancelReason(e.target.value)}
                                                    placeholder="请输入取消原因（可选）"
                                                    disabled={cancelLoading}
                                                />
                                                {cancelError && <div className="text-red-500 text-xs mb-2">{cancelError}</div>}
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={closeCancelDialog} className="px-3 py-1 border rounded text-sm" disabled={cancelLoading}>返回</button>
                                                    <button onClick={handleCancelAppointment} className="px-4 py-1 bg-rose-500 text-white rounded text-sm" disabled={cancelLoading}>{cancelLoading ? '提交中...' : '确认取消'}</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* 分页（通过 portal 渲染到 body，确保固定在视口底部） */}
            {typeof document !== 'undefined' && createPortal(
                <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">
                    <div className="max-w-4xl w-full bg-white/95 backdrop-blur-sm border-t border-slate-200 py-3 px-4 flex items-center justify-between shadow-lg">
                        <div>共 {total} 条</div>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => { setPage(p => { const np = Math.max(1, p - 1); fetchList(np, statusFilter); return np; }); }} className="px-3 py-1 border rounded">上一页</button>
                            <div className="px-3 py-1 border rounded">{page}</div>
                            <button disabled={appointments.length < pageSize} onClick={() => { setPage(p => { const np = p + 1; fetchList(np, statusFilter); return np; }); }} className="px-3 py-1 border rounded">下一页</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AppointmentsPage;

