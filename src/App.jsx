import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import HomePage from './components/pages/HomePage';
import HospitalsPage from './components/pages/HospitalsPage';
import HospitalDetailPage from './components/pages/HospitalDetailPage';
import DoctorsPage from './components/pages/DoctorsPage';
import ConsultationPage from './components/pages/ConsultationPage';
import AppointmentsPage from './components/pages/AppointmentsPage';
import RecordsPage from './components/pages/RecordsPage';
import AiInquiryPage from './components/pages/AiInquiryPage';
import ThreeDModelPage from './components/pages/ThreeDModelPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './styles/global.css';

// --- 主应用组件 ---
const DentalApp = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);

    // Router Logic
    const navigateTo = (page, params = {}) => {
        setCurrentPage(page);
        if (params.hospitalId) {
            setSelectedHospitalId(params.hospitalId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startConsultation = (doctor) => {
        setSelectedDoctor(doctor);
        navigateTo('consultation');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
            {/* 顶部导航 */}
            <Navbar currentPage={currentPage} navigateTo={navigateTo} />

            {/* 内容区域：首页和3D模型页面采用全宽展示，其他页面使用居中容器 */}
            {currentPage === 'home' ? (
                <div className="w-full px-0 md:px-0">
                    <HomePage navigateTo={navigateTo} />
                </div>
            ) : currentPage === 'model3d' ? (
                <div className="w-full px-0 md:px-0">
                    <ThreeDModelPage navigateTo={navigateTo} />
                </div>
            ) : currentPage === 'login' ? (
                <main className="max-w-7xl mx-auto p-4 md:p-6">
                    <Login navigateTo={navigateTo} />
                </main>
            ) : currentPage === 'register' ? (
                <main className="max-w-7xl mx-auto p-4 md:p-6">
                    <Register navigateTo={navigateTo} />
                </main>
            ) : (
                <main className="max-w-7xl mx-auto p-4 md:p-6">
                    {currentPage === 'hospitals' && <HospitalsPage navigateTo={navigateTo} />}
                    {currentPage === 'hospitalDetail' && <HospitalDetailPage navigateTo={navigateTo} hospitalId={selectedHospitalId} />}
                    {currentPage === 'doctors' && <DoctorsPage navigateTo={navigateTo} startConsultation={startConsultation} />}
                    {currentPage === 'consultation' && <ConsultationPage currentDoctor={selectedDoctor} />}
                    {currentPage === 'appointment' && <AppointmentsPage />}
                    {currentPage === 'records' && <RecordsPage />}
                    {currentPage === 'aiInquiry' && <AiInquiryPage />}
                </main>
            )}

            {/* 移动端底部导航 */}
            <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
        </div>
    );
};

export default DentalApp;

