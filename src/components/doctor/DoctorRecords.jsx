import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Save, X, Search, Filter } from 'lucide-react';
import doctorApi from '../../api/doctor';

const DoctorRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // 搜索和过滤参数
    const [searchFilters, setSearchFilters] = useState({
        patient_name: '',
        doctor_name: '',
        date_from: '',
        date_to: '',
        patient_id: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    
    const [formData, setFormData] = useState({
        user_id: '',
        hospital_id: '',
        date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        content: '',
        treatment: '',
        medications: [],
        result_image: ''
    });
    const [medicationInput, setMedicationInput] = useState('');

    useEffect(() => {
        fetchRecords();
    }, [currentPage, pageSize]);

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
                    setRecords(res.data);
                } else if (res.data.results && Array.isArray(res.data.results)) {
                    setRecords(res.data.results);
                } else {
                    setRecords([]);
                }
            } else if (Array.isArray(res)) {
                setRecords(res);
            } else {
                // 使用模拟数据
                setRecords([
                    {
                        id: 1,
                        patient_name: '张三',
                        date: '2025-12-10',
                        diagnosis: '龋齿',
                        treatment: '充填',
                        status: 'completed'
                    }
                ]);
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
            doctor_name: '',
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
    };

    const handleSubmitForm = async () => {
        if (!formData.user_id || !formData.diagnosis || !formData.treatment) {
            setError('请填写必要字段');
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
                const res = await doctorApi.createRecord(formData);
                console.log('创建病例响应:', res);
                
                if (res && res.data) {
                    setRecords(prev => [...prev, res.data]);
                } else {
                    setRecords(prev => [...prev, { id: Date.now(), ...formData }]);
                }
                setError(null);
                alert('病例已成功创建！');
            }
            resetForm();
            setShowForm(false);
        } catch (err) {
            console.error('保存病例失败:', err);
            setError(editingId ? '更新病例失败' : '创建病例失败');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            user_id: '',
            hospital_id: '',
            date: new Date().toISOString().split('T')[0],
            diagnosis: '',
            content: '',
            treatment: '',
            medications: [],
            result_image: ''
        });
        setMedicationInput('');
        setEditingId(null);
    };

    const handleEditRecord = (record) => {
        setFormData(record);
        setEditingId(record.id);
        setShowForm(true);
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
                    {!showForm && (
                        <>
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
                                    setShowForm(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                <Plus size={18} />
                                新建病例
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 搜索和过滤区域 */}
            {showFilters && !showForm && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">患者名字</label>
                            <input
                                type="text"
                                name="patient_name"
                                value={searchFilters.patient_name}
                                onChange={handleSearchFilterChange}
                                placeholder="输入患者名字"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">医生名字</label>
                            <input
                                type="text"
                                name="doctor_name"
                                value={searchFilters.doctor_name}
                                onChange={handleSearchFilterChange}
                                placeholder="输入医生名字"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">患者ID</label>
                            <input
                                type="text"
                                name="patient_id"
                                value={searchFilters.patient_id}
                                onChange={handleSearchFilterChange}
                                placeholder="输入患者ID"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
                            <input
                                type="date"
                                name="date_from"
                                value={searchFilters.date_from}
                                onChange={handleSearchFilterChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">结束日期</label>
                            <input
                                type="date"
                                name="date_to"
                                value={searchFilters.date_to}
                                onChange={handleSearchFilterChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleApplyFilters}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                搜索
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
                            >
                                清空
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

            {/* 新建/编辑表单 */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                        {editingId ? '编辑病例' : '新建病例'}
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">患者ID</label>
                                <input
                                    type="text"
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleFormChange}
                                    placeholder="请输入患者ID"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">医院ID</label>
                                <input
                                    type="text"
                                    name="hospital_id"
                                    value={formData.hospital_id}
                                    onChange={handleFormChange}
                                    placeholder="请输入医院ID"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">检查图片URL</label>
                            <input
                                type="text"
                                name="result_image"
                                value={formData.result_image}
                                onChange={handleFormChange}
                                placeholder="请输入检查图片URL"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(false);
                                }}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmitForm}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Save size={18} />
                                保存病例
                            </button>
                        </div>
                    </div>
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
                                    <h3 className="text-lg font-bold text-slate-800">{record.patient_name || `患者 #${record.user_id}`}</h3>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-slate-600">
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
        </div>
    );
};

export default DoctorRecords;
