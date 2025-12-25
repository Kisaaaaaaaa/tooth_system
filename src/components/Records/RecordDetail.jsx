import React, { useEffect, useState } from 'react';
import recordsApi from '../../api/records';
import { Star, ExternalLink, ChevronLeft, Download } from 'lucide-react'; // 引入返回箭头图标

const StarsInput = ({ value = 0, onChange }) => {
    const [v, setV] = useState(value);
    const [hoverV, setHoverV] = useState(0);
    useEffect(() => setV(value), [value]);

    const activeValue = hoverV || v;

    return (
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="评分（1-5星）">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverV(n)}
                    onMouseLeave={() => setHoverV(0)}
                    onFocus={() => setHoverV(n)}
                    onBlur={() => setHoverV(0)}
                    onClick={() => {
                        setV(n);
                        onChange && onChange(n);
                    }}
                    className="p-1.5 rounded-md hover:bg-sky-50 transition-colors"
                    role="radio"
                    aria-checked={n === v}
                    aria-label={`${n} 星`}
                >
                    <Star
                        size={20}
                        className={n <= activeValue ? 'text-amber-500' : 'text-slate-200'}
                        fill={n <= activeValue ? 'currentColor' : 'none'}
                    />
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
    const [imageError, setImageError] = useState(false);

    const formatDateForFilename = (raw) => {
        if (!raw) return '';
        try {
            const d = new Date(raw);
            if (!Number.isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}${m}${day}`;
            }
        } catch {
            // ignore
        }
        // 兜底：提取类似 2025-12-25 的日期
        const m = String(raw).match(/(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[1]}${m[2]}${m[3]}`;
        return '';
    };

    const handleDownloadRecord = () => {
        if (!record) return;

        const lines = [];
        lines.push('牙科就诊病例');
        lines.push('================');
        lines.push(`病例ID：${record.id ?? id ?? ''}`);
        lines.push(`主治医生：${record.doctor_name || record.doctor || '-'}`);
        lines.push(`就诊时间：${record.date || record.created_at || '未知时间'}`);
        lines.push('');
        lines.push(`诊断：${record.diagnosis || '-'}`);
        lines.push('');
        lines.push('处置/记录：');
        lines.push(String(record.content || record.summary || '-'));

        if (record.treatment) {
            lines.push('');
            lines.push(`治疗方案：${record.treatment}`);
        }

        if (Array.isArray(record.medications) && record.medications.length > 0) {
            lines.push('');
            lines.push(`药物：${record.medications.join('、')}`);
        }

        if (record.result_image) {
            lines.push('');
            lines.push(`结果图片链接：${record.result_image}`);
        }

        if (record.rated) {
            lines.push('');
            lines.push('评价：');
            lines.push(`评分：${record.rating ?? ''}`);
            lines.push(`评价内容：${record.comment || '无'}`);
        }

        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const dateKey = formatDateForFilename(record.date || record.created_at);
        const safeId = record.id ?? id ?? 'record';
        const filename = `病例_${safeId}${dateKey ? `_${dateKey}` : ''}.txt`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // 释放 blob url
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await recordsApi.getRecord(id);
                setRecord(data);
                setImageError(false);
                if (data.rated) {
                    setRating(data.rating || 5);
                    setComment(data.comment || '');
                }
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSubmit = async () => {
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            alert('评分必须在 1-5 之间');
            return;
        }
        if (!id) return;
        setSubmitting(true);
        try {
            await recordsApi.rateRecord(id, { rating, comment });
            if (onRated) onRated();
            const data = await recordsApi.getRecord(id);
            setRecord(data);
        } catch (e) {
            alert('提交失败: ' + (e?.message || e?.status || '未知错误'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!id) return null;

    return (
        <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-6 max-w-2xl mx-auto">
            {/* 标题栏：左上角返回按钮 + 标题，右上角无文字 */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-sky-100 bg-sky-50 rounded-t-lg p-3">
                <div className="flex items-center gap-2">
                    {/* 左上角返回按钮（优化样式） */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-sky-100 transition-colors text-sky-700"
                        aria-label="返回"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    {/* 标题：移除多余文字，仅保留就诊详情 */}
                    <h3 className="text-xl font-semibold text-sky-800">就诊详情</h3>
                </div>
                {/* 右上角：下载病例 */}
                <button
                    type="button"
                    onClick={handleDownloadRecord}
                    disabled={!record || loading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="下载病例"
                    title={!record ? '病例未加载完成' : '下载病例'}
                >
                    <Download size={16} />
                    下载病例
                </button>
            </div>

            {/* 加载/错误提示：浅蓝色加载样式，保留红色错误警示 */}
            {loading && (
                <div className="bg-sky-50 rounded-lg p-3 text-sm text-sky-600 flex items-center justify-center border border-sky-100">
                    加载中...
                </div>
            )}
            {error && (
                <div className="bg-red-50 rounded-lg p-3 text-sm text-red-600 border border-red-100">
                    加载失败: {error?.message || String(error)}
                </div>
            )}

            {/* 核心内容 */}
            {!loading && (
                <div className="space-y-6">
                    {/* 记录详情内容 */}
                    {record && (
                        <div className="space-y-4">
                            {/* 基础信息：浅蓝色标签点缀 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-24 text-sm text-sky-600">主治医生：</span>
                                    <span className="text-sm text-slate-700">{record.doctor_name || record.doctor || '-'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="w-24 text-sm text-sky-600 pt-0.5">诊断：</span>
                                    <span className="text-sm font-medium text-sky-900">{record.diagnosis || '-'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="w-24 text-sm text-sky-600 pt-0.5">处置：</span>
                                    <div className="text-sm text-slate-700">{record.content || record.summary || '-'}</div>
                                </div>
                                {/* 就诊时间 */}
                                <div className="flex items-center gap-2">
                                    <span className="w-24 text-sm text-sky-600">就诊时间：</span>
                                    <span className="text-sm text-slate-700">{record.date || record.created_at || '未知时间'}</span>
                                </div>
                            </div>

                            {/* 治疗/药物/图片信息：浅蓝色统一风格 */}
                            {(record.treatment || record.medications || record.result_image) && (
                                <div className="pt-4 border-t border-sky-100 space-y-3">
                                    {record.treatment && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-24 text-sm text-sky-600">治疗方案：</span>
                                            <span className="text-sm text-slate-700">{record.treatment}</span>
                                        </div>
                                    )}
                                    {Array.isArray(record.medications) && record.medications.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-24 text-sm text-sky-600">药物：</span>
                                            <span className="text-sm text-slate-700">{record.medications.join('、')}</span>
                                        </div>
                                    )}
                                    {record.result_image && (
                                        <div className="text-sm text-slate-600 space-y-2">
                                            <span className="block mb-2 text-sky-600">结果图片：</span>
                                            {!imageError ? (
                                                // 图片容器：浅蓝色风格优化
                                                <div className="relative w-full">
                                                    <a
                                                        href={record.result_image}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="w-full rounded-xl border border-sky-200 bg-sky-50 p-3 shadow-sm hover:shadow-sky-100 hover:shadow-md transition-all duration-300 overflow-hidden">
                                                            <img
                                                                src={record.result_image}
                                                                alt="就诊结果图片"
                                                                className="w-full object-contain rounded-lg transition-transform duration-300 hover:scale-[1.005]"
                                                                loading="lazy"
                                                                onError={() => setImageError(true)}
                                                            />
                                                        </div>
                                                    </a>
                                                    {/* 图标：浅蓝色点缀 */}
                                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-1.5 text-sky-600 shadow-sm opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
                                                        <ExternalLink size={16} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <a
                                                    className="flex items-center gap-2 justify-center p-4 bg-sky-50 rounded-xl border border-sky-200 text-sky-600 underline text-sm break-all hover:bg-sky-100 transition-colors"
                                                    href={record.result_image}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink size={16} />
                                                    <span>图片加载失败，点击打开原图链接</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 评价区域：浅蓝色风格统一，按钮居中 */}
                    <div className="pt-4 border-t border-sky-100">
                        <div className="text-sm font-medium text-sky-800 mb-3">评价</div>
                        {record?.rated ? (
                            <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg border border-sky-100">
                                <div className="flex text-amber-500 gap-1">
                                    {[...Array(record.rating || 0)].map((_, i) => (
                                        <Star key={i} size={18} fill="currentColor" />
                                    ))}
                                </div>
                                <div className="text-sm text-slate-600">{record.comment || '无评价内容'}</div>
                            </div>
                        ) : (
                            record && (
                                <div className="space-y-3">
                                    <StarsInput value={rating} onChange={setRating} />
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full border border-sky-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all bg-sky-50/50"
                                        rows={3}
                                        placeholder="写下你的评价（可选）"
                                    />
                                    {/* 按钮居中，样式优化 */}
                                    <div className="flex gap-3 justify-center">
                                        {/* 此处可保留下方关闭按钮，或根据需求移除（标题栏已新增返回按钮） */}
                                        <button
                                            onClick={onClose}
                                            disabled={submitting}
                                            className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            关闭
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="px-5 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-sky-200"
                                        >
                                            {submitting ? (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                                    提交中...
                                                </span>
                                            ) : (
                                                '提交评价'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecordDetail;