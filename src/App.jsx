import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import HomePage from './components/pages/HomePage';
import HospitalsPage from './components/pages/HospitalsPage';
import DoctorsPage from './components/pages/DoctorsPage';
import ConsultationPage from './components/pages/ConsultationPage';
import AppointmentsPage from './components/pages/AppointmentsPage';
import RecordsPage from './components/pages/RecordsPage';
import './styles/global.css';

// --- 主应用组件 ---
const DentalApp = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // Router Logic
    const navigateTo = (page, params = {}) => {
        setCurrentPage(page);
        window.scrollTo({top: 0, behavior: 'smooth'});
    };

    const startConsultation = (doctor) => {
        setSelectedDoctor(doctor);
        navigateTo('consultation');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
            {/* 顶部导航 */}
            <Navbar currentPage={currentPage} navigateTo={navigateTo} />

            {/* 内容区域 */}
            <main className="max-w-3xl mx-auto p-4 md:p-6">
                {currentPage !== 'home' && (
                    <button onClick={() => navigateTo('home')} className="mb-4 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm">
                        <ArrowLeft size={16} /> 返回首页
                    </button>
                )}

                {currentPage === 'home' && <HomePage navigateTo={navigateTo} />}
                {currentPage === 'hospitals' && <HospitalsPage />}
                {currentPage === 'doctors' && <DoctorsPage navigateTo={navigateTo} startConsultation={startConsultation} />}
                {currentPage === 'consultation' && <ConsultationPage currentDoctor={selectedDoctor} />}
                {currentPage === 'appointment' && <AppointmentsPage />}
                {currentPage === 'records' && <RecordsPage />}
            </main>

            {/* 移动端底部导航 */}
            <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
        </div>
    );
};

export default DentalApp;

