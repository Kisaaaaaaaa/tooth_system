import React, { useState, useRef } from 'react';
import aiApi from '../../api/ai';

const AiInquiryPage = () => {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', text, files}
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    const pushMessage = (msg) => setMessages(ms => [...ms, msg]);

    const sendQuestion = async ({ question, ctx = {}, attachFiles } = {}) => {
        setError(null);
        const q = (question || input || '').trim();
        if (!q && !(attachFiles && attachFiles.length)) {
            setError(new Error('请填写问题或上传病历文件以供分析')); return;
        }

        const userMsg = { role: 'user', text: q || (attachFiles && `上传了 ${attachFiles.length} 个文件，请分析`), files: attachFiles ? attachFiles.map(f=>({ name: f.name })) : undefined };
        pushMessage(userMsg);
        setInput('');
        setFiles([]);
        setLoading(true);

        try {
            const resp = await aiApi.inquiryWithFiles({ question: q || '请分析上传的病例', context: ctx, files: attachFiles });
            const assistantText = (typeof resp === 'string') ? resp : (resp.answer || resp.text || JSON.stringify(resp));
            pushMessage({ role: 'assistant', text: assistantText });
        } catch (e) {
            setError(e);
            pushMessage({ role: 'assistant', text: '请求失败：' + (e.message || e.status || '') });
        } finally {
            setLoading(false);
            // scroll to bottom
            setTimeout(()=>{ if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
        }
    };

    const onFileChange = (e) => {
        const list = Array.from(e.target.files || []);
        if (!list.length) return;
        setFiles(list);
        // 自动发送分析请求 when user uploads files
        sendQuestion({ question: '', ctx: {}, attachFiles: list });
        // clear input value to allow re-upload same file later
        e.target.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendQuestion({ question: input, ctx: {} });
    };

    return (
        <div className="w-full min-h-screen bg-slate-50">
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-slate-800">AI 问询 — 对话</h1>
                <p className="mt-1 text-sm text-slate-500">支持上传病历档案（文件将自动触发分析），或在下方输入问题与上传一起发送。</p>

                <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
                    <div ref={scrollRef} className="max-h-96 overflow-auto p-2 border rounded flex flex-col gap-3">
                        {messages.length===0 && <div className="text-sm text-slate-500">对话记录会在这里出现。</div>}
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex items-end ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {/* Assistant (left) shows avatar then bubble; User (right) shows bubble then avatar */}
                                {m.role !== 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 mr-2 overflow-hidden border border-slate-300">
                                        <img src="https://i.pravatar.cc/40?u=ai" alt="AI" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className={`max-w-[86%] text-sm whitespace-pre-wrap p-3 ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-lg rounded-br-none' : 'bg-white text-slate-800 border rounded-lg rounded-bl-none'}`}>
                                    {m.text}
                                    {m.files && (
                                        <div className="mt-2 text-xs text-slate-500">附件: {m.files.map(f=>f.name).join(', ')}</div>
                                    )}
                                </div>

                                {m.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 ml-2 overflow-hidden border border-slate-300">
                                        <img src="https://i.pravatar.cc/40?u=user" alt="User" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-3">
                        <div className="flex items-start gap-3">
                            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="输入你的问题，或上传病例后系统会自动分析" className="flex-1 border rounded p-2 text-sm h-28" />
                            <div className="flex flex-col items-stretch gap-2">
                                <label className="px-3 py-2 bg-white border rounded text-sm cursor-pointer text-slate-600">
                                    上传病历
                                    <input ref={fileInputRef} onChange={onFileChange} type="file" multiple className="hidden" />
                                </label>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 text-white rounded text-sm">发送</button>
                            </div>
                        </div>
                        {files.length>0 && <div className="mt-2 text-xs text-slate-500">已选择 {files.length} 个文件: {files.map(f=>f.name).join(', ')}</div>}
                        {loading && <div className="mt-2 text-sm text-slate-500">处理中，请稍候...</div>}
                        {error && <div className="mt-2 text-sm text-red-500">错误: {error.message || JSON.stringify(error.body || error)}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiInquiryPage;
