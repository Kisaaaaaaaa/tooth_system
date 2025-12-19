import React from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

const HospitalDataPreview = ({ data, onApply, onClose }) => {
  const [copied, setCopied] = React.useState(null);
  const [selectedFields, setSelectedFields] = React.useState({
    name: true,
    address: true,
    phone: true,
    city: false,
    district: false,
    province: false,
  });

  const copyToClipboard = (value, field) => {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApply = () => {
    const filteredData = {};
    Object.keys(selectedFields).forEach(key => {
      if (selectedFields[key] && data[key]) {
        filteredData[key] = data[key];
      }
    });
    onApply(filteredData);
  };

  if (!data) {
    return (
      <div className="p-4 text-center text-slate-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 医院名称 */}
      {data.name && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFields.name}
                onChange={(e) => setSelectedFields({ ...selectedFields, name: e.target.checked })}
                className="w-4 h-4"
              />
              医院名称
            </label>
            <button
              onClick={() => copyToClipboard(data.name, 'name')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {copied === 'name' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="text-sm text-slate-900 break-all">{data.name}</div>
        </div>
      )}

      {/* 医院地址 */}
      {data.address && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFields.address}
                onChange={(e) => setSelectedFields({ ...selectedFields, address: e.target.checked })}
                className="w-4 h-4"
              />
              医院地址
            </label>
            <button
              onClick={() => copyToClipboard(data.address, 'address')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {copied === 'address' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="text-sm text-slate-900 break-all">{data.address}</div>
        </div>
      )}

      {/* 联系电话 */}
      {data.phone && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFields.phone}
                onChange={(e) => setSelectedFields({ ...selectedFields, phone: e.target.checked })}
                className="w-4 h-4"
              />
              联系电话
            </label>
            <button
              onClick={() => copyToClipboard(data.phone, 'phone')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {copied === 'phone' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="text-sm text-slate-900 break-all">{data.phone}</div>
        </div>
      )}

      {/* 城市 */}
      {data.city && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFields.city}
                onChange={(e) => setSelectedFields({ ...selectedFields, city: e.target.checked })}
                className="w-4 h-4"
              />
              城市
            </label>
            <button
              onClick={() => copyToClipboard(data.city, 'city')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {copied === 'city' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="text-sm text-slate-900 break-all">{data.city}</div>
        </div>
      )}

      {/* 区域 */}
      {data.district && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFields.district}
                onChange={(e) => setSelectedFields({ ...selectedFields, district: e.target.checked })}
                className="w-4 h-4"
              />
              区域
            </label>
            <button
              onClick={() => copyToClipboard(data.district, 'district')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {copied === 'district' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="text-sm text-slate-900 break-all">{data.district}</div>
        </div>
      )}

      {/* 图片数量 */}
      {data.photos && data.photos.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">
            <AlertCircle size={14} />
            发现 {data.photos.length} 张医院照片
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {data.photos.map((photo, idx) => (
              <a
                key={idx}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
                title={photo.title || `照片 ${idx + 1}`}
              >
                <img
                  src={photo.url}
                  alt={`医院照片 ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded border border-blue-300 hover:opacity-75 transition"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
        >
          应用选中的信息
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            关闭
          </button>
        )}
      </div>
    </div>
  );
};

export default HospitalDataPreview;
