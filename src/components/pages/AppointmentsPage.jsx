import React, { useState } from 'react';
import { Calendar, Clock, Navigation } from 'lucide-react';
import { MOCK_APPOINTMENTS, MOCK_DOCTORS } from '../../data/mockData';

// 预约管理页面
const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

    const handleCheckIn = (id) => {
        // Logic: check time validation would go here.
        // For demo, we just toggle status.
        const now = new Date();
        // Assuming valid window.
        alert("签到成功！请在候诊区等待叫号。");
        setAppointments(prev => prev.map(apt => apt.id === id ? {...apt, status: 'checked-in'} : apt));
    };

    const cancelAppointment = (id) => {
        if (confirm("确定要取消此预约吗？")) {
            setAppointments(prev => prev.map(apt => apt.id === id ? {...apt, status: 'cancelled'} : apt));
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800">我的预约</h2>

            <div className="space-y-4">
                {appointments.map(apt => (
                    <div key={apt.id} className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-cyan-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                    ${apt.status === 'upcoming' ? 'bg-cyan-100 text-cyan-700' :
                                    apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    apt.status === 'checked-in' ? 'bg-purple-100 text-purple-700' :
                                    'bg-slate-100 text-slate-500'}`}>
                                    {apt.status === 'upcoming' ? '待就诊' : apt.status === 'completed' ? '已完成' : apt.status === 'checked-in' ? '已签到' : '已取消'}
                                </span>
                                <span className="text-sm text-slate-400">{apt.hospital}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Calendar size={18} className="text-slate-400" /> {apt.date} <Clock size={18} className="text-slate-400 ml-2" /> {apt.time}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">主治医师：{MOCK_DOCTORS.find(d => d.id === apt.doctorId)?.name}</p>
                        </div>

                        {apt.status === 'upcoming' && (
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => cancelAppointment(apt.id)}
                                    className="flex-1 md:flex-none px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => handleCheckIn(apt.id)}
                                    className="flex-1 md:flex-none px-6 py-2 bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-md shadow-cyan-200 hover:bg-cyan-600 transition flex items-center justify-center gap-1"
                                >
                                    <Navigation size={14} /> 我已到达
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppointmentsPage;

