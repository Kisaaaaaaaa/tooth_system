import React, { useEffect, useMemo, useRef, useState } from 'react';
import MapContainer from './MapContainer';

export default function RoutePlannerModal({
    open,
    onClose,
    hospital,
    userLocation,
    routeResult,
    loading,
    error,
    onRetry,
}) {
    const [mapError, setMapError] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [drivingDebug, setDrivingDebug] = useState(null);
    const [routeMode, setRouteMode] = useState('walking');
    const [routeWarning, setRouteWarning] = useState('');
    const [warningModalOpen, setWarningModalOpen] = useState(false);
    const [warningModalText, setWarningModalText] = useState('');
    const [warningSuggestMode, setWarningSuggestMode] = useState(null);
    const warningLastKeyRef = useRef('');

    const amapRef = useRef(null);
    const mapRef = useRef(null);
    const serviceRef = useRef(null);

    useEffect(() => {
        if (!open) {
            setMapError(null);
            setRouteInfo(null);
            setDrivingDebug(null);
            setRouteMode('walking');
            setRouteWarning('');
            setWarningModalOpen(false);
            setWarningModalText('');
            setWarningSuggestMode(null);
            warningLastKeyRef.current = '';
        }
    }, [open]);

    const { toName, toLngLat } = useMemo(() => {
        const name = hospital?.name || '医院';
        const lng = hospital?.longitude ?? hospital?.lng ?? hospital?.location?.longitude;
        const lat = hospital?.latitude ?? hospital?.lat ?? hospital?.location?.latitude;
        const lngLat = (typeof lng === 'number' && typeof lat === 'number') ? [lng, lat] : null;
        return { toName: name, toLngLat: lngLat };
    }, [hospital]);

    // 不再使用 routeResult 兜底：终点仅来自医院自身经纬度
    const finalToLngLat = toLngLat;

    const planRoute = ({ AMap, map }) => {
        try {
            // 插件诊断：根据模式检查对应服务是否就绪
            const pluginReady = {
                driving: !!AMap?.Driving,
                walking: !!AMap?.Walking,
                riding: !!AMap?.Riding,
                transfer: !!AMap?.Transfer,
            };
            if (!pluginReady[routeMode]) {
                setMapError(`地图插件加载失败：${routeMode} 对应插件未就绪（请检查 plugins 配置或网络拦截）`);
                setDrivingDebug({
                    reason: 'plugin_not_ready',
                    routeMode,
                    pluginReady,
                });
                return;
            }

            const hasFrom = userLocation?.longitude != null && userLocation?.latitude != null;
            const hasTo = !!finalToLngLat;

            // 切换方式/重新规划前先清理
            try {
                serviceRef.current?.clear?.();
            } catch {
                // ignore
            }
            map.clearMap();
            setRouteWarning('');
            setWarningModalOpen(false);
            setWarningModalText('');
            setWarningSuggestMode(null);
            warningLastKeyRef.current = '';

            if (!hasFrom || !hasTo) {
                // 只打点
                const markers = [];
                if (hasTo) {
                    markers.push(new AMap.Marker({ position: finalToLngLat, title: toName }));
                }
                if (hasFrom) {
                    markers.push(new AMap.Marker({ position: [userLocation.longitude, userLocation.latitude], title: '我的位置' }));
                }
                if (markers.length) {
                    map.add(markers);
                    map.setFitView(markers, false, [40, 40, 40, 40]);
                }
                setRouteInfo(null);
                setDrivingDebug({
                    reason: 'missing_points',
                    routeMode,
                    from: hasFrom ? [userLocation.longitude, userLocation.latitude] : null,
                    to: hasTo ? finalToLngLat : null,
                });
                return;
            }

            const start = new AMap.LngLat(userLocation.longitude, userLocation.latitude);
            const end = new AMap.LngLat(finalToLngLat[0], finalToLngLat[1]);

            const service = (() => {
                switch (routeMode) {
                    case 'walking':
                        return new AMap.Walking({ map, hideMarkers: false });
                    case 'riding':
                        return new AMap.Riding({ map, hideMarkers: false });
                    case 'transfer':
                        //到时候改成武汉
                        return new AMap.Transfer({ map, city: '全国', hideMarkers: false });
                    case 'driving':
                    default:
                        return new AMap.Driving({
                            map,
                            policy: AMap.DrivingPolicy ? AMap.DrivingPolicy.LEAST_TIME : undefined,
                            hideMarkers: false,
                        });
                }
            })();
            serviceRef.current = service;

            const searchCb = (status, result) => {
                if (status !== 'complete') {
                    console.log('[AMap Route] mode:', routeMode, 'status:', status, 'result:', result);
                    const info = result?.info;
                    const infocode = result?.infocode;
                    const message = result?.message;

                    const rawText = typeof result === 'string' ? result : '';
                    const mergedText = `${rawText} ${String(info ?? '')} ${String(message ?? '')} ${String(infocode ?? '')}`;
                    setDrivingDebug({
                        status,
                        info,
                        infocode,
                        message,
                        rawResult: result,
                        routeMode,
                        from: [userLocation.longitude, userLocation.latitude],
                        to: finalToLngLat,
                    });

                    if (mergedText.includes('USERKEY_PLAT_NOMATCH')) {
                        console.warn('[AMap Auth Error] USERKEY_PLAT_NOMATCH', {
                            host: typeof window !== 'undefined' ? window.location.hostname : '',
                            info,
                            message,
                            infocode,
                            rawResult: result,
                        });
                        setMapError('地图服务暂不可用，请稍后重试。');
                    } else {
                        const fallback = '路线规划失败，请稍后重试。';
                        const msg = message || info || rawText || fallback;
                        setMapError(String(msg || fallback));
                    }
                    setRouteInfo(null);
                    return;
                }

                try {
                    let distance;
                    let time;

                    const route0 = result?.routes?.[0];
                    if (route0) {
                        distance = route0.distance;
                        time = route0.time;
                    }

                    const routeAlt = result?.route;
                    if (distance == null && routeAlt?.distance != null) distance = routeAlt.distance;
                    if (time == null && routeAlt?.time != null) time = routeAlt.time;

                    const pathAlt = result?.paths?.[0];
                    if (distance == null && pathAlt?.distance != null) distance = pathAlt.distance;
                    if (time == null && pathAlt?.duration != null) time = pathAlt.duration;

                    const rideData = result?.data;
                    if (distance == null && rideData?.distance != null) distance = rideData.distance;
                    if (time == null && rideData?.time != null) time = rideData.time;

                    const plan0 = result?.plans?.[0];
                    if (distance == null && plan0?.distance != null) distance = plan0.distance;
                    if (time == null && plan0?.time != null) time = plan0.time;

                    // 公交：没有可用方案
                    let warned = '';
                    if (routeMode === 'transfer') {
                        const plans = result?.plans;
                        const noPlans = !Array.isArray(plans) || plans.length === 0;
                        const noDistanceTime = distance == null && time == null;
                        if (noPlans || noDistanceTime) {
                            warned = '没有公交路线，请选择其他路线';
                        }
                    }


                    if (warned) {
                        setRouteWarning(warned);

                        const warnKey = `${routeMode}:${warned}`;
                        if (warningLastKeyRef.current !== warnKey) {
                            warningLastKeyRef.current = warnKey;
                            setWarningModalText(warned);

                            // 给一个“推荐切换”的按钮
                            if (routeMode === 'transfer') {
                                setWarningSuggestMode('driving');
                            } else if (routeMode === 'walking') {
                                setWarningSuggestMode('driving');
                            } else {
                                setWarningSuggestMode(null);
                            }

                            setWarningModalOpen(true);
                        }
                    }

                    setRouteInfo({ distance, time, mode: routeMode });
                    setDrivingDebug({
                        status,
                        routeMode,
                        parsed: { distance, time, warned: warned || null },
                        from: [userLocation.longitude, userLocation.latitude],
                        to: finalToLngLat,
                    });
                    setMapError(null);
                } catch {
                    setRouteInfo(null);
                }
            };

            service.search(start, end, searchCb);
        } catch (err) {
            setMapError(err?.message || '地图初始化失败');
        }
    };

    // 真正的“切换方式/起终点变化就重新规划”在这里触发
    useEffect(() => {
        if (!open) return;
        if (!amapRef.current || !mapRef.current) return;
        planRoute({ AMap: amapRef.current, map: mapRef.current });
    }, [open, routeMode, userLocation?.longitude, userLocation?.latitude, finalToLngLat?.[0], finalToLngLat?.[1]]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative w-[97vw] max-w-5xl max-h-[92vh] rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="text-base font-bold text-slate-800">路线规划</div>
                        <div className="text-xs text-slate-500 mt-0.5">目的地：{hospital?.name || '-'} </div>
                    </div>
                    <button
                        className="text-slate-500 hover:text-slate-800 transition"
                        onClick={onClose}
                        aria-label="close"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-5 py-4 space-y-3 overflow-auto">
                    {loading ? (
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="inline-block h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                            正在为您规划路线…
                        </div>
                    ) : error ? (
                        <div className="text-sm">
                            <div className="text-rose-600 mb-2">{error}</div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition"
                                    onClick={onRetry}
                                >
                                    重试
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'walking', label: '步行' },
                                        { key: 'riding', label: '骑行' },
                                        { key: 'transfer', label: '公交' },
                                        { key: 'driving', label: '驾车' },
                                    ].map((m) => (
                                        <button
                                            key={m.key}
                                            type="button"
                                            className={
                                                routeMode === m.key
                                                    ? 'px-3 py-1.5 rounded-full text-xs bg-cyan-600 text-white'
                                                    : 'px-3 py-1.5 rounded-full text-xs bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }
                                            onClick={() => {
                                                setMapError(null);
                                                setRouteInfo(null);
                                                setDrivingDebug(null);
                                                setRouteWarning('');
                                                setWarningModalOpen(false);
                                                setWarningModalText('');
                                                setWarningSuggestMode(null);
                                                warningLastKeyRef.current = '';
                                                setRouteMode(m.key);
                                            }}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                {!!routeInfo && (
                                    <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                        <span className="mr-2">方式：{routeMode === 'driving' ? '驾车' : routeMode === 'walking' ? '步行' : routeMode === 'riding' ? '骑行' : '公交'}</span>
                                        <span>距离：{routeInfo.distance != null ? `${(routeInfo.distance / 1000).toFixed(2)} km` : '-'}</span>
                                        <span className="ml-3">预计：{routeInfo.time != null ? `${Math.round(routeInfo.time / 60)} 分钟` : '-'}</span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition"
                                        onClick={() => {
                                            onRetry?.();
                                        }}
                                    >
                                        重新定位并规划
                                    </button>
                                </div>

                                <MapContainer
                                    height={700}
                                    center={
                                        userLocation?.longitude != null && userLocation?.latitude != null
                                            ? [userLocation.longitude, userLocation.latitude]
                                            : (finalToLngLat || [116.397428, 39.90923])
                                    }
                                    zoom={12}
                                    plugins={["AMap.Scale", "AMap.ToolBar", "AMap.Driving", "AMap.Walking", "AMap.Riding", "AMap.Transfer"]}
                                    onError={(e) => setMapError(e?.message || '地图加载失败')}
                                    onMapReady={({ AMap, map }) => {
                                        amapRef.current = AMap;
                                        mapRef.current = map;
                                        // map 初次 ready 后立刻规划一次
                                        planRoute({ AMap, map });
                                    }}
                                />

                                {!!routeWarning && (
                                    <div className="text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2">
                                        {routeWarning}
                                    </div>
                                )}

                                {!!mapError && (
                                    <div className="text-xs text-rose-600 space-y-1">
                                        <div>地图错误：{mapError}</div>
                                        {!!drivingDebug?.status && (
                                            <div>
                                                status: {String(drivingDebug.status)}
                                                {drivingDebug.info ? `，info: ${String(drivingDebug.info)}` : ''}
                                                {drivingDebug.infocode ? `，infocode: ${String(drivingDebug.infocode)}` : ''}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </>
                    )}

                    {!finalToLngLat && (
                        <div className="text-xs text-amber-600">
                            该医院暂未提供定位信息，无法规划路线。
                        </div>
                    )}
                </div>
            </div>

            {/* 提醒弹窗 */}
            {warningModalOpen && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
                    <div className="w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 pointer-events-auto">
                        <div className="text-sm font-semibold text-slate-800">提示</div>
                        <div className="mt-2 text-sm text-slate-700">{warningModalText}</div>
                        <div className="mt-4 flex gap-2 justify-end">
                            {warningSuggestMode && (
                                <button
                                    type="button"
                                    className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition"
                                    onClick={() => {
                                        setWarningModalOpen(false);
                                        setWarningModalText('');
                                        setWarningSuggestMode(null);
                                        setRouteMode(warningSuggestMode);
                                    }}
                                >
                                    切换为{warningSuggestMode === 'driving' ? '驾车' : warningSuggestMode}
                                </button>
                            )}
                            <button
                                type="button"
                                className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition"
                                onClick={() => {
                                    setWarningModalOpen(false);
                                    setWarningModalText('');
                                    setWarningSuggestMode(null);
                                }}
                            >
                                知道了
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
