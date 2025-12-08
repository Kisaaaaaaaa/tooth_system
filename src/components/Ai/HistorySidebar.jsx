import React from 'react';

const HistorySidebar = ({ history = [], onSelect, onDelete, onClear }) => {
    return (
        <div className="hidden md:block fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 overflow-auto">
            <div className="pt-4 pb-2 px-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">🦷</div>
                    <div className="text-sm font-medium text-slate-700">AI 问询</div>
                </div>
            </div>
            <div className="px-3">
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
                                    <button onClick={() => onDelete(item.id)} className="text-xs text-red-500 ml-2">删除</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {history.length > 0 && (
                    <div className="mt-3 px-3 pb-4">
                        <button onClick={onClear} className="w-full text-xs bg-red-50 text-red-600 border border-red-100 rounded px-2 py-1">清空历史</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorySidebar;