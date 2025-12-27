import React, { useState, useRef, useEffect } from 'react';
import aiApi from '../../api/ai';
import aiHistoryApi from '../../api/aiHistory';
import uploadApi from '../../api/upload';
import HistorySidebar from '../../components/Ai/HistorySidebar';
import SearchChatModal from '../../components/Ai/SearchChatModal';
import { useNavigate } from 'react-router-dom';

const AiInquiryPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // /ai/chat/ 扩展字段
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [hasAllergy, setHasAllergy] = useState(false);

  const [history, setHistory] = useState([]);
  const [baseHistory, setBaseHistory] = useState([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);

  // 把后端“逐条历史消息”映射成当前聊天窗口可渲染的 messages
  const mapHistoryResultsToMessages = (results = []) => {
    const items = Array.isArray(results) ? results.slice() : [];
    // 保证按时间升序，聊天窗口从上到下自然阅读
    items.sort((a, b) => {
      const ta = Date.parse(a?.created_at || '') || 0;
      const tb = Date.parse(b?.created_at || '') || 0;
      return ta - tb;
    });
    return items.map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      text: m?.content ?? '',
      created_at: m?.created_at,
      ts: Date.parse(m?.created_at || '') || undefined,
      _messageId: m?.id,
    }));
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = typeof ts === 'string' || typeof ts === 'number' ? new Date(ts) : ts;
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

  useEffect(() => {
    // 从API获取历史记录
    const fetchHistory = async () => {
      try {
        setError(null);
        // 新接口：GET /ai/history/ 返回 data: { results: [ {role,content,created_at...} ], ... }
        const data = await aiHistoryApi.getHistoryList({ page: 1, page_size: 100 });
        const results = data?.results;
        const grouped = aiHistoryApi.groupHistoryMessages
          ? aiHistoryApi.groupHistoryMessages(Array.isArray(results) ? results : [], { gapMinutes: 20 })
          : [];
        setHistory(grouped);
        setBaseHistory(grouped);

        // 新需求：不再区分新建会话/历史会话，进入页面直接展示全部历史
        const mapped = mapHistoryResultsToMessages(Array.isArray(results) ? results : []);
        setMessages(mapped);
        // 滚到底部
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 60);
      } catch (e) {
        console.error('获取历史记录失败:', e);
        setHistory([]);
        setBaseHistory([]);
        setMessages([]);
      }
    };

    fetchHistory();
  }, []);

  const searchInHistory = async (keyword) => {
    return await aiHistoryApi.searchHistory({ keyword, page: 1, page_size: 100 });
  };

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
  };

  const mapSuggestionLevel = (lvl) => {
    if (lvl === 'urgent') return { text: '建议尽快就医', cls: 'bg-red-50 text-red-700 border-red-200' };
    if (lvl === 'normal') return { text: '建议就诊', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { text: '一般信息', cls: 'bg-slate-50 text-slate-700 border-slate-200' };
  };

  const sendQuestion = async ({ question, ctx = {}, attachFiles } = {}) => {
    setError(null);
    const qRaw = (question || input || '').trim();
    const effectiveUploads = Array.isArray(pendingUploads) ? pendingUploads : [];
    const q = qRaw;
    if (!q) {
      setError(new Error('请输入你的问题或症状描述'));
      return;
    }

    // 把已上传的附件链接附加到文本中，便于后端/医生查看。
    // 注意：/ai/chat/ 当前不接收文件字段，只能放到 message 文本里。
    const addedAttachmentText = effectiveUploads.length
      ? `\n\n【附件】\n${effectiveUploads
        .map((f, i) => `${i + 1}. ${f.filename || '文件'}${f.url ? `：${f.url}` : ''}`)
        .join('\n')}`
      : '';
    const finalMessage = `${q}${addedAttachmentText}`;

    const userMsg = {
      role: 'user',
      text: finalMessage,
      files: effectiveUploads.length
        ? effectiveUploads.map((f) => ({ name: f.filename || '文件', url: f.url }))
        : undefined,
      ts: Date.now(),
    };

    pushMessage(userMsg);
    setInput('');
    setFiles([]);
    setLoading(true);

    try {
      const resp = await aiApi.chat({
        message: finalMessage,
        ...(age !== '' ? { age } : {}),
        ...(gender ? { gender } : {}),
        has_allergy: hasAllergy,
      });

      // 兼容两种返回：标准 {code,message,data} 或直接 {answer,...}
      const data = resp?.data ? resp.data : resp;
      const assistantText =
        typeof data === 'string'
          ? data
          : data?.answer || resp?.answer || resp?.text || JSON.stringify(resp);

      pushMessage({
        role: 'assistant',
        text: assistantText,
        meta: {
          suggestion_level: data?.suggestion_level,
          recommended_doctors: Array.isArray(data?.recommended_doctors) ? data.recommended_doctors : [],
        },
        ts: Date.now(),
      });

      // 发送成功后清空待发送附件
      if (effectiveUploads.length) setPendingUploads([]);

      // 轻量“回刷”一次历史（不强依赖；后端若异步落库，可让 UI 稳定跟随后端）
      // 注意：这里不阻塞 UI，仅用于让刷新后仍能看到完整历史
      try {
        const data2 = await aiHistoryApi.getHistoryList({ page: 1, page_size: 200 });
        const results2 = data2?.results;
        if (Array.isArray(results2)) {
          setMessages(mapHistoryResultsToMessages(results2));
          const grouped2 = aiHistoryApi.groupHistoryMessages
            ? aiHistoryApi.groupHistoryMessages(results2, { gapMinutes: 20 })
            : [];
          setHistory(grouped2);
          setBaseHistory(grouped2);
        }
      } catch (_) {
        // 忽略回刷失败，保持本地追加的消息
      }
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
    // 这里只上传并“暂存”，不会自动触发提问。
    setFiles((prev) => [...(prev || []), ...list]);
    (async () => {
      try {
        setError(null);
        setLoading(true);

        for (const f of list) {
          const uploaded = await uploadApi.uploadFile(f, { purpose: 'records' });
          const url = uploaded?.url;
          const size = uploaded?.size ?? f.size;
          const filename = uploaded?.filename ?? f.name;

          setPendingUploads((prev) => [
            ...(Array.isArray(prev) ? prev : []),
            {
              url,
              filename,
              size,
              purpose: uploaded?.purpose || 'records',
            },
          ]);
        }
      } catch (err) {
        console.error('文件上传失败:', err);
        setError(err);
        pushMessage({ role: 'assistant', text: `文件上传失败：${err?.message || ''}` });
      } finally {
        setLoading(false);
        // 注意：files 只是 input 选择状态；上传后清空它，避免重复显示“已选择文件”
        setFiles([]);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);
      }
    })();
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion({ question: input, ctx: {} });
  };

  const handleComposerKeyDown = (e) => {
    // Enter 发送；Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendQuestion({ question: input, ctx: {} });
    }
  };

  const handleSelectHistory = (item) => {
    // 新需求：聊天窗口始终展示全部历史；侧边栏点击仅做“定位滚动”
    const messageId = item?.messageId || item?.raw?.[0]?.id;
    if (!messageId) {
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
      return;
    }

    setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-message-id="${messageId}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 80);
  };

  const openMessageLocation = async (messageId) => {
    try {
      setError(null);
      setLoading(true);
      const data = await aiHistoryApi.getMessageLocation(messageId);
      const context = Array.isArray(data?.context) ? data.context : [];
      const mapped = context.map((m) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        text: m?.content ?? '',
        _messageId: m?.id,
      }));
      setMessages(mapped);
      setHighlightMessageId(data?.message_id || Number(messageId));
      // 等渲染后滚动
      setTimeout(() => {
        const container = scrollRef.current;
        if (!container) return;
        const el = container.querySelector(`[data-message-id="${data?.message_id || messageId}"]`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }, 80);
    } catch (e) {
      setError(e);
      pushMessage({ role: 'assistant', text: '定位消息失败：' + (e?.message || '') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-40">
      <HistorySidebar
        history={history}
        onSelect={handleSelectHistory}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <SearchChatModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={searchInHistory}
        onSelectMessage={async (messageId) => {
          setSearchModalOpen(false);
          await openMessageLocation(messageId);
        }}
      />

      <div className="max-w-5xl mx-auto px-4 pt-4 md:pt-6 md:ml-72">
        {/* 顶部标题栏 */}
        <div className="sticky top-0 z-10 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="backdrop-blur bg-white/70 border border-slate-200 rounded-2xl shadow-sm px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow">
                    🦷
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">AI 牙科问询</div>
                    <div className="text-xs text-slate-500 truncate">描述症状，AI 给你自检建议与就医指引</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setHighlightMessageId(null);
                  }}
                  className="text-sm px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  清空本页
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 聊天区卡片 */}
        <div className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col max-h-[68vh]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">{messages.length ? `共 ${messages.length} 条消息` : '开始一个新的问询吧'}</div>
            <div className="text-xs text-slate-400">{loading ? 'AI 正在思考…' : ''}</div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-4 scroll-smooth bg-white">
            {messages.length === 0 && (
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-800">你可以这样问：</div>
                <ul className="mt-2 space-y-1 text-slate-600 list-disc pl-5">
                  <li>“左下牙咬东西疼，持续两天了，会不会是蛀牙？”</li>
                  <li>“刷牙出血、口臭，应该挂什么科？”</li>
                  <li>“智齿反复发炎，需要拔吗？”</li>
                </ul>
              </div>
            )}

            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  data-message-id={m?._messageId}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow flex-shrink-0">
                      AI
                    </div>
                  )}

                  <div className="max-w-[86%]">
                    <div
                      className={
                        `text-sm whitespace-pre-wrap px-4 py-3 shadow-sm ` +
                        (isUser
                          ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-2xl rounded-br-md'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-md') +
                        (highlightMessageId && m?._messageId === highlightMessageId ? ' ring-2 ring-cyan-300' : '')
                      }
                    >
                      {m.text}
                      {!isUser && m?.meta?.uploaded_file?.url && (
                        <div className="mt-3">
                          <a
                            href={m.meta.uploaded_file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-cyan-200"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                📎 {m.meta.uploaded_file.filename || '已上传文件'}
                              </div>
                              {typeof m.meta.uploaded_file.size === 'number' && (
                                <div className="text-[11px] text-slate-500 flex-shrink-0">
                                  {(m.meta.uploaded_file.size / 1024).toFixed(1)} KB
                                </div>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-slate-600 truncate">{m.meta.uploaded_file.url}</div>
                            <div className="mt-2 text-[11px] text-slate-400">点击打开链接</div>
                          </a>
                        </div>
                      )}
                      {m.files && (
                        <div className={`mt-2 text-xs ${isUser ? 'text-white/80' : 'text-slate-500'}`}>
                          附件：{m.files.map((f) => f.name).join(', ')}
                        </div>
                      )}

                      {/* assistant 结构化信息：建议等级 + 推荐医生 */}
                      {!isUser && m.meta && (
                        <div className="mt-3 space-y-3">
                          {m.meta.suggestion_level && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${mapSuggestionLevel(m.meta.suggestion_level).cls}`}>
                              <span className="font-semibold">就医建议</span>
                              <span>{mapSuggestionLevel(m.meta.suggestion_level).text}</span>
                            </div>
                          )}

                          {Array.isArray(m.meta.recommended_doctors) && m.meta.recommended_doctors.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-slate-800 mb-2">推荐医生</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {m.meta.recommended_doctors.map((d, i) => (
                                  <button
                                    key={d?.id ?? i}
                                    type="button"
                                    onClick={() => {
                                      if (d?.id) navigate(`/doctors/${d.id}`);
                                    }}
                                    className="text-left p-3 rounded-2xl border border-slate-200 hover:border-cyan-200 hover:shadow-md transition bg-white"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-semibold text-slate-900 truncate">{d?.name || '医生'}</div>
                                      {d?.next_available_time && (
                                        <div className="text-[11px] text-slate-500 flex-shrink-0">{d.next_available_time}</div>
                                      )}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600 truncate">
                                      {(d?.department_name ? `${d.department_name}` : '')}{d?.title ? ` · ${d.title}` : ''}
                                    </div>
                                    {d?.good_at && (
                                      <div className="mt-2 text-xs text-slate-500 line-clamp-2">擅长：{d.good_at}</div>
                                    )}
                                    <div className="mt-2 text-[11px] text-slate-400">查看医生详情</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`mt-1 text-[11px] ${isUser ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                      {formatTime(m.created_at || m.ts)}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow flex-shrink-0">
                      我
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 固定在底部的输入框 */}
      <div className="fixed bottom-0 left-0 right-0 md:left-72 z-20 px-3 sm:px-4 pb-4 pt-3">
        <div className="w-full max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg p-3">
            {/* 个人信息（可选） */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">年龄</span>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="可选"
                  className="w-20 border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">性别</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  <option value="">未填写</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={hasAllergy}
                  onChange={(e) => setHasAllergy(e.target.checked)}
                  className="rounded border-slate-300"
                />
                有过敏史
              </label>

              <div className="ml-auto text-xs text-slate-400 hidden sm:block">Enter 发送 · Shift+Enter 换行</div>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="描述你的症状或问题（例如：疼痛位置、持续时间、是否出血/肿胀）"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm min-h-[52px] max-h-40 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-200 bg-white"
                />
                <div className="mt-1 text-[11px] text-slate-400 sm:hidden">Enter 发送 · Shift+Enter 换行</div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-[52px] inline-flex items-center justify-center px-5 rounded-2xl text-sm font-medium bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送
                </button>
              </div>
            </div>

            <div className="mt-2">
              {Array.isArray(pendingUploads) && pendingUploads.length > 0 && (
                <div className="text-xs text-slate-600">
                  <div className="font-medium text-slate-700 mb-1">待发送附件</div>
                  <div className="flex flex-wrap gap-2">
                    {pendingUploads.map((f, idx) => (
                      <div key={`${f?.url || f?.filename || 'file'}-${idx}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <a
                          href={f?.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className={`max-w-[220px] truncate ${f?.url ? 'text-cyan-700 hover:underline' : 'text-slate-500'}`}
                          title={f?.url || f?.filename}
                        >
                          📎 {f?.filename || '文件'}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {files.length > 0 && (
                <div className="text-xs text-slate-500">
                  已选择 {files.length} 个文件：{files.map((f) => f.name).join(', ')}
                </div>
              )}
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