import React, { useState } from 'react';
import { ArrowLeft, Star, Clock } from 'lucide-react';
import { MOCK_HOSPITALS } from '../../data/mockData';

const HospitalDetailPage = ({ navigateTo, hospitalId }) => {
    // 根据hospitalId获取医院详情
    const hospital = MOCK_HOSPITALS.find(h => h.id === parseInt(hospitalId));

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

    // 按评分排序的医生排行榜
    const sortedDoctors = [...hospital.doctors].sort((a, b) => b.score - a.score);

    // 选择第一个医生作为默认显示评论的医生
    const [selectedDoctor, setSelectedDoctor] = useState(hospital.doctors[0]);

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
                        src={hospital.image}
                        alt={hospital.name}
                        className="w-full md:w-1/3 h-64 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-4 text-cyan-700">{hospital.name}</h1>
                        <div className="space-y-3 mb-6">
                            <p className="flex items-center gap-2"><span className="text-slate-600">医院电话:</span> <span className="font-medium">{hospital.phone}</span></p>
                            <p className="flex items-center gap-2"><span className="text-slate-600">地址:</span> <span className="font-medium">{hospital.address}</span></p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg text-slate-600 leading-relaxed">
                            {hospital.introduction}
                        </div>
                    </div>
                </div>
            </div>

            {/* 医生列表 */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-slate-800">医院医生</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hospital.doctors.map(doctor => (
                        <div key={doctor.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
                                        <span className="text-sm text-slate-500">({doctor.reviews}条评价)</span>
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">擅长领域:</h4>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{doctor.specialty}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                                    >
                                        预约挂号
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg text-sm font-medium hover:from-slate-700 hover:to-slate-800 transition-all shadow-md hover:shadow-lg"
                                    >
                                        在线咨询
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 医生评论和排行榜区域 */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* 左侧：医生评论 */}
                <div className="lg:w-2/3">
                    <h2 className="text-xl font-bold mb-6 text-slate-800">医生评论</h2>

                    {/* 医生选择器 */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {hospital.doctors.map(doctor => (
                            <button
                                key={doctor.id}
                                onClick={() => setSelectedDoctor(doctor)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedDoctor.id === doctor.id
                                    ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-300'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                            >
                                {doctor.name}
                            </button>
                        ))}
                    </div>

                    {/* 评论列表 */}
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
                        {selectedDoctor.reviewsData?.map(review => (
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
                        ))}
                    </div>
                </div>

                {/* 右侧：医生排行榜 */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                        <h2 className="text-xl font-bold mb-5 text-slate-800">医生排行榜</h2>
                        <div className="space-y-4">
                            {sortedDoctors.map((doctor, index) => (
                                <div
                                    key={doctor.id}
                                    className={`flex items-center p-3 rounded-lg transition-all ${selectedDoctor.id === doctor.id ? 'bg-cyan-50 border-l-4 border-cyan-400' : 'hover:bg-slate-50'}`}
                                    onClick={() => setSelectedDoctor(doctor)}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDetailPage;