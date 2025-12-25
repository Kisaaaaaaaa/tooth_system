import React, { useEffect, useState } from 'react';
import recordsApi from '../../api/records';
import { FileText, Star } from 'lucide-react';

const RecordsList = ({ onSelect, onRefresh }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [doctorName, setDoctorName] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchList = async () => {
        setLoading(true); setError(null);
        try {
            const params = { page, page_size: pageSize };
            if (doctorName) params.doctor_name = doctorName;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const data = await recordsApi.listRecords(params);
            if (Array.isArray(data)) {
                setRecords(data);
                setTotal(data.length);
            } else if (data?.results) {
                setRecords(data.results);
                setTotal(typeof data.count === 'number' ? data.count : data.results.length);
                if (typeof data.page === 'number') setPage(data.page);
                if (typeof data.page_size === 'number') setPageSize(data.page_size);
            } else {
                setRecords([]);
                setTotal(0);
            }
        } catch (e) {
            setError(e);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchList(); }, [page, pageSize]);

    return (
        <div className="max-w-5xl mx-auto px-4 space-y-5">

            {/* 筛选区 */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap gap-4 items-end justify-between">
                    <input
                        className="border rounded-md px-3 py-2 text-sm w-56"
                        placeholder="医生姓名（可选）"
                        value={doctorName}
                        onChange={e => setDoctorName(e.target.value)}
                    />

                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">时间：</span>
                        <input
                            type="date"
                            className="border rounded px-2 py-1"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                        <span className="text-slate-400">至</span>
                        <input
                            type="date"
                            className="border rounded px-2 py-1"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                        />
                        <button
                            onClick={() => {
                                setPage(1);
                                fetchList();
                                onRefresh?.();
                            }}
                            className="ml-3 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition"
                        >
                            筛选
                        </button>
                    </div>
                </div>
            </div>

            {/* 状态提示 */}
            {loading && (
                <div className="text-center text-sm text-slate-500 py-6">
                    正在加载病例记录…
                </div>
            )}

            {error && (
                <div className="text-center text-sm text-red-500 py-4 bg-red-50 rounded-lg">
                    加载失败：{error.message || String(error)}
                </div>
            )}

            {/* 病例列表 */}
            <div className="space-y-4">
                {records.map(rec => (
                    <div
                        key={rec.id}
                        onClick={() => onSelect(rec.id)}
                        className="group bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-cyan-300 hover:shadow-sm transition"
                    >
                        {/* 头部 */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-t-xl">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FileText size={16} className="text-cyan-600" />
                                {rec.date || rec.created_at || '未知时间'}
                            </div>
                            <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600">
                                主治医师：{rec.doctor_name || rec.doctor || '未知医生'}
                            </span>
                        </div>

                        {/* 内容 */}
                        <div className="px-4 py-4 space-y-3">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">诊断结果</div>
                                <div className="font-semibold text-slate-800">
                                    {rec.diagnosis || rec.title || '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 mb-1">病例描述</div>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {rec.summary || rec.content || '暂无详细描述'}
                                </p>
                            </div>

                            {/* 底部 */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <span className="text-xs text-slate-500">评价</span>
                                {rec.rated ? (
                                    <div className="flex items-center gap-1 text-amber-400">
                                        {[...Array(rec.rating || 0)].map((_, i) => (
                                            <Star key={i} size={14} fill="currentColor" />
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">
                                        未评价
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 分页 */}
            <div className="flex flex-col items-center gap-2 py-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                    共 {total} 条 · 第 {page} 页
                </div>
                <div className="flex gap-3">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 border rounded text-sm disabled:opacity-40"
                    >
                        上一页
                    </button>
                    <button
                        disabled={total > 0 && page * pageSize >= total}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 border rounded text-sm disabled:opacity-40"
                    >
                        下一页
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordsList;
