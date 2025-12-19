import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, Search } from 'lucide-react';

const MapSelector = ({ isOpen, onClose, onSelectLocation, initialLat, initialLng }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLat && initialLng 
      ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } 
      : null
  );
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // 从环境变量读取高德 Key 与 JSAPI 安全密钥
  const AMAP_KEY = import.meta?.env?.VITE_AMAP_KEY || '346498980ff8593b8252d22e7fb3bfcb';
  const AMAP_SECURITY = import.meta?.env?.VITE_AMAP_SECURITY || '212299ecb0ae8b4ddbf5621daa4b3626';

  // 加载高德地图脚本
  useEffect(() => {
    if (!isOpen) return;

    if (window.AMap) {
      initMap();
    } else {
      // 在加载脚本之前注入 JSAPI 安全密钥（若已在控制台创建）
      if (AMAP_SECURITY) {
        window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY };
      } else {
        console.warn('未检测到 VITE_AMAP_SECURITY（JSAPI 安全密钥），PlaceSearch 等服务可能报 INVALID_USER_SCODE');
      }
      const script = document.createElement('script');
      // 预加载 PlaceSearch 插件
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.PlaceSearch`;
      script.async = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setError('地图加载失败，请检查网络或API Key配置');
      };
      document.head.appendChild(script);
    }
  }, [isOpen]);

  // 初始化地图
  const initMap = () => {
    if (!window.AMap) return;

    const mapContainer = document.getElementById('amap-container');
    if (!mapContainer) return;

    const defaultLat = selectedLocation?.lat || 39.9042;
    const defaultLng = selectedLocation?.lng || 116.4074;

    try {
      const newMap = new window.AMap.Map('amap-container', {
        zoom: 15,
        center: [defaultLng, defaultLat],
        mapStyle: 'amap://styles/light'
      });

      setMap(newMap);

      // 如果有初始坐标，添加标记
      if (selectedLocation) {
        addMarker(newMap, defaultLng, defaultLat);
      }

      // 地图点击事件 - 点击地图选择位置或 POI
      newMap.on('click', (e) => {
        const { lng, lat } = e.lnglat;
        
        // 如果点击的是 POI，尝试获取 POI 信息
        if (e.target && e.target._data) {
          const poi = e.target._data;
          const hospitalInfo = extractHospitalInfo(poi);
          setSelectedLocation(hospitalInfo);
        } else {
          // 否则就是普通的地图点击
          setSelectedLocation({ lat, lng });
        }
        
        addMarker(newMap, lng, lat);
        setError('');
      });
    } catch (err) {
      console.error('地图初始化失败:', err);
      setError('地图初始化失败，请稍后重试');
    }
  };

  // 添加地图标记
  const addMarker = (mapInstance, lng, lat) => {
    if (!window.AMap) return;

    // 移除旧标记
    if (marker) {
      mapInstance.remove(marker);
    }

    const newMarker = new window.AMap.Marker({
      position: [lng, lat],
      map: mapInstance,
      title: '医院位置',
      animation: 'AMAP_ANIMATION_DROP'
    });

    setMarker(newMarker);
  };

  // 从 POI 对象提取医院信息
  const extractHospitalInfo = (poi) => {
    return {
      lat: poi.location.lat,
      lng: poi.location.lng,
      name: poi.name || '',
      address: poi.address || poi.adname || poi.pname || '',
      phone: poi.tel || '',
      city: poi.cityname || '',
      district: poi.adname || '',
      province: poi.pname || '',
      postcode: poi.postcode || '',
      poiId: poi.id || '',
      poiType: poi.type || '',
      website: poi.website || '',
      photos: poi.photos || []
    };
  };

  // 地址/关键字搜索（使用 JS API 的 PlaceSearch 插件）
  const handleSearch = (e) => {
    e.preventDefault();
    const keywords = searchInput.trim();
    if (!keywords) {
      setError('请输入医院名称或地址');
      return;
    }

    if (!map || !window.AMap) {
      setError('地图未加载完成，请稍后重试');
      return;
    }

    setError('');
    setIsSearching(true);

    // 使用 AMap.PlaceSearch 插件（JS API）
    window.AMap.plugin('AMap.PlaceSearch', function() {
      const placeSearch = new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        extensions: 'all'
      });

      console.log('开始搜索:', keywords);

      // 第一次搜索：直接搜索关键字
      placeSearch.search(keywords, function(status, result) {
        console.log('第一次搜索结果 - status:', status, 'result:', result);
        
        if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
          const poi = result.poiList.pois[0];
          console.log('找到POI:', poi);
          const hospitalInfo = extractHospitalInfo(poi);

          setSelectedLocation(hospitalInfo);
          map.setCenter([hospitalInfo.lng, hospitalInfo.lat]);
          map.setZoom(15);
          addMarker(map, hospitalInfo.lng, hospitalInfo.lat);
          setIsSearching(false);
        } else {
          // 第二次搜索：若无结果，尝试添加"医院"再搜一次
          const altKeywords = keywords.includes('医院') ? keywords : `${keywords}医院`;
          console.log('第一次无结果，尝试搜索:', altKeywords);
          
          placeSearch.search(altKeywords, function(status2, result2) {
            console.log('第二次搜索结果 - status:', status2, 'result:', result2);
            setIsSearching(false);
            
            if (status2 === 'complete' && result2.poiList && result2.poiList.pois && result2.poiList.pois.length > 0) {
              const poi = result2.poiList.pois[0];
              console.log('找到POI:', poi);
              const hospitalInfo = extractHospitalInfo(poi);

              setSelectedLocation(hospitalInfo);
              map.setCenter([hospitalInfo.lng, hospitalInfo.lat]);
              map.setZoom(15);
              addMarker(map, hospitalInfo.lng, hospitalInfo.lat);
            } else {
              console.error('两次搜索都未找到结果');
              setError('未找到匹配的地址或医院，请尝试更详细的关键词（如：北京协和医院）');
            }
          });
        }
      });
    });
  };

  // 确认选择
  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        // 传递从高德地图获取的完整信息供表单自动填充
        poiData: {
          name: selectedLocation.name,
          address: selectedLocation.address,
          phone: selectedLocation.phone,
          city: selectedLocation.city,
          district: selectedLocation.district,
          province: selectedLocation.province,
          postcode: selectedLocation.postcode,
          photos: selectedLocation.photos
        }
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <h3 className="text-lg font-medium">在地图上选择医院位置</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setError('');
                }}
                placeholder="输入医院名称（如：协和、中山医院、北京协和医院）"
                className="w-full border-2 border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <Search size={18} className="absolute right-3 top-2.5 text-cyan-400 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? '搜索中...' : '搜索'}
            </button>
          </form>
          <p className="text-xs text-slate-600 mt-2">💡 支持模糊搜索医院名称，也可以在地图上直接点击选择位置</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-4 mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 地图和信息容器 */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* 地图 */}
          <div className="flex-1 border-2 border-cyan-200 rounded-lg overflow-hidden bg-gray-100">
            <div id="amap-container" style={{ width: '100%', height: '100%' }} />
          </div>

          {/* 右侧信息栏 */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto">
            {/* 坐标和医院信息显示 */}
            {selectedLocation && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <div className="font-semibold text-green-900 line-clamp-2">{selectedLocation.name || '已选择位置'}</div>
                    {selectedLocation.address && (
                      <div className="text-xs text-green-700 mt-1 line-clamp-2">{selectedLocation.address}</div>
                    )}
                  </div>
                </div>
                
                {/* 坐标信息 */}
                <div className="space-y-1 text-sm border-t pt-2">
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-slate-500">纬度</div>
                    <div className="font-medium text-slate-900">{selectedLocation.lat.toFixed(6)}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-slate-500">经度</div>
                    <div className="font-medium text-slate-900">{selectedLocation.lng.toFixed(6)}</div>
                  </div>
                </div>

                {/* 高德地图提取的信息 */}
                <div className="text-xs border-t pt-2">
                  {selectedLocation.phone && (
                    <div className="bg-white rounded p-2 mb-1">
                      <div className="text-slate-500">电话</div>
                      <div className="font-medium text-slate-900 truncate">{selectedLocation.phone}</div>
                    </div>
                  )}
                  {selectedLocation.city && (
                    <div className="bg-white rounded p-2 mb-1">
                      <div className="text-slate-500">城市</div>
                      <div className="font-medium text-slate-900">{selectedLocation.city}</div>
                    </div>
                  )}
                  {selectedLocation.district && (
                    <div className="bg-white rounded p-2 mb-1">
                      <div className="text-slate-500">区域</div>
                      <div className="font-medium text-slate-900">{selectedLocation.district}</div>
                    </div>
                  )}
                  {selectedLocation.photos?.length > 0 && (
                    <div className="bg-white rounded p-2">
                      <div className="text-slate-500">图片数量</div>
                      <div className="font-medium text-slate-900">{selectedLocation.photos.length} 张</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 操作说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-shrink-0">
              <div className="text-sm font-medium text-blue-900 mb-2">操作方式：</div>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>✓ 输入医院名称模糊搜索</li>
                <li>✓ 点击地图上的任意位置</li>
                <li>✓ 查看准确经纬度坐标</li>
              </ul>
            </div>

            {/* 常见医院示例 */}
            <div className="bg-slate-50 rounded-lg p-3 flex-shrink-0">
              <div className="text-xs font-medium text-slate-700 mb-2">快速搜索：</div>
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('北京协和医院');
                    setError('');
                  }}
                  className="block w-full text-left px-2 py-1 text-slate-600 hover:bg-slate-200 rounded transition"
                >
                  北京协和医院
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('上海第九人民医院');
                    setError('');
                  }}
                  className="block w-full text-left px-2 py-1 text-slate-600 hover:bg-slate-200 rounded transition"
                >
                  上海第九人民医院
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('广州中山大学附属医院');
                    setError('');
                  }}
                  className="block w-full text-left px-2 py-1 text-slate-600 hover:bg-slate-200 rounded transition"
                >
                  广州中山大学附属医院
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-2 p-4 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-white transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MapPin size={18} />
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
