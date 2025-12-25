import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { getDoctorMe } from '../../api/doctor';

const ScheduleUpload = () => {
    const [hospitalId, setHospitalId] = useState('');
    const [doctorIds, setDoctorIds] = useState([]);
    const [dates, setDates] = useState([]);
    const [status, setStatus] = useState('active');
    const [overwrite, setOverwrite] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // 可用的医院列表（可以从 API 获取）
    const [hospitals, setHospitals] = useState([]);
    // 可用的医生列表（可以从 API 获取）
    const [doctors, setDoctors] = useState([]);
    const [doctorHospitalId, setDoctorHospitalId] = useState('');
    
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        loadDoctorAndData();
    }, []);

    const loadDoctorAndData = async () => {
        try {
            // 优先获取当前医生信息，确定医院
            const doctor = await getDoctorMe();
            const hospitalIdFromDoctor = doctor?.hospital_id || doctor?.hospital?.id;
            const hospitalObj = doctor?.hospital;

            if (hospitalIdFromDoctor) {
                const hid = String(hospitalIdFromDoctor);
                setDoctorHospitalId(hid);
                setHospitalId(hid);
            }

            // 只允许本院：医院列表固定为本院
            if (hospitalObj) {
                setHospitals([hospitalObj]);
            } else if (hospitalIdFromDoctor) {
                await fetchHospitals(hospitalIdFromDoctor);
            }

            // 只拉取本院医生
            await fetchDoctors(hospitalIdFromDoctor);
        } catch (err) {
            console.error('加载医生/医院信息失败，回退全量列表:', err);
            // 回退：全量拉取
            await fetchHospitals();
            await fetchDoctors();
        }
    };

    const fetchHospitals = async (onlyId) => {
        try {
            const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';
            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
            const url = onlyId ? `${API_BASE}/hospitals/${onlyId}/` : `${API_BASE}/hospitals/`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.code === 200 && result.data) {
                if (onlyId) {
                    setHospitals([result.data]);
                } else {
                    setHospitals(result.data.results || result.data || []);
                }
            }
        } catch (err) {
            console.error('获取医院列表失败:', err);
        }
    };

    const fetchDoctors = async (hospitalIdFilter) => {
        try {
            const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';
            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
            const query = hospitalIdFilter ? `?hospital_id=${hospitalIdFilter}` : '';
            const response = await fetch(`${API_BASE}/doctors/${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.code === 200 && result.data) {
                setDoctors(result.data.results || result.data || []);
            }
        } catch (err) {
            console.error('获取医生列表失败:', err);
        }
    };

    const handleAddDoctor = () => {
        if (!selectedDoctorId) {
            setError('请选择医生');
            return;
        }
        
        const id = parseInt(selectedDoctorId);
        if (doctorIds.includes(id)) {
            setError('该医生已添加');
            return;
        }
        
        setDoctorIds([...doctorIds, id]);
        setSelectedDoctorId('');
        setError('');
    };

    const handleRemoveDoctor = (id) => {
        setDoctorIds(doctorIds.filter(did => did !== id));
    };

    const handleAddDate = () => {
        if (!newDate) {
            setError('请选择日期');
            return;
        }
        
        if (dates.includes(newDate)) {
            setError('该日期已添加');
            return;
        }
        
        setDates([...dates, newDate]);
        setNewDate('');
        setError('');
    };

    const handleRemoveDate = (date) => {
        setDates(dates.filter(d => d !== date));
    };

    const handleSubmit = async () => {
        // 验证
        if (!hospitalId) {
            setError('请选择医院');
            return;
        }
        
        if (doctorIds.length === 0) {
            setError('请至少添加一位医生');
            return;
        }
        
        if (dates.length === 0) {
            setError('请至少添加一个日期');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
            const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';

            const payload = {
                hospital_id: parseInt(hospitalId),
                doctor_ids: doctorIds,
                dates: dates,
                status: status,
                overwrite: overwrite
            };

            console.log('提交排班数据:', payload);

            const response = await fetch(`${API_BASE}/doctors/schedules/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const rawText = await response.text();
            let result = {};
            try {
                result = rawText ? JSON.parse(rawText) : {};
            } catch (e) {
                console.warn('响应不是 JSON，原始内容:', rawText);
                result = { message: rawText };
            }
            console.log('排班提交响应:', result);

            if (response.ok && result.code === 200) {
                setSuccess(result.message || '排班信息提交成功！');
                // 清空表单
                setDoctorIds([]);
                setDates([]);
                setHospitalId(doctorHospitalId || '');
                setStatus('active');
                setOverwrite(false);
            } else {
                const serverMsg = result?.message || rawText || '提交失败，请重试';
                setError(serverMsg);
            }
        } catch (err) {
            console.error('提交排班失败:', err);
            setError('提交失败：' + (err.message || '网络错误'));
        } finally {
            setSubmitting(false);
        }
    };

    const getDoctorName = (id) => {
        const doctor = doctors.find(d => d.id === id);
        return doctor ? doctor.name : `医生 ${id}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">排班管理（管理员）</h2>
            </div>

            <div className="space-y-4">
                {/* 医院选择 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        医院 <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        disabled={!!doctorHospitalId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${doctorHospitalId ? 'bg-gray-50 text-gray-500' : ''}`}
                    >
                        <option value="">请选择医院</option>
                        {hospitals.map(hospital => (
                            <option key={hospital.id} value={hospital.id}>
                                {hospital.name}
                            </option>
                        ))}
                    </select>
                    {doctorHospitalId && (
                        <p className="mt-1 text-xs text-gray-500">已限定为本院排班，若需更改请联系管理员。</p>
                    )}
                </div>

                {/* 医生选择 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        医生 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">请选择医生</option>
                            {doctors.map(doctor => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.name} - {doctor.specialty}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddDoctor}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                            <Plus size={16} />
                            添加
                        </button>
                    </div>
                    
                    {/* 已选医生列表 */}
                    {doctorIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {doctorIds.map(id => (
                                <div
                                    key={id}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                    {getDoctorName(id)}
                                    <button
                                        onClick={() => handleRemoveDoctor(id)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 日期选择 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        日期 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={handleAddDate}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                            <Plus size={16} />
                            添加
                        </button>
                    </div>
                    
                    {/* 已选日期列表 */}
                    {dates.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {dates.map(date => (
                                <div
                                    key={date}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                >
                                    {date}
                                    <button
                                        onClick={() => handleRemoveDate(date)}
                                        className="text-green-600 hover:text-green-800"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 状态选择 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        状态
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="active">启用</option>
                        <option value="inactive">停用</option>
                    </select>
                </div>

                {/* 覆盖选项 */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="overwrite"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="overwrite" className="text-sm text-gray-700">
                        覆盖已存在的排班信息
                    </label>
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* 成功提示 */}
            {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {/* 提交按钮 */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                        submitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                    {submitting ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            提交中...
                        </span>
                    ) : (
                        '提交排班'
                    )}
                </button>
            </div>
        </div>
    );
};

export default ScheduleUpload;
