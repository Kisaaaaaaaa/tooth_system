import React from 'react';

const HistorySidebar = ({
    history = [],
    onSelect,
    // 顶部动作
    onNewChat,
    onOpenSearch,
}) => {
    return (
        <div className="hidden md:block fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 overflow-auto">
            <div className="pt-4 pb-2 px-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">🦷</div>
                    <div className="text-sm font-medium text-slate-700">AI 问询</div>
                </div>
            </div>
            <div className="px-3">
                {/* 顶部动作 */}
                <div className="px-2 pb-2 space-y-2">
                    <button
                        type="button"
                        onClick={() => onNewChat && onNewChat()}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                        <span className="text-lg">✏️</span>
                        <span className="text-sm font-medium">新聊天</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenSearch && onOpenSearch()}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                        <span className="text-lg">🔎</span>
                        <span className="text-sm font-medium">搜索聊天</span>
                    </button>
                </div>

                <div className="py-2 px-2 text-sm font-medium text-slate-700">历史会话</div>
                <div className="space-y-2 overflow-auto max-h-[60vh] px-2">
                    {history.length === 0 && (
                        <div className="text-xs text-slate-400">暂无记录</div>
                    )}

                    {history.map(item => {
                        const preview = item.preview ||
                            (item.messages && item.messages.find(m => m.role === 'user')
                                ? item.messages.find(m => m.role === 'user').text
                                : (item.question || (item.files ? `上传 ${item.files} 个文件` : '(无内容)')));
                        return (
                            <div key={item.id} className="bg-white rounded-md p-2 shadow-sm hover:shadow-md">
                                <div className="flex items-start justify-between gap-2">
                                    <button type="button" onClick={() => onSelect(item)} className="text-left flex-1 text-sm text-slate-700">
                                        <div className="truncate font-medium">{preview}</div>
                                        <div className="text-xs text-slate-400 mt-1">{new Date(item.ts).toLocaleString()}</div>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HistorySidebar;