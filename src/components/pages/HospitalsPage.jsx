import React, { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { MOCK_HOSPITALS } from '../../data/mockData';

// 医院概况页面
const HospitalsPage = () => {
    const [filter, setFilter] = useState('all'); // all, near, frequent

    const filteredHospitals = MOCK_HOSPITALS.filter(h => {
        if (filter === 'near') return h.tags.includes('最近') || h.distance < 2;
        if (filter === 'frequent') return h.tags.includes('常去');
        return true;
    });

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'near', 'frequent'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            filter === f ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {f === 'all' ? '全部医院' : f === 'near' ? '距离最近' : '我常去的'}
                    </button>
                ))}
            </div>

            <div className="grid gap-4">
                {filteredHospitals.map(hospital => (
                    <div key={hospital.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row group hover:shadow-md transition">
                        <div className="h-32 md:h-auto md:w-32 bg-slate-200 relative">
                            <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                                {hospital.distance}km
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{hospital.name}</h3>
                                <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                                    <MapPin size={14} /> {hospital.address}
                                </p>
                                <div className="flex gap-2 mt-2">
                                    {hospital.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded border border-cyan-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button className="mt-3 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg flex items-center justify-center gap-1 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition">
                                查看详情 <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HospitalsPage;

