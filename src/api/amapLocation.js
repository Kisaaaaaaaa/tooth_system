import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_JS_KEY = 'aeb7d6496f12243836e1f9b2e7a4d09e';
const AMAP_SECURITY_JS_CODE = 'fe0b576d771bdbca003b95d5081fe647';

/**
 * 只使用高德 JSAPI 定位（AMap.Geolocation）。
 * - 返回纬度/经度/精度（米）
 * - 不进行浏览器定位 fallback（按需求：系统统一使用高德）
 */
export async function getAMapLocation(options = {}) {
    const {
        enableHighAccuracy = true,
        timeout = 8000,
        maximumAge = 0,
        convert = true,
    } = options;

    if (AMAP_SECURITY_JS_CODE) {
        // eslint-disable-next-line no-underscore-dangle
        window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_JS_CODE };
    }

    const AMap = await AMapLoader.load({
        key: AMAP_JS_KEY,
        version: '2.0',
        plugins: ['AMap.Geolocation'],
    });

    return await new Promise((resolve, reject) => {
        const geolocation = new AMap.Geolocation({
            enableHighAccuracy,
            timeout,
            maximumAge,
            convert,
        });

        geolocation.getCurrentPosition((status, result) => {
            if (status !== 'complete') {
                reject(new Error(result?.message || result?.info || '定位失败，请稍后重试'));
                return;
            }
            const lng = result?.position?.lng;
            const lat = result?.position?.lat;
            const accuracy = result?.accuracy;

            if (typeof lng === 'number' && typeof lat === 'number') {
                resolve({ latitude: lat, longitude: lng, accuracy: accuracy ?? null });
                return;
            }
            reject(new Error('定位失败：未获取到有效经纬度'));
        });
    });
}

export default {
    getAMapLocation,
};
