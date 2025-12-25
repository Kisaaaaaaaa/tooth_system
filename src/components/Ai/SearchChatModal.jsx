import React, { useEffect, useMemo, useState } from 'react';

/**
 * 搜索聊天记录弹窗
 * - 输入 keyword（支持模糊）
 * - 展示命中消息列表（逐条消息）
 * - 点击某条消息触发 onSelectMessage(messageId)
 */
const SearchChatModal = ({
    open,
    onClose,
    onSearch,
    onSelectMessage,
    initialKeyword = '',
}) => {
    const [keyword, setKeyword] = useState(initialKeyword || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!open) return;
        setKeyword(initialKeyword || '');
        setResults([]);
        setError(null);
    }, [open, initialKeyword]);

    const trimmed = useMemo(() => (keyword || '').trim(), [keyword]);

    useEffect(() => {
        if (!open) return;
        if (!trimmed) {
            setResults([]);
            setError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const t = setTimeout(async () => {
            try {
                const data = await onSearch?.(trimmed);
                const list = Array.isArray(data?.results) ? data.results : [];
                if (!cancelled) setResults(list);
            } catch (e) {
                if (!cancelled) {
                    setError(e);
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [open, trimmed, onSearch]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <div className="text-sm font-semibold text-slate-800">搜索聊天</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        关闭
                    </button>
                </div>

                <div className="p-4">
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="输入关键词（支持模糊匹配）"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        autoFocus
                    />

                    <div className="mt-3 text-xs text-slate-500">
                        {loading ? '搜索中...' : trimmed ? `关键词：${trimmed}` : '请输入关键词进行搜索'}
                    </div>
                    {error && <div className="mt-2 text-xs text-red-500">{error?.message || '搜索失败'}</div>}

                    <div className="mt-4 max-h-[55vh] overflow-auto space-y-2">
                        {!loading && !error && trimmed && results.length === 0 && (
                            <div className="text-sm text-slate-500 py-6 text-center">没有找到相关消息</div>
                        )}

                        {results.map((m) => (
                            <button
                                key={m?.id}
                                type="button"
                                onClick={() => {
                                    if (m?.id) onSelectMessage?.(m.id);
                                }}
                                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-cyan-200 hover:shadow-sm transition bg-white"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-medium text-slate-700">
                                        {m?.role === 'assistant' ? 'AI' : '用户'}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{m?.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-800 line-clamp-2">{m?.content || ''}</div>
                                <div className="mt-2 text-[11px] text-slate-400">点击跳转到该消息</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchChatModal;
