import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { zhCN } from 'date-fns/locale/zh-CN';
import { useParams, useNavigate } from 'react-router-dom';
import doctorsApi from '../../api/doctors';
import appointmentsApi from '../../api/appointments';
import { ArrowLeft, Star, CheckCircle, Phone, MessageSquare, Calendar, Clock } from 'lucide-react';

registerLocale('zh-CN', zhCN);

const DoctorDetailPage = ({ navigateTo }) => {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // reviews from backend doctor detail: data.reviews_data
    const [reviewsData, setReviewsData] = useState({
        count: 0,
        page: 1,
        page_size: 10,
        results: [],
    });

    // appointment form state (moved up so hooks order is stable)
    const [date, setDate] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [timeSlot, setTimeSlot] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    const buildTimeSlots = () => {
        const pad2 = (n) => String(n).padStart(2, '0');
        const toHHmm = (mins) => {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return `${pad2(h)}:${pad2(m)}`;
        };
        const range = (startMins, endMins, step = 30) => {
            const out = [];
            // 生成“时间段”，所以开始时间必须满足：start + step <= end
            for (let t = startMins; t + step <= endMins; t += step) {
                out.push({
                    value: toHHmm(t),
                    label: `${toHHmm(t)}-${toHHmm(t + step)}`,
                });
            }
            return out;
        };

        // 08:00-11:30, 14:00-17:30 (30分钟一段)
        return [
            ...range(8 * 60, 11 * 60 + 30, 30),
            ...range(14 * 60, 17 * 60 + 30, 30),
        ];
    };

    const timeSlots = buildTimeSlots();

    // 仅允许后端返回且处于 active 的排班日期在日历中可选/高亮
    const activeScheduleDates = (doctor?.schedules || [])
        .filter(s => (s?.status || '').toLowerCase() === 'active')
        .map(s => s?.date)
        .filter(Boolean);

    const activeScheduleDateSet = new Set(activeScheduleDates);

    // 注意：不能用 toISOString()，否则会因时区偏移导致日期错一天（从而出现 26/28 被误判）
    const formatDateKey = (d) => {
        if (!d) return '';
        try {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        } catch {
            return '';
        }
    };

    useEffect(() => {
        const fetch = async () => {
            if (!doctorId) return;
            setLoading(true);
            setError(null);
            try {
                const resp = await doctorsApi.getDoctorDetail(parseInt(doctorId));
                const payload = resp.data || resp;
                setDoctor(payload);

                // Backend DoctorDetail appends reviews_data: {count,page,page_size,results:[{rating,comment,diagnosis,created_at}]}
                // Also tolerate alternative shapes just in case.
                const rd = payload?.reviews_data || payload?.reviewsData || payload?.reviews;
                if (rd && typeof rd === 'object') {
                    setReviewsData({
                        count: Number(rd.count ?? rd.total ?? 0) || 0,
                        page: Number(rd.page ?? 1) || 1,
                        page_size: Number(rd.page_size ?? rd.pageSize ?? 10) || 10,
                        results: Array.isArray(rd.results) ? rd.results : (Array.isArray(rd) ? rd : []),
                    });
                } else {
                    setReviewsData({ count: 0, page: 1, page_size: 10, results: [] });
                }
            } catch (err) {
                console.error('获取医生详情失败', err);
                setError('获取医生详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [doctorId]);

    const formatReviewTime = (t) => {
        if (!t) return '';
        try {
            // created_at is usually ISO string
            const d = new Date(t);
            if (Number.isNaN(d.getTime())) return String(t);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        } catch {
            return String(t);
        }
    };

    const renderStars = (rating) => {
        const r = Math.max(0, Math.min(5, Number(rating) || 0));
        return (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        className={i < Math.round(r) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
                    />
                ))}
                <span className="ml-2 text-xs text-slate-500">{r ? r.toFixed(1).replace(/\.0$/, '') : '暂无评分'}</span>
            </div>
        );
    };

    // 监听 selectedDate 变化，自动同步到原有 date 字符串
    useEffect(() => {
        if (selectedDate) {
            const key = formatDateKey(selectedDate);
            // 若用户通过输入/其它方式选中了非 active 日期，则立即回滚
            if (key && activeScheduleDateSet.size > 0 && !activeScheduleDateSet.has(key)) {
                setSelectedDate(null);
                setDate('');
                setTimeSlot('');
                return;
            }
            setDate(key);
        } else {
            setDate('');
        }
    }, [selectedDate]);

    const handleSubmitAppointment = async () => {
        // 仅做最基本必填校验（其余交给后端）
        const doctorIdVal = Number(doctor?.id ?? doctor?.pk ?? doctorId);
        const hospitalIdVal = Number(
            doctor?.hospital_id ??
            doctor?.hospital?.id ??
            doctor?.hospital?.pk ??
            doctor?.hospital
        );
        if (!doctorIdVal || !hospitalIdVal || !date || !timeSlot) {
            setSubmitError('请填写必填项：日期、时间');
            return;
        }
        // require user to be logged in (token present)
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        if (!token) {
            setSubmitError('请先登录后再创建预约');
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);
        try {
            // normalize appointment_time to HH:mm (backend expects HH:mm)
            let normalizedTime = timeSlot;
            // if user accidentally selected a full datetime like '2026-09-04 07:14:44', extract HH:mm
            const match = String(timeSlot).match(/(\d{2}:\d{2})/);
            if (match) normalizedTime = match[1];

            // 只按接口文档传字段；patient_* 和 symptoms 可选，不填就不传（后端会默认取当前用户信息）
            const payload = {
                doctor_id: doctorIdVal,
                hospital_id: hospitalIdVal,
                appointment_date: date,
                appointment_time: normalizedTime,
            };
            if (symptoms?.trim()) payload.symptoms = symptoms.trim();
            if (patientName?.trim()) payload.patient_name = patientName.trim();
            if (patientPhone?.trim()) payload.patient_phone = patientPhone.trim();

            // log payload so developer can inspect exact request sent
            console.log('Creating appointment payload:', payload);

            const resp = await appointmentsApi.createAppointment(payload);

            // 成功后在页面显示提示并短延迟后跳转到预约记录页面
            setSubmitSuccess(resp?.message || '预约成功');
            setTimeout(() => {
                if (navigateTo) navigateTo('appointment'); else navigate('/appointment');
            }, 800);
        } catch (err) {
            console.error('创建预约失败', err);
            // 后端一般返回：{ code, message, data }
            let msg = '创建预约失败';
            if (typeof err === 'string') msg = err;
            else if (err?.message) {
                if (typeof err.message === 'string') msg = err.message;
                else if (typeof err.message === 'object') msg = Object.values(err.message).flat().join('，');
            } else if (err?.detail) msg = err.detail;

            // 409 冲突给友好提示
            if (String(msg).includes('已被占用') || String(msg).includes('409')) {
                msg = '该时间段已被占用，请选择其他时间';
            }
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-6"></div>
                <p className="text-slate-600 text-lg">正在加载医生信息...</p>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">未能获取医生信息</h2>
                    <p className="text-slate-600 mb-6">{error || '医生不存在或已下架'}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            返回上一页
                        </button>
                        <button
                            onClick={() => navigateTo('hospitals')}
                            className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                            返回医院列表
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8 lg:px-16">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* 顶部返回按钮 */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-700 hover:text-cyan-600 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:translate-x-[-2px] transition-transform" />
                    <span className="font-medium">返回</span>
                </button>

                {/* 医生信息卡片 */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* 头像部分 - 已修正：移除随机兜底图片，添加加载失败占位 */}
                        <div className="relative">
                            <img
                                src={doctor.avatar}
                                alt={`${doctor.name}医生`}
                                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
                                onError={(e) => {
                                    // 头像加载失败时，显示内嵌SVG占位图（含“医生”文字，无外部依赖）
                                    e.target.onerror = null; // 防止循环报错
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzE4NzFhNSIvPjx0ZXh0IHg9IjYwIiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Lq65omLPC90ZXh0Pjwvc3ZnPg==';
                                }}
                            />
                            {/* 在线状态徽章 */}
                            {(() => {
                                const isOnline = doctor?.is_online ?? doctor?.isOnline ?? doctor?.online;
                                const online = Boolean(isOnline);
                                return (
                                    <div className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                                        <span className={
                                            `w-4 h-4 rounded-full ` + (online ? 'bg-emerald-500' : 'bg-slate-400')
                                        } />
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="w-full">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800">{doctor.name}</h1>
                                    <p className="text-lg text-cyan-600 font-medium mt-1">{doctor.title}</p>
                                </div>
                                {/* 医生评分 */}
                                <div className="flex items-center gap-3">
                                    {renderStars(doctor.score)}
                                    <span className="text-sm text-slate-500">
                                        （{reviewsData.count || 0} 条评价）
                                    </span>
                                </div>
                            </div>

                            {/* 在线状态 + 医院信息 */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                {(() => {
                                    const isOnline = doctor?.is_online ?? doctor?.isOnline ?? doctor?.online;
                                    const online = Boolean(isOnline);
                                    return (
                                        <span className={
                                            `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ` +
                                            (online
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-50 text-slate-600 border border-slate-200')
                                        }>
                                            <span className={
                                                `w-2.5 h-2.5 rounded-full ` + (online ? 'bg-emerald-500' : 'bg-slate-400')
                                            } />
                                            {online ? '在线接诊' : '离线休息'}
                                        </span>
                                    );
                                })()}
                                {doctor?.hospital?.name && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-slate-50 text-slate-700 border border-slate-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        {doctor.hospital.name}
                                    </span>
                                )}
                            </div>

                            {/* 医生详情信息 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-500 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M12 6v6l4 2"></path>
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-sm text-slate-500">擅长领域</p>
                                        <p className="font-medium">{doctor.specialty || '暂无信息'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-500 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-sm text-slate-500">从业经验</p>
                                        <p className="font-medium">{doctor.experience || '暂无信息'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-500 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-sm text-slate-500">学历背景</p>
                                        <p className="font-medium">{doctor.education || '暂无信息'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-500 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-sm text-slate-500">医生简介</p>
                                        <p className="font-medium line-clamp-1">{doctor.introduction || '暂无信息'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 下半部分：左预约、右评论 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 左侧：预约 */}
                    <div className="bg-white rounded-2xl shadow-md p-8 order-2 md:order-1">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar size={20} className="text-cyan-600" />
                            <h2 className="text-2xl font-bold text-slate-800">预约医生</h2>
                        </div>

                        <form className="space-y-6">
                            {/* 日期选择 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                                    <Calendar size={14} /> 选择日期 <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    selected={selectedDate}
                                    locale="zh-CN"
                                    wrapperClassName="w-full"
                                    onChange={(d) => {
                                        // 切换日期时清空已选时间，避免跨日期保留旧 timeSlot
                                        setSelectedDate(d);
                                        setTimeSlot('');
                                    }}
                                    className="w-full h-12 px-4 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                                    placeholderText="请选择可预约日期"
                                    dateFormat="yyyy-MM-dd"
                                    minDate={new Date()}
                                    renderCustomHeader={({
                                        date,
                                        decreaseMonth,
                                        increaseMonth,
                                        prevMonthButtonDisabled,
                                        nextMonthButtonDisabled,
                                    }) => (
                                        <div className="px-4 py-3 flex items-center justify-between bg-slate-50 rounded-t-lg">
                                            <button
                                                type="button"
                                                onClick={decreaseMonth}
                                                disabled={prevMonthButtonDisabled}
                                                className="p-2 rounded-full text-slate-700 hover:bg-slate-100 text-sm disabled:opacity-40 transition-colors"
                                                aria-label="上个月"
                                            >
                                                ‹
                                            </button>

                                            <div className="text-center">
                                                <div className="text-sm font-semibold text-slate-800">{date.getFullYear()}年 {date.getMonth() + 1}月</div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={increaseMonth}
                                                disabled={nextMonthButtonDisabled}
                                                className="p-2 rounded-full text-slate-700 hover:bg-slate-100 text-sm disabled:opacity-40 transition-colors"
                                                aria-label="下个月"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    )}
                                    // 只高亮后端返回且 active 的日期
                                    highlightDates={activeScheduleDates.map(d => new Date(d))}
                                    // 只允许选中后端返回且 active 的日期，其他日期禁用（并配合 dayClassName 置灰）
                                    filterDate={(d) => {
                                        const key = formatDateKey(d);
                                        // 若后端没返回任何排班，则全部禁用（避免误认为都可预约）
                                        if (activeScheduleDateSet.size === 0) return false;
                                        return activeScheduleDateSet.has(key);
                                    }}
                                    dayClassName={(d) => {
                                        const key = formatDateKey(d);
                                        const isActive = activeScheduleDateSet.has(key);
                                        // 只对可预约日期加高亮样式；禁用日期交给 react-datepicker 的 disabled 样式即可
                                        if (!isActive) return 'text-slate-300';
                                        return 'bg-cyan-100 text-cyan-800 font-bold rounded-full';
                                    }}
                                />
                                {activeScheduleDates.length === 0 && (
                                    <p className="mt-2 text-xs text-slate-500 italic">
                                        当前医生暂无可预约排班日期（以后台排班为准）。
                                    </p>
                                )}
                            </div>

                            {/* 时间选择 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                                    <Clock size={14} /> 选择时间 <span className="text-red-500">*</span>
                                </label>
                                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                                    <div className="grid grid-cols-4 gap-3">
                                        {timeSlots.map((slot) => {
                                            const disabled = !date;
                                            const selected = timeSlot === slot.value;
                                            return (
                                                <button
                                                    key={slot.value}
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => setTimeSlot(slot.value)}
                                                    className={
                                                        'py-2.5 rounded-lg text-sm transition-all ' +
                                                        (disabled
                                                            ? 'bg-white text-slate-300 border border-slate-200 cursor-not-allowed opacity-50'
                                                            : selected
                                                                ? 'bg-cyan-600 text-white border border-cyan-600 shadow-sm'
                                                                : 'bg-white text-slate-700 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50'
                                                        )
                                                    }
                                                >
                                                    {slot.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {!date && (
                                        <p className="mt-2 text-xs text-slate-500 italic">
                                            请先选择日期后再选择时间。
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 患者电话 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                                    <Phone size={14} /> 联系电话 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={patientPhone}
                                    onChange={e => setPatientPhone(e.target.value)}
                                    className="w-full h-12 px-4 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                                    placeholder="请输入您的联系电话"
                                />
                            </div>

                            {/* 症状描述 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                                    <MessageSquare size={14} /> 症状描述
                                </label>
                                <textarea
                                    value={symptoms}
                                    onChange={e => setSymptoms(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all resize-none"
                                    rows={4}
                                    placeholder="请简要描述您的症状（选填）"
                                ></textarea>
                            </div>

                            {/* 错误提示 */}
                            {submitError && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    {submitError}
                                </div>
                            )}

                            {/* 按钮组 */}
                            <div className="flex flex-wrap gap-4 justify-center pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleSubmitAppointment}
                                    className="px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 active:bg-cyan-800 transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
                                >
                                    {submitting ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></span>
                                            提交中...
                                        </span>
                                    ) : (
                                        <>确认预约</>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDate('');
                                        setTimeSlot('');
                                        setSymptoms('');
                                        setPatientName('');
                                        setPatientPhone('');
                                    }}
                                    className="px-8 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors w-full md:w-auto"
                                >
                                    重置
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* 右侧：评论 */}
                    <div className="bg-white rounded-2xl shadow-md p-8 order-1 md:order-2">
                        <div className="flex items-baseline justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-cyan-600" />
                                <h2 className="text-2xl font-bold text-slate-800">患者评价</h2>
                            </div>
                            <div className="text-sm text-slate-500">
                                共 <span className="text-cyan-600 font-medium">{reviewsData.count || reviewsData.results.length}</span> 条
                            </div>
                        </div>

                        {reviewsData.results && reviewsData.results.length > 0 ? (
                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {reviewsData.results.map((r, idx) => (
                                    <div key={r.created_at || idx} className="bg-slate-50 rounded-xl p-5 hover:shadow-sm transition-shadow">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            {renderStars(r.rating)}
                                            <div className="text-xs text-slate-500">{formatReviewTime(r.created_at)}</div>
                                        </div>
                                        {r.diagnosis ? (
                                            <div className="mt-2 text-xs text-slate-500 bg-white rounded-md p-2 inline-block">
                                                <span className="font-medium text-slate-600">病症/诊断：</span>
                                                {r.diagnosis}
                                            </div>
                                        ) : null}
                                        <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                                            {r.comment ? r.comment : <span className="text-slate-400 italic">（用户未填写文字评价）</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                                <MessageSquare size={40} className="mb-4 opacity-50" />
                                <p className="text-lg">暂无患者评价</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 预约成功弹窗 */}
            {submitSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">预约成功</h3>
                            <div className="mb-6 text-sm text-slate-600">{submitSuccess}</div>
                            <button
                                onClick={() => setSubmitSuccess(null)}
                                className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors w-full"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDetailPage;