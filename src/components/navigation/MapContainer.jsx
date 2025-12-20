import { useEffect, useRef } from "react";
import styles from "./MapContainer.css";
import AMapLoader from "@amap/amap-jsapi-loader";

// 这是一个“只负责初始化地图”的基础组件：
// - 使用 JS API Loader 异步加载 AMap
// - 初始化 AMap.Map
// - 组件卸载时 destroy
export default function MapContainer({
    amapKey = "aeb7d6496f12243836e1f9b2e7a4d09e",
    securityJsCode = "fe0b576d771bdbca003b95d5081fe647",
    height = 360,
    center = [116.397428, 39.90923],
    zoom = 11,
    plugins = ["AMap.Scale"],
    onMapReady,
    onError,
    containerId = "container",
}) {
    const mapRef = useRef(null);

    useEffect(() => {
        let destroyed = false;


        if (securityJsCode) {
            window._AMapSecurityConfig = {
                securityJsCode,
            };
        }

        AMapLoader.load({
            key: amapKey,
            version: "2.0",
            plugins,
        })
            .then((AMap) => {
                if (destroyed) return;

                mapRef.current = new AMap.Map(containerId, {
                    viewMode: "3D",
                    zoom,
                    center,
                });

                onMapReady?.({ AMap, map: mapRef.current });
            })
            .catch((e) => {
                onError?.(e);
                // eslint-disable-next-line no-console
                console.log(e);
            });

        return () => {
            destroyed = true;
            mapRef.current?.destroy();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            id={containerId}
            className={styles.container}
            style={{ height: typeof height === "number" ? `${height}px` : height }}
        ></div>
    );
}
