import React, { useEffect } from 'react';
import { X, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const GuideSection = ({ title, steps }) => (
  <div className="mb-6">
    <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
      <CheckCircle2 size={16} className="text-cyan-600" />
      {title}
    </div>
    <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600">
      {steps.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  </div>
);

const roleGuides = (role = 'user') => {
  if (role === 'admin') {
    return [
      {
        title: '管理员快速上手',
        steps: [
          '进入“总览”查看数据概览与待办提醒',
          '在“医生审核”中查看并处理待审核医生',
          '在“医院管理”维护医院信息与图片',
          '在“用户管理”查看用户并进行拉黑/解除',
        ],
      },
      {
        title: '常见问题',
        steps: [
          '拉黑后不显示？请在“已拉黑”筛选中查看',
          '图片无法显示？请检查图片地址或重新上传',
        ],
      },
    ];
  }
  if (role === 'doctor') {
    return [
      {
        title: '医生端快速上手',
        steps: [
          '在“我的排班/排班管理”上传或维护行程',
          '在“预约管理”查看患者预约与签到状态',
          '在“病例管理”记录就诊信息与诊疗方案',
          '在“个人信息”完善头像、简介、联系方式',
        ],
      },
      {
        title: '建议',
        steps: [
          '及时更新排班，避免与患者沟通成本',
          '完善擅长与简介，便于患者了解与选择',
        ],
      },
    ];
  }
  return [
    {
      title: '用户端快速上手',
      steps: [
        '在“医院/医生”列表中筛选并查看详情',
        '进入医生详情，选择时间后完成预约',
        '在“预约记录”查看、签到或取消预约',
        '在“AI问询”描述症状获取就医建议',
        '在“病历”查看历史记录与医生建议',
      ],
    },
    {
      title: '温馨提示',
      steps: [
        '如需导航与到院指引，可在医院详情页查看',
        '如需在线沟通，可在问诊页面与医生交流',
      ],
    },
  ];
};

const GuideModal = ({ open, onClose, role = 'user', onNavigate }) => {
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (open) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const sections = roleGuides(role);

  const QuickLinks = () => {
    if (role === 'admin') {
      return (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate?.('admin/doctors')} className="px-3 py-1.5 rounded-lg text-sm bg-cyan-600 text-white hover:bg-cyan-700">去医生审核</button>
          <button onClick={() => onNavigate?.('admin/hospitals')} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">去医院管理</button>
          <button onClick={() => onNavigate?.('admin/users')} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">去用户管理</button>
        </div>
      );
    }
    if (role === 'doctor') {
      return (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate?.('doctorMySchedule')} className="px-3 py-1.5 rounded-lg text-sm bg-cyan-600 text-white hover:bg-cyan-700">去我的排班</button>
          <button onClick={() => onNavigate?.('doctorAppointments')} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">去预约管理</button>
          <button onClick={() => onNavigate?.('doctorRecords')} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">去病例管理</button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onNavigate?.('doctors')} className="px-3 py-1.5 rounded-lg text-sm bg-cyan-600 text-white hover:bg-cyan-700">找医生</button>
        <button onClick={() => onNavigate?.('appointment')} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">看预约</button>
        <button onClick={() => onNavigate?.('aiInquiry')} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">用AI问询</button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[92%] max-w-3xl">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <HelpCircle size={18} className="text-cyan-600" />
              使用指南
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {sections.map((sec, i) => (
              <GuideSection key={i} title={sec.title} steps={sec.steps} />
            ))}

            <div className="mt-4">
              <div className="text-sm text-slate-500 mb-2">快速前往</div>
              <QuickLinks />
            </div>
          </div>

          <div className="p-4 border-t flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                onChange={(e) => {
                  if (e.target.checked) localStorage.setItem('onboarding_seen_v1', '1');
                  else localStorage.removeItem('onboarding_seen_v1');
                }}
                defaultChecked={localStorage.getItem('onboarding_seen_v1') === '1'}
              />
              不再提示
            </label>

            <button
              onClick={() => {
                localStorage.setItem('onboarding_seen_v1', '1');
                onClose?.();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
            >
              我知道了 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
