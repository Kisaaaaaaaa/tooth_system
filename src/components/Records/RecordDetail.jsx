import React, { useEffect, useState } from 'react';
import recordsApi from '../../api/records';
import { Star } from 'lucide-react';

const StarsInput = ({ value = 0, onChange }) => {
    const [v, setV] = useState(value);
    useEffect(() => setV(value), [value]);
    return (
        <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => { setV(n); onChange && onChange(n); }} className={`p-1 ${n<=v? 'text-amber-400': 'text-slate-300'}`}>
                    <Star size={18} />
                </button>
            ))}
        </div>
    );
};

const RecordDetail = ({ id, onClose, onRated }) => {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true); setError(null);
            try {
                const data = await recordsApi.getRecord(id);
                setRecord(data);
            } catch (e) { setError(e); }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await recordsApi.rateRecord(id, { rating, comment });
            if (onRated) onRated();
            // refresh detail
            const data = await recordsApi.getRecord(id);
            setRecord(data);
        } catch (e) {
            alert('提交失败: ' + (e.message || e.status || ''));
        } finally { setSubmitting(false); }
    };

    if (!id) return null;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold">就诊详情</h3>
                <div className="text-sm text-slate-500">{record ? (record.date || record.created_at) : ''}</div>
            </div>

            {loading && <div className="text-sm text-slate-500">加载中...</div>}
            {error && <div className="text-sm text-red-500">加载失败: {String(error)}</div>}

            {record && (
                <div className="mt-4 space-y-3">
                    <div className="text-sm text-slate-600">主治医生: {record.doctor_name || record.doctor || '-'}</div>
                    <div className="text-sm text-slate-600">诊断: <strong className="text-slate-800">{record.diagnosis || '-'}</strong></div>
                    <div className="text-sm text-slate-600">处置: <div className="mt-2 text-slate-700">{record.content || record.summary || '-'}</div></div>

                    <div className="pt-3 border-t border-slate-100">
                        <div className="text-sm text-slate-500 mb-2">评价</div>
                        {record.rated ? (
                            <div className="flex items-center gap-2">
                                <div className="flex text-amber-400 gap-1">{[...Array(record.rating||0)].map((_,i)=>(<Star key={i} size={16} fill="currentColor"/>))}</div>
                                <div className="text-sm text-slate-600">{record.comment}</div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <StarsInput value={rating} onChange={setRating} />
                                <textarea value={comment} onChange={e=>setComment(e.target.value)} className="w-full border rounded p-2 text-sm" rows={3} placeholder="写下你的评价（可选）" />
                                <div className="flex gap-2">
                                    <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-cyan-600 text-white rounded">提交评价</button>
                                    <button onClick={onClose} className="px-4 py-2 border rounded">取消</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecordDetail;
