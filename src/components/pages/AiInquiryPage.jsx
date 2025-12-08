import React, { useState, useRef, useEffect } from 'react';
import aiApi from '../../api/ai';
import aiHistoryApi from '../../api/aiHistory';
import HistorySidebar from '../../components/Ai/HistorySidebar';

const AiInquiryPage = () => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sessionMessages, setSessionMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => Date.now().toString(36));

  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // 从API获取历史记录
    const fetchHistory = async () => {
      try {
        const historyList = await aiHistoryApi.getHistoryList();
        setHistory(Array.isArray(historyList) ? historyList : []);
      } catch (e) {
        console.error('获取历史记录失败:', e);
        setHistory([]);
      }
    };
    
    fetchHistory();
  }, []);

  const saveHistoryItem = async (item) => {
    try {
      // 适配API数据结构
      const apiItem = {
        question: item.preview || (item.messages && item.messages[0]?.text) || '',
        answer: item.messages && item.messages.find(m => m.role === 'assistant')?.text || '',
        files: item.messages && item.messages.find(m => m.files)?.files || [],
        context: JSON.stringify(item.messages || []),
      };
      
      // 调用API保存历史记录
      const savedItem = await aiHistoryApi.saveHistoryItem(apiItem);
      
      // 更新本地状态
      const next = [savedItem, ...history].slice(0, 100);
      setHistory(next);
      
      return savedItem;
    } catch (e) {
      console.error('保存历史记录失败:', e);
      // 保存失败时使用本地存储作为回退
      const next = [item, ...history].slice(0, 100);
      setHistory(next);
      return item;
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      // 调用API删除历史记录
      await aiHistoryApi.deleteHistoryItem(id);
      
      // 更新本地状态
      const next = history.filter((h) => h.id !== id);
      setHistory(next);
    } catch (e) {
      console.error('删除历史记录失败:', e);
      // 删除失败时使用本地存储作为回退
      const next = history.filter((h) => h.id !== id);
      setHistory(next);
    }
  };

  const clearHistory = async () => {
    try {
      // 调用API清空历史记录
      await aiHistoryApi.clearHistoryList();
      
      // 更新本地状态
      setHistory([]);
    } catch (e) {
      console.error('清空历史记录失败:', e);
      // 清空失败时使用本地存储作为回退
      setHistory([]);
    }
  };

  const pushMessage = (msg) => {
    setMessages((m) => [...m, msg]);
    setSessionMessages((s) => [...s, msg]);
  };

  const sendQuestion = async ({ question, ctx = {}, attachFiles } = {}) => {
    setError(null);
    const q = (question || input || '').trim();
    if (!q && !(attachFiles && attachFiles.length)) {
      setError(new Error('请填写问题或上传病历文件以供分析'));
      return;
    }

    const userMsg = {
      role: 'user',
      text: q || (attachFiles && `上传了 ${attachFiles.length} 个文件，请分析`),
      files: attachFiles ? attachFiles.map((f) => ({ name: f.name })) : undefined,
    };

    pushMessage(userMsg);
    setInput('');
    setFiles([]);
    setLoading(true);

    try {
      const resp = await aiApi.inquiryWithFiles({ question: q || '请分析上传的病例', context: ctx, files: attachFiles });
      const assistantText = typeof resp === 'string' ? resp : resp.answer || resp.text || JSON.stringify(resp);
      pushMessage({ role: 'assistant', text: assistantText });
    } catch (e) {
      setError(e);
      pushMessage({ role: 'assistant', text: '请求失败：' + (e.message || e.status || '') });
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  };

  const onFileChange = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setFiles(list);
    sendQuestion({ question: '', ctx: {}, attachFiles: list });
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion({ question: input, ctx: {} });
  };

  const handleSelectHistory = (item) => {
    if (item.messages && Array.isArray(item.messages)) {
      setMessages(item.messages);
      setSessionMessages(item.messages);
      setSessionId(item.id || Date.now().toString(36));
    } else {
      const fallback = item.question ? [{ role: 'user', text: item.question }] : [];
      setMessages(fallback);
      setSessionMessages(fallback);
      setSessionId(item.id || Date.now().toString(36));
    }
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  const endAndSaveSession = () => {
    if (!sessionMessages || sessionMessages.length === 0) return;
    const histItem = {
      id: sessionId || (Date.now() + Math.random().toString(36).slice(2, 8)),
      preview: sessionMessages.find((m) => m.role === 'user') ? sessionMessages.find((m) => m.role === 'user').text : (sessionMessages[0] && sessionMessages[0].text) || '',
      messages: sessionMessages,
      ts: Date.now(),
    };
    saveHistoryItem(histItem);
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionMessages([]);
    setSessionId(Date.now().toString(36));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-32">
      <HistorySidebar history={history} onSelect={handleSelectHistory} onDelete={deleteHistoryItem} onClear={clearHistory} />

      <div className="max-w-5xl mx-auto px-4 pt-3 ml-72">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-600 py-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦷</span>
            <span className="font-medium">智能问诊</span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={startNewChat} className="text-sm text-slate-600 px-2 py-1 border rounded">新建聊天</button>
            <button type="button" onClick={endAndSaveSession} disabled={!sessionMessages || sessionMessages.length === 0} className="text-sm text-white bg-cyan-600 px-2 py-1 rounded">结束并保存</button>
          </div>
        </div>

        <div className="mt-3 bg-white rounded-lg shadow-sm p-4 flex flex-col max-h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-auto p-2 border rounded flex flex-col gap-3">
            {messages.length === 0 && <div className="text-sm text-slate-500">对话记录会在这里出现。</div>}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-end ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 mr-2 overflow-hidden border border-slate-300">
                    <img src="https://i.pravatar.cc/40?u=ai" alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className={`max-w-[86%] text-sm whitespace-pre-wrap p-3 ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-lg rounded-br-none' : 'bg-white text-slate-800 border rounded-lg rounded-bl-none'}`}>
                  {m.text}
                  {m.files && <div className="mt-2 text-xs text-slate-500">附件: {m.files.map((f) => f.name).join(', ')}</div>}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 ml-2 overflow-hidden border border-slate-300">
                    <img src="https://i.pravatar.cc/40?u=user" alt="User" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 固定在底部的输入框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-4 z-10 shadow-md">
        <div className="max-w-5xl mx-auto pl-4 md:pl-4 lg:ml-72">
          <form onSubmit={handleSubmit}>
            <div className="flex items-start gap-3">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入你的问题，或上传病例后系统会自动分析" className="flex-1 border rounded p-2 text-sm h-16 resize-none" />

              <div className="flex flex-col items-stretch gap-2">
                <label className="px-3 py-2 bg-white border rounded text-sm cursor-pointer text-slate-600">
                  上传病历
                  <input ref={fileInputRef} onChange={onFileChange} type="file" multiple className="hidden" />
                </label>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 text-white rounded text-sm">发送</button>
              </div>
            </div>

            <div className="mt-2">
              {files.length > 0 && <div className="text-xs text-slate-500">已选择 {files.length} 个文件: {files.map((f) => f.name).join(', ')}</div>}
              {loading && <div className="mt-2 text-sm text-slate-500">处理中，请稍候...</div>}
              {error && <div className="mt-2 text-sm text-red-500">错误: {error.message || JSON.stringify(error.body || error)}</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiInquiryPage;