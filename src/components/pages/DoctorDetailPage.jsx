import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorsApi from '../../api/doctors';
import appointmentsApi from '../../api/appointments';
import { ArrowLeft, Star } from 'lucide-react';

const DoctorDetailPage = ({ navigateTo }) => {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // appointment form state (moved up so hooks order is stable)
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    const defaultTimeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

    useEffect(() => {
        const fetch = async () => {
            if (!doctorId) return;
            setLoading(true);
            setError(null);
            try {
                const resp = await doctorsApi.getDoctorDetail(parseInt(doctorId));
                setDoctor(resp.data || resp);
            } catch (err) {
                console.error('获取医生详情失败', err);
                setError('获取医生详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [doctorId]);

    if (loading) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-slate-600">加载中...</p>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold mb-4">未能获取医生信息</h2>
                <p className="text-slate-600 mb-6">{error || '医生不存在'}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border rounded">返回</button>
                    <button onClick={() => navigateTo('hospitals')} className="px-4 py-2 bg-cyan-600 text-white rounded">返回医院列表</button>
                </div>
            </div>
        );
    }


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

    return (
        <div className="space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft size={18} /> 返回
            </button>

            <div className="bg-white rounded-lg shadow-lg p-6 flex gap-6">
                <img src={doctor.avatar} alt={doctor.name} className="w-32 h-32 rounded-full object-cover border" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{doctor.name}</h1>
                    <p className="text-sm text-cyan-600 font-medium">{doctor.title}</p>
                    <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < Math.floor(doctor.score || 0) ? 'fill-yellow-500' : ''} />
                            ))}
                        </div>
                        <span className="font-bold">{doctor.score ?? '-'}</span>
                    </div>
                    <div className="mt-4 text-slate-600">
                        <p className="mb-2"><strong>擅长：</strong>{doctor.specialty}</p>
                        <p className="mb-2"><strong>简介：</strong>{doctor.introduction}</p>
                        <p className="mb-2"><strong>学历：</strong>{doctor.education}</p>
                        <p className="mb-2"><strong>经验：</strong>{doctor.experience}</p>
                    </div>
                </div>
            </div>

            {/* 下半部分：左预约、右评论 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：预约 */}
                <div className="order-2 md:order-1 bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold">预约医生</h2>
                        <span className="inline-flex items-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1 font-medium shadow-sm">
                            <svg className="w-4 h-4 mr-1 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                            需要在预约时间后的30分钟内完成签到
                        </span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-2">选择日期</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="border p-2 rounded w-full"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-2">选择时间</label>
                            <select
                                value={timeSlot}
                                onChange={e => setTimeSlot(e.target.value)}
                                className="border p-2 rounded w-full"
                            >
                                <option value="">请选择时间</option>
                                {defaultTimeSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                        </div>
                        <label className="block text-sm text-slate-600 mb-2">电话</label>
                        <input type="text" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="border p-2 rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-2">症状描述</label>
                        <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} className="border p-2 rounded w-full" rows={4}></textarea>
                    </div>
                    {submitError && <div className="text-red-500">{submitError}</div>}
                    {/* 预约成功弹窗 */}
                    {submitSuccess && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                                <h3 className="text-lg font-bold mb-2 text-green-600">预约成功</h3>
                                <div className="mb-4 text-sm text-slate-700">{submitSuccess}</div>
                                <div className="flex justify-end">
                                    <button onClick={() => setSubmitSuccess(null)} className="px-4 py-1 bg-cyan-600 text-white rounded text-sm">关闭</button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-3">
                        <button disabled={submitting} onClick={handleSubmitAppointment} className="px-4 py-2 bg-cyan-600 text-white rounded flex items-center justify-center">
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                                    提交中...
                                </span>
                            ) : '确认预约'}
                        </button>
                        <button onClick={() => { setDate(''); setTimeSlot(''); setSymptoms(''); setPatientName(''); setPatientPhone(''); }} className="px-4 py-2 border rounded">重置</button>
                    </div>
                </div>

                {/* 右侧：评论 */}
                <div className="order-1 md:order-2 bg-white rounded-lg shadow-md p-6 min-h-[300px] border border-dashed border-cyan-300">
                    <h2 className="text-xl font-bold mb-4">评论</h2>
                    {doctor.reviewsData && doctor.reviewsData.length > 0 ? (
                        doctor.reviewsData.map(r => (
                            <div key={r.id} className="border-b border-slate-100 pb-4 mb-4 last:mb-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium text-slate-700">{r.patient}</div>
                                    <div className="text-sm text-slate-500">{r.date}</div>
                                </div>
                                <p className="text-slate-600">{r.content}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500">暂无评论</p>
                    )}
                </div>
            </div>
        </div>

    );
};

export default DoctorDetailPage;
