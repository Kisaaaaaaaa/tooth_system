import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Save, X, Search, Filter } from 'lucide-react';
import doctorApi from '../../api/doctor';
import uploadApi from '../../api/upload';

const DoctorRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // 搜索和过滤参数
    const [searchFilters, setSearchFilters] = useState({
        patient_name: '',
        date_from: '',
        date_to: '',
        patient_id: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    
    const [formData, setFormData] = useState({
        patient_name: '',
        user_id: '',
        hospital_id: '',
        doctor_id: '',
        date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        content: '',
        treatment: '',
        medications: [],
        result_image: ''
    });
    const [medicationInput, setMedicationInput] = useState('');
    const [doctorInfo, setDoctorInfo] = useState({ doctor_id: '', hospital_id: '', hospital_name: '' });
    const [patientIndex, setPatientIndex] = useState({});

    useEffect(() => {
        fetchDoctorDefaults();
        fetchPatientIndex();
        fetchRecords();
    }, [currentPage, pageSize]);

    // 统一补全名称字段，兼容后端返回的 id/name 组合
    const normalizeRecords = (arr = []) =>
        arr.map(r => ({
            ...r,
            patient_name: r.patient_name || r.user_name || r.name || '未知患者',
            doctor_name: r.doctor_name || r.doctor?.name || '主诊医生',
            hospital_name: r.hospital_name || r.hospital?.name || '未填写医院'
        }));

    // 医生/医院默认值
    const fetchDoctorDefaults = async () => {
        try {
            const me = await doctorApi.getDoctorMe();
            const doctor_id = me?.id || me?.doctor_id || '';
            const hospital_id = me?.hospital_id || me?.hospital?.id || '';
            const hospital_name = me?.hospital_name || me?.hospital?.name || '';
            setDoctorInfo({ doctor_id, hospital_id, hospital_name });
            setFormData(prev => ({ ...prev, doctor_id, hospital_id }));
        } catch (e) {
            console.warn('获取医生默认信息失败:', e);
        }
    };

    // 建立患者名字到ID的索引（从预约列表中抓取）
    const fetchPatientIndex = async () => {
        try {
            const res = await doctorApi.getAppointments();
            const payload = res?.data?.results || res?.results || res?.data || res;
            if (Array.isArray(payload)) {
                const idx = {};
                payload.forEach(item => {
                    const name = item.patient_name || item.user_name || item.name;
                    const uid = item.user_id;
                    if (name && uid) {
                        idx[name] = uid;
                    }
                });
                setPatientIndex(idx);
            }
        } catch (e) {
            console.warn('获取预约以索引患者失败:', e);
        }
    };

    const resolvePatientId = (name) => {
        if (!name) return '';
        if (patientIndex[name]) return patientIndex[name];
        // 尝试从已加载的病例中反查
        const fromRecords = records.find(r => r.patient_name === name && r.user_id);
        return fromRecords?.user_id || '';
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                ...searchFilters,
                page: currentPage,
                page_size: pageSize
            };
            const res = await doctorApi.getPatientRecords(params);
            console.log('病例列表响应:', res);
            
            if (res && res.data) {
                // 处理分页对象格式：{count, page, page_size, results}
                if (Array.isArray(res.data)) {
                    setRecords(normalizeRecords(res.data));
                } else if (res.data.results && Array.isArray(res.data.results)) {
                    setRecords(normalizeRecords(res.data.results));
                } else {
                    setRecords([]);
                }
            } else if (Array.isArray(res)) {
                setRecords(normalizeRecords(res));
            } else {
                // 使用模拟数据
                setRecords(normalizeRecords([
                    {
                        id: 1,
                        patient_name: '张三',
                        date: '2025-12-10',
                        diagnosis: '龋齿',
                        treatment: '充填',
                        status: 'completed'
                    }
                ]));
            }
        } catch (err) {
            console.error('获取病例列表失败:', err);
            setError('获取病例列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchFilterChange = (e) => {
        const { name, value } = e.target;
        setSearchFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1); // 搜索时重置页码
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchRecords();
    };

    const handleClearFilters = () => {
        setSearchFilters({
            patient_name: '',
            date_from: '',
            date_to: '',
            patient_id: ''
        });
        setCurrentPage(1);
    };

    const handleAddMedication = () => {
        if (medicationInput.trim()) {
            setFormData(prev => ({
                ...prev,
                medications: [...prev.medications, medicationInput]
            }));
            setMedicationInput('');
        }
    };

    const handleRemoveMedication = (index) => {
        setFormData(prev => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index)
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'patient_name') {
            const resolved = resolvePatientId(value.trim());
            if (resolved) {
                setFormData(prev => ({ ...prev, user_id: resolved, patient_name: value }));
            }
        }
    };

    // 本地上传检查图片，保存后端返回的URL到 result_image
    const handleResultImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setError(null);
            const res = await uploadApi.uploadFile(file, { purpose: 'records' });
            const url = res?.url || (typeof res === 'string' ? res : '');
            if (!url) throw new Error('图片上传失败：未返回URL');
            setFormData(prev => ({ ...prev, result_image: url }));
        } catch (err) {
            console.error('检查图片上传失败:', err);
            setError(err?.message || '检查图片上传失败');
        } finally {
            // 清空文件选择器的值，避免相同文件无法触发 onChange
            e.target.value = '';
        }
    };

    const handleSubmitForm = async () => {
        const payload = { ...formData };
        if (!payload.user_id) {
            payload.user_id = resolvePatientId(payload.patient_name);
        }
        if (!payload.user_id) {
            setError('未找到该患者ID，请先通过预约或让管理员提供患者ID');
            return;
        }
        payload.doctor_id = payload.doctor_id || doctorInfo.doctor_id;
        payload.hospital_id = payload.hospital_id || doctorInfo.hospital_id;
        if (!payload.doctor_id || !payload.hospital_id) {
            setError('缺少医生或医院信息，请刷新页面重试');
            return;
        }
        if (!payload.diagnosis || !payload.treatment) {
            setError('请填写诊断和治疗方案');
            return;
        }

        try {
            setLoading(true);
            if (editingId) {
                // 更新病例
                const updateData = {
                    date: formData.date,
                    diagnosis: formData.diagnosis,
                    content: formData.content,
                    treatment: formData.treatment,
                    medications: formData.medications,
                    result_image: formData.result_image
                };
                const res = await doctorApi.updateRecord(editingId, updateData);
                console.log('更新病例响应:', res);
                
                setRecords(prev =>
                    prev.map(r =>
                        r.id === editingId
                            ? { ...r, ...formData }
                            : r
                    )
                );
                setError(null);
                alert('病例已成功更新！');
            } else {
                // 创建病例
                const res = await doctorApi.createRecord(payload);
                console.log('创建病例响应:', res);
                
                if (res && res.data) {
                    setRecords(prev => [...prev, normalizeRecords([res.data])[0]]);
                } else {
                    setRecords(prev => [...prev, normalizeRecords([{ id: Date.now(), ...payload }])[0]]);
                }
                setError(null);
                alert('病例已成功创建！');
            }
            resetForm();
        } catch (err) {
            console.error('保存病例失败:', err);
            setError(editingId ? '更新病例失败' : '创建病例失败');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            patient_name: '',
            user_id: '',
            hospital_id: doctorInfo.hospital_id || '',
            doctor_id: doctorInfo.doctor_id || '',
            date: new Date().toISOString().split('T')[0],
            diagnosis: '',
            content: '',
            treatment: '',
            medications: [],
            result_image: ''
        });
        setMedicationInput('');
        setEditingId(null);
        setShowEditModal(false);
    };

    const handleEditRecord = (record) => {
        setFormData({
            patient_name: record.patient_name,
            user_id: record.user_id || '',
            hospital_id: record.hospital_id || doctorInfo.hospital_id,
            doctor_id: record.doctor_id || doctorInfo.doctor_id,
            date: record.date,
            diagnosis: record.diagnosis,
            content: record.content,
            treatment: record.treatment,
            medications: record.medications || [],
            result_image: record.result_image || ''
        });
        setEditingId(record.id);
        setShowEditModal(true);
    };

    const handleDeleteRecord = async (recordId) => {
        if (!confirm('确认删除此病例吗？')) return;
        try {
            // API未提供删除接口，只做前端删除
            setRecords(prev => prev.filter(r => r.id !== recordId));
        } catch (err) {
            setError('删除病例失败');
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
            {/* 顶部操作栏 */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">病例管理</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                    >
                        <Filter size={18} />
                        筛选
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingId(null);
                            setShowEditModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        <Plus size={18} />
                        新建病例
                    </button>
                </div>
            </div>

            {/* 搜索和过滤区域 */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">患者名字</label>
                                <input
                                    type="text"
                                    name="patient_name"
                                    value={searchFilters.patient_name}
                                    onChange={handleSearchFilterChange}
                                    placeholder="输入患者名字"
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">患者ID</label>
                                <input
                                    type="text"
                                    name="patient_id"
                                    value={searchFilters.patient_id}
                                    onChange={handleSearchFilterChange}
                                    placeholder="输入患者ID"
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">开始日期</label>
                                <input
                                    type="date"
                                    name="date_from"
                                    value={searchFilters.date_from}
                                    onChange={handleSearchFilterChange}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">结束日期</label>
                                <input
                                    type="date"
                                    name="date_to"
                                    value={searchFilters.date_to}
                                    onChange={handleSearchFilterChange}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={handleClearFilters}
                                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                            >
                                清空
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                            >
                                搜索
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}



            {/* 病例列表 */}
            <div className="space-y-3">
                {records.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <FileText className="mx-auto mb-3 text-slate-400" size={40} />
                        <p className="text-slate-600">暂无病例记录</p>
                    </div>
                ) : (
                    records.map(record => (
                        <div key={record.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800">{record.patient_name}</h3>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-slate-600">
                                        <p><span className="font-medium">医院:</span> {record.hospital_name}</p>
                                        <p><span className="font-medium">医生:</span> {record.doctor_name}</p>
                                        <p><span className="font-medium">诊断:</span> {record.diagnosis}</p>
                                        <p><span className="font-medium">日期:</span> {record.date}</p>
                                        <p><span className="font-medium">治疗:</span> {record.treatment}</p>
                                        {record.medications && record.medications.length > 0 && (
                                            <p><span className="font-medium">用药:</span> {record.medications.join(', ')}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEditRecord(record)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="编辑"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRecord(record.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="删除"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 分页和每页条数 */}
            {records.length > 0 && (
                <div className="flex items-center justify-between py-4 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600">每页条数:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            上一页
                        </button>
                        <span className="text-sm text-slate-600">第 {currentPage} 页</span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            )}

            {/* 编辑病例弹窗 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-800">{editingId ? '编辑病例' : '新建病例'}</h2>
                            <button
                                onClick={() => {
                                    resetForm();
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">患者姓名</label>
                                    <input
                                        type="text"
                                        name="patient_name"
                                        value={formData.patient_name}
                                        onChange={handleFormChange}
                                        placeholder="输入患者姓名，系统将尝试匹配ID"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {!editingId && <p className="text-xs text-slate-500 mt-1">若未自动匹配到ID，请让患者先有预约记录或联系管理员提供ID。</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">患者ID{!editingId && '（自动匹配）'}</label>
                                    <input
                                        type="text"
                                        name="user_id"
                                        value={formData.user_id}
                                        onChange={handleFormChange}
                                        placeholder={editingId ? "患者ID" : "将根据姓名自动匹配，必要时可手动填写"}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">医院</label>
                                    <input
                                        type="text"
                                        value={doctorInfo.hospital_name || '当前医院'}
                                        readOnly
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">主诊医生</label>
                                    <input
                                        type="text"
                                        value={doctorInfo.doctor_id || '当前医生'}
                                        readOnly
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">就诊日期</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">诊断</label>
                                    <input
                                        type="text"
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleFormChange}
                                        placeholder="请输入诊断"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">治疗方案</label>
                                <textarea
                                    name="treatment"
                                    value={formData.treatment}
                                    onChange={handleFormChange}
                                    placeholder="请输入治疗方案"
                                    rows="3"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">病情内容</label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleFormChange}
                                    placeholder="请输入详细病情"
                                    rows="3"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">用药</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={medicationInput}
                                        onChange={(e) => setMedicationInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddMedication();
                                            }
                                        }}
                                        placeholder="输入药物名称后回车添加"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleAddMedication}
                                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                                    >
                                        添加
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.medications.map((med, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                        >
                                            {med}
                                            <button
                                                onClick={() => handleRemoveMedication(idx)}
                                                className="hover:opacity-70"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">检查图片</label>
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center justify-center px-3 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-sm text-slate-700">
                                        上传图片
                                        <input type="file" accept="image/*" onChange={handleResultImageUpload} className="hidden" />
                                    </label>
                                    {formData.result_image && (
                                        <a href={formData.result_image} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline text-sm truncate max-w-[320px]" title={formData.result_image}>
                                            {formData.result_image}
                                        </a>
                                    )}
                                </div>
                                {formData.result_image && (
                                    <div className="mt-3">
                                        <img src={formData.result_image} alt="检查图片预览" className="w-48 h-32 object-cover rounded-lg border border-slate-200" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => {
                                        resetForm();
                                    }}
                                    className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmitForm}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                                >
                                    <Save size={18} />
                                    保存病例
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorRecords;
