import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, Search } from 'lucide-react';
import doctorsApi from '../../api/doctors';
import { MOCK_DOCTORS, MOCK_HOSPITALS } from '../../data/mockData';

// 医生概况页面
const DoctorsPage = ({ navigateTo, startConsultation, startAppointment }) => {
    // 搜索关键词
    const [searchKeyword, setSearchKeyword] = useState('');
    // 医生数据、加载、错误
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 加载医生列表（优先接口，失败回退 mock）
    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            setError(null);
            try {
                // 后端接口：/doctors?view=list
                const response = await doctorsApi.getDoctors({ view: 'list', page_size: 50 });
                const apiDoctors = response?.data?.results || [];
                setDoctors(apiDoctors);
            } catch (err) {
                console.error('获取医生列表失败，使用本地数据', err);
                setError('获取医生列表失败，已使用本地数据');
                setDoctors(MOCK_DOCTORS);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    // 根据搜索关键词过滤医生列表
    const filteredDoctors = doctors.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    // 根据医院ID获取医院名称（接口未返回名称时兜底）
    const getHospitalName = (hospitalId) => {
        const hospital = MOCK_HOSPITALS.find(h => h.id === hospitalId);
        return hospital ? hospital.name : '未知医院';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 顶部搜索区域 */}
            <div className="flex justify-end mt-6">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        placeholder="搜索医生姓名"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border-2 border-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                </div>
            </div>

            {/* 顶部错误提示 */}
            {error && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                    {error}
                </div>
            )}

            {/* 医生列表 */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 shadow-md border border-slate-100 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">加载医生列表中...</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {filteredDoctors.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                {/* 头像 */}
                                <img
                                    src={doc.avatar}
                                    alt={doc.name}
                                    className="w-14 h-14 rounded-full object-cover border-3 border-cyan-200 shadow-md transition-transform duration-300 hover:scale-105"
                                />

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 transition-colors duration-300 hover:text-cyan-700">{doc.name}</h3>
                                            <p className="text-sm text-cyan-600 font-medium mt-0.5">{doc.title}</p>
                                            <p className="text-xs text-slate-600 mt-1">专长：{doc.specialty}</p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                                {getHospitalName(doc.hospital_id)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-full">
                                            <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                                            <span className="text-sm font-bold text-amber-700">{doc.score}</span>
                                        </div>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex gap-2 mt-5">
                                        <button
                                            onClick={() => startConsultation && startConsultation(doc)}
                                            className="flex-1 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                                        >
                                            <MessageSquare size={16} />
                                            <span>在线问诊</span>
                                        </button>
                                        <button
                                            onClick={() => startAppointment ? startAppointment(doc) : navigateTo('appointment')}
                                            className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                        >
                                            <Calendar size={16} />
                                            <span>预约挂号</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 无搜索结果提示 */}
            {filteredDoctors.length === 0 && !loading && (
                <div className="bg-white rounded-2xl p-12 shadow-md border border-slate-100 text-center">
                    <Search size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">未找到相关医生</h3>
                    <p className="text-slate-500">请尝试使用其他关键词搜索</p>
                </div>
            )}
        </div>
    );
}

export default DoctorsPage;

