import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock } from 'lucide-react';
import hospitalsApi from '../../api/hospitals';
import doctorsApi from '../../api/doctors';
import { MOCK_HOSPITALS, MOCK_DOCTORS } from '../../data/mockData';

const HospitalDetailPage = ({ navigateTo, hospitalId, startConsultation, startAppointment }) => {
    const { hospitalId: hospitalIdFromRoute } = useParams();
    const effectiveHospitalId = hospitalId || hospitalIdFromRoute;

    const [hospital, setHospital] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [doctorsError, setDoctorsError] = useState(null);

    // 兼容后端字段差异（避免 name/image 为空导致标题/图片不显示）
    const hospitalName = hospital?.name || '医院详情';
    const hospitalImage = hospital?.image || null;
    const hospitalDesc = hospital?.description || hospital?.introduction || '';

    // 获取医院详情
    useEffect(() => {
        const fetchHospitalDetail = async () => {
            if (!effectiveHospitalId) {
                setHospital(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // 调用真实API获取医院详情
                const response = await hospitalsApi.getHospitalDetail(parseInt(effectiveHospitalId));
                // 根据APIFox文档，医院详情在response.data中
                setHospital(response.data || null);
            } catch (err) {
                // API调用失败时回退到mock数据
                setError('获取医院详情失败，已使用本地数据');
                console.error('获取医院详情失败:', err);
                const mockHospital = MOCK_HOSPITALS.find(h => h.id === parseInt(effectiveHospitalId));
                setHospital(mockHospital || null);
            } finally {
                setLoading(false);
            }
        };

        fetchHospitalDetail();
    }, [effectiveHospitalId]);

    // 获取医生列表
    useEffect(() => {
        const fetchDoctors = async () => {
            if (!effectiveHospitalId) {
                setDoctors([]);
                return;
            }

            setDoctorsLoading(true);
            setDoctorsError(null);
            try {
                // 调用真实API获取医生列表
                const response = await doctorsApi.getDoctors({
                    hospital_id: parseInt(effectiveHospitalId),
                    view: 'list'
                });
                // 根据APIFox文档，医生列表在response.data.results中
                setDoctors(response.data?.results || []);
            } catch (err) {
                // API调用失败时回退到mock数据
                setDoctorsError('获取医生列表失败，已使用本地数据');
                console.error('获取医生列表失败:', err);
                // 从mock数据中筛选当前医院的医生
                const mockDoctors = MOCK_DOCTORS.filter(d => d.hospital_id === parseInt(effectiveHospitalId));
                setDoctors(mockDoctors);
            } finally {
                setDoctorsLoading(false);
            }
        };

        fetchDoctors();
    }, [effectiveHospitalId]);

    const navigate = useNavigate();

    // 选择的医生及详情加载状态（必须放在任何 return 之前，避免 hooks 顺序变化）
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [doctorDetailLoading, setDoctorDetailLoading] = useState(false);
    const [doctorDetailError, setDoctorDetailError] = useState(null);

    // 按评分排序的医生排行榜
    const sortedDoctors = [...doctors].sort((a, b) => b.score - a.score);

    // 当医生数据加载完成后设置默认选中医生
    useEffect(() => {
        if (doctors.length > 0) {
            setSelectedDoctor(doctors[0]);
        }
    }, [doctors]);

    // 获取医生详情
    const fetchDoctorDetail = async (doctorId) => {
        if (!doctorId) return;

        setDoctorDetailLoading(true);
        setDoctorDetailError(null);
        try {
            // 调用真实API获取医生详情
            const response = await doctorsApi.getDoctorDetail(parseInt(doctorId));
            // 根据APIFox文档，医生详情在response.data中
            const doctorDetail = response.data;

            // 更新选中的医生信息，合并详情数据
            setSelectedDoctor(prev => ({
                ...prev,
                ...doctorDetail
            }));
        } catch (err) {
            // API调用失败时保持现有数据
            setDoctorDetailError('获取医生详情失败');
            console.error('获取医生详情失败:', err);
        } finally {
            setDoctorDetailLoading(false);
        }
    };

    // 点击医生时获取医生详情
    const handleDoctorClick = (doctor) => {
        setSelectedDoctor(doctor);
        fetchDoctorDetail(doctor.id);
    };

    if (!effectiveHospitalId) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold mb-4">缺少医院ID，请从医院列表重新进入</h2>
                <button
                    onClick={() => navigateTo('hospitals')}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                    返回医院列表
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-slate-600">加载中...</p>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold mb-4">未找到该医院</h2>
                <button
                    onClick={() => navigateTo('hospitals')}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                    返回医院列表
                </button>
            </div>
        );
    }
    return (
        <div className="space-y-8">
            {/* 顶部返回按钮 */}
            <button
                onClick={() => navigateTo('hospitals')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft size={20} />
                返回医院列表
            </button>

            {/* 医院介绍区域 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <img
                        src={hospitalImage || '/images/default-hospital.jpg'}
                        alt={hospitalName}
                        className="w-full md:w-1/3 h-64 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                            // 避免图片地址为空/404 导致整块空白
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/default-hospital.jpg';
                        }}
                    />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-4 text-cyan-700">{hospitalName}</h1>
                        <div className="space-y-3 mb-6">
                            <p className="flex items-center gap-2"><span className="text-slate-600">医院电话:</span> <span className="font-medium">{hospital.phone}</span></p>
                            <p className="flex items-center gap-2"><span className="text-slate-600">地址:</span> <span className="font-medium">{hospital.address}</span></p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg text-slate-600 leading-relaxed">
                            {hospitalDesc || '暂无医院介绍'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 医生列表 */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-slate-800">医院医生</h2>

                {/* 医生加载状态 */}
                {doctorsLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">加载医生列表中...</p>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-slate-600 mb-4">暂无医生信息</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(doctor => (
                            <div key={doctor.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                                <div className="p-5">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img
                                            src={doctor.avatar}
                                            alt={doctor.name}
                                            className="w-20 h-20 rounded-full object-cover border-2 border-cyan-200"
                                        />
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{doctor.name}</h3>
                                            <p className="text-sm text-cyan-600 font-medium">{doctor.title}</p>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={i < Math.floor(doctor.score) ? "fill-yellow-500" : ""}
                                                    />
                                                ))}
                                            </div>
                                            <span className="font-bold text-slate-700">{doctor.score}</span>
                                        </div>
                                    </div>
                                    <div className="mb-5">
                                        <h4 className="text-sm font-medium text-slate-700 mb-2">擅长领域:</h4>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{doctor.specialty}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/doctors/${doctor.id}`); }}
                                        >
                                            预约挂号
                                        </button>
                                        <button
                                            className="flex-1 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg text-sm font-medium hover:from-slate-700 hover:to-slate-800 transition-all shadow-md hover:shadow-lg"
                                            onClick={() => startConsultation && startConsultation(doctor)}
                                        >
                                            在线咨询
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 医生评论和排行榜区域 */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* 左侧：医生评论 */}
                <div className="lg:w-2/3">
                    <h2 className="text-xl font-bold mb-6 text-slate-800">医生评论</h2>

                    {/* 医生选择器 */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {doctors.map(doctor => (
                            <button
                                key={doctor.id}
                                onClick={() => handleDoctorClick(doctor)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedDoctor?.id === doctor.id
                                    ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-300'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                            >
                                {doctor.name}
                            </button>
                        ))}
                    </div>

                    {/* 评论列表 */}
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
                        {selectedDoctor ? (
                            doctorDetailLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                                    <p className="text-slate-600">加载医生详情中...</p>
                                </div>
                            ) : doctorDetailError ? (
                                <div className="text-center py-8">
                                    <p className="text-red-500 mb-2">{doctorDetailError}</p>
                                    <p className="text-slate-600">将显示基本医生信息</p>
                                </div>
                            ) : selectedDoctor.reviewsData?.length > 0 ? (
                                selectedDoctor.reviewsData.map(review => (
                                    <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-700">{review.patient}</span>
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} className={i < review.rating ? "fill-yellow-500" : ""} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-slate-500">
                                                <Clock size={12} />
                                                <span>{review.date}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">{review.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500">暂无该医生的评论</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500">请选择一位医生查看评论</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右侧：医生排行榜 */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                        <h2 className="text-xl font-bold mb-5 text-slate-800">医生排行榜</h2>
                        {sortedDoctors.length > 0 ? (
                            <div className="space-y-4">
                                {sortedDoctors.map((doctor, index) => (
                                    <div
                                        key={doctor.id}
                                        className={`flex items-center p-3 rounded-lg transition-all ${selectedDoctor?.id === doctor.id ? 'bg-cyan-50 border-l-4 border-cyan-400' : 'hover:bg-slate-50 cursor-pointer'}`}
                                        onClick={() => handleDoctorClick(doctor)}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-cyan-100 text-cyan-800'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-700">{doctor.name}</div>
                                            <div className="text-xs text-slate-500">{doctor.title}</div>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star size={14} className="fill-yellow-500" />
                                            <span className="text-sm font-medium">{doctor.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500">暂无医生排行信息</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDetailPage;