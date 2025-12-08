import React, { useEffect, useState } from 'react';
import recordsApi from '../../api/records';
import { FileText, Star } from 'lucide-react';

const RecordsList = ({ onSelect }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [patientName, setPatientName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchList = async () => {
        setLoading(true); setError(null);
        try {
            const params = { page, page_size: pageSize };
            if (patientName) params.patient_name = patientName;
            if (doctorName) params.doctor_name = doctorName;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const data = await recordsApi.listRecords(params);
            // assume backend returns { results: [...], total, page, page_size }
            if (Array.isArray(data)) setRecords(data);
            else if (data.results) setRecords(data.results);
            else setRecords([]);
        } catch (e) {
            setError(e);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchList(); }, [page, pageSize]);

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3">
                <input className="border rounded px-3 py-2 text-sm flex-1" placeholder="病人姓名" value={patientName} onChange={e=>setPatientName(e.target.value)} />
                <input className="border rounded px-3 py-2 text-sm flex-1" placeholder="医生姓名" value={doctorName} onChange={e=>setDoctorName(e.target.value)} />
                <input type="date" className="border rounded px-3 py-2 text-sm" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
                <input type="date" className="border rounded px-3 py-2 text-sm" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
                <button onClick={() => { setPage(1); fetchList(); }} className="px-4 py-2 bg-cyan-600 text-white rounded">筛选</button>
            </div>

            {loading && <div className="text-sm text-slate-500">加载中...</div>}
            {error && <div className="text-sm text-red-500">加载失败: {error.message || String(error)}</div>}

            <div className="space-y-4">
                {records.map(rec => (
                    <div key={rec.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer" onClick={() => onSelect(rec.id)}>
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText className="text-cyan-500" size={20} />
                                <span className="font-bold text-slate-700">{rec.date || rec.created_at || ''}</span>
                            </div>
                            <span className="text-sm text-slate-500">{rec.doctor_name || rec.doctor || ''} 医生</span>
                        </div>

                        <div className="p-5">
                            <h3 className="font-bold text-lg text-slate-800 mb-2">诊断：{rec.diagnosis || rec.title || '-'}</h3>
                            <p className="text-slate-600 text-sm mb-4 leading-relaxed">{rec.summary || rec.content || ''}</p>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                                <span className="text-sm text-slate-500">就诊评价</span>
                                {rec.rated ? (
                                    <div className="flex text-amber-400 gap-1">
                                        {[...Array(rec.rating || 0)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                    </div>
                                ) : (
                                    <span className="text-sm text-cyan-600 font-medium">未评价</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500">共 {records.length} 条（后端支持 total 时这里可改进）</div>
                <div className="flex items-center gap-2">
                    <button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border rounded">上一页</button>
                    <span className="text-sm">第 {page} 页</span>
                    <button onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded">下一页</button>
                </div>
            </div>
        </div>
    );
};

export default RecordsList;
