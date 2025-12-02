import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ==========================================
// 1. 数据库配置
// ==========================================

const mouthData = {
    "Upper_Central_Incisor_L": { title: "左上中切牙", care: "功能：负责切割食物，辅助发音（如齿音），支撑上唇维持面部丰满度。防护：1. 它是门面担当，运动时建议佩戴护齿防外伤；2. 严禁当工具使用（如开瓶盖）；3. 刷牙时需呈45度角对准牙龈边缘震动清洁。" },
    "Upper_Central_Incisor_R": { title: "右上中切牙", care: "功能：负责切割食物，辅助发音（如齿音），支撑上唇维持面部丰满度。防护：1. 它是门面担当，运动时建议佩戴护齿防外伤；2. 严禁当工具使用（如开瓶盖）；3. 刷牙时需呈45度角对准牙龈边缘震动清洁。" },
    "Upper_Lateral_Incisor_L": { title: "左上侧切牙", care: "功能：辅助中切牙切割食物，维持牙弓弧度。防护：牙根较细且常有舌侧窝沟，易积存牙菌斑。建议重点使用牙线清洁与门牙的邻面缝隙，防止邻面龋。" },
    "Upper_Lateral_Incisor_R": { title: "右上侧切牙", care: "功能：辅助中切牙切割食物，维持牙弓弧度。防护：牙根较细且常有舌侧窝沟，易积存牙菌斑。建议重点使用牙线清洁与门牙的邻面缝隙，防止邻面龋。" },
    "Upper_Canine_L": { title: "左上尖牙 (虎牙)", care: "功能：牙根最长最稳固，负责撕裂肉类等强韧食物，支撑口角，被称为“口角的柱石”。防护：位于牙列转角处，刷牙易被遗漏。请务必倾斜牙刷45度，专门停留清洁此处，避免牙颈部楔状缺损。" },
    "Upper_Canine_R": { title: "右上尖牙 (虎牙)", care: "功能：牙根最长最稳固，负责撕裂肉类等强韧食物，支撑口角，被称为“口角的柱石”。防护：位于牙列转角处，刷牙易被遗漏。请务必倾斜牙刷45度，专门停留清洁此处，避免牙颈部楔状缺损。" },
    "Upper_Premolar_1_L": { title: "左上第一前磨牙", care: "功能：协助尖牙撕裂并在磨牙前初步捣碎食物。防护：常为双牙根，牙合面窝沟较深。建议餐后及时漱口，重点清洁窝沟处，防止食物嵌塞。" },
    "Upper_Premolar_1_R": { title: "右上第一前磨牙", care: "功能：协助尖牙撕裂并在磨牙前初步捣碎食物。防护：常为双牙根，牙合面窝沟较深。建议餐后及时漱口，重点清洁窝沟处，防止食物嵌塞。" },
    "Upper_Premolar_2_L": { title: "左上第二前磨牙", care: "功能：捣碎食物，分担咀嚼压力。防护：牙缝易卡食物纤维。建议每日晚餐后使用牙缝刷或牙线清洁间隙，预防牙龈乳头炎。" },
    "Upper_Premolar_2_R": { title: "右上第二前磨牙", care: "功能：捣碎食物，分担咀嚼压力。防护：牙缝易卡食物纤维。建议每日晚餐后使用牙缝刷或牙线清洁间隙，预防牙龈乳头炎。" },
    "Upper_Molar_1_L": { title: "左上第一磨牙", care: "功能：萌出最早（六龄齿），咀嚼效率最高，是确定咬合关系的关键牙。防护：窝沟复杂极易龋坏。务必进行窝沟封闭，刷牙时需覆盖到最后一颗牙的后方。" },
    "Upper_Molar_1_R": { title: "右上第一磨牙", care: "功能：萌出最早（六龄齿），咀嚼效率最高，是确定咬合关系的关键牙。防护：窝沟复杂极易龋坏。务必进行窝沟封闭，刷牙时需覆盖到最后一颗牙的后方。" },
    "Upper_Molar_2_L": { title: "左上第二磨牙", care: "功能：辅助第一磨牙研磨食物。防护：位置靠后，操作空间小，易引发咽反射。建议闭嘴微合，将牙刷伸到口腔最深处，确保刷头触及远中面。" },
    "Upper_Molar_2_R": { title: "右上第二磨牙", care: "功能：辅助第一磨牙研磨食物。防护：位置靠后，操作空间小，易引发咽反射。建议闭嘴微合，将牙刷伸到口腔最深处，确保刷头触及远中面。" },
    "Upper_Molar_3_L": { title: "左上智齿", care: "功能：现代人类多为退化器官，功能微弱。防护：极易阻生或伸长。如无对咬牙导致咬伤牙龈，或反复发炎，强烈建议咨询医生尽早拔除。" },
    "Upper_Molar_3_R": { title: "右上智齿", care: "功能：现代人类多为退化器官，功能微弱。防护：极易阻生或伸长。如无对咬牙导致咬伤牙龈，或反复发炎，强烈建议咨询医生尽早拔除。" },
    "Lower_Central_Incisor_L": { title: "左下中切牙", care: "功能：配合上前牙切割，发音。防护：全口体积最小，且舌侧接近舌下腺导管口，最易堆积牙结石。建议：必须每半年到一年洗牙一次，刷牙时需竖起刷头清洁内侧。" },
    "Lower_Central_Incisor_R": { title: "右下中切牙", care: "功能：配合上前牙切割，发音。防护：全口体积最小，且舌侧接近舌下腺导管口，最易堆积牙结石。建议：必须每半年到一年洗牙一次，刷牙时需竖起刷头清洁内侧。" },
    "Lower_Lateral_Incisor_L": { title: "左下侧切牙", care: "功能：辅助切断食物。防护：牙根扁平，邻面易发黑三角（牙龈萎缩）。建议：轻柔使用牙线，避免暴力压迫牙龈，保持邻面清洁。" },
    "Lower_Lateral_Incisor_R": { title: "右下侧切牙", care: "功能：辅助切断食物。防护：牙根扁平，邻面易发黑三角（牙龈萎缩）。建议：轻柔使用牙线，避免暴力压迫牙龈，保持邻面清洁。" },
    "Lower_Canine_L": { title: "左下尖牙", care: "功能：支撑下唇和口角，引导下颌运动轨迹。防护：牙颈部受力集中。建议：避免横向用力“拉锯式”刷牙，防止造成楔状缺损导致牙齿敏感。" },
    "Lower_Canine_R": { title: "右下尖牙", care: "功能：支撑下唇和口角，引导下颌运动轨迹。防护：牙颈部受力集中。建议：避免横向用力“拉锯式”刷牙，防止造成楔状缺损导致牙齿敏感。" },
    "Lower_Premolar_1_L": { title: "左下第一前磨牙", care: "功能：协助尖牙撕裂，辅助捣碎。防护：牙冠形态较小。建议：少吃粘性过大的糖果（如牛轧糖），防止粘掉补牙材料或损伤牙釉质。" },
    "Lower_Premolar_1_R": { title: "右下第一前磨牙", care: "功能：协助尖牙撕裂，辅助捣碎。防护：牙冠形态较小。建议：少吃粘性过大的糖果（如牛轧糖），防止粘掉补牙材料或损伤牙釉质。" },
    "Lower_Premolar_2_L": { title: "左下第二前磨牙", care: "功能：主要负责捣碎食物。防护：牙冠形态多变（二尖或三尖型），清洁死角多。建议：定期检查，预防牙龈炎和邻面龋坏。" },
    "Lower_Premolar_2_R": { title: "右下第二前磨牙", care: "功能：主要负责捣碎食物。防护：牙冠形态多变（二尖或三尖型），清洁死角多。建议：定期检查，预防牙龈炎和邻面龋坏。" },
    "Lower_Molar_1_L": { title: "左下第一磨牙", care: "功能：下颌咀嚼中心，全口关键的承重基石。防护：因重力作用食物易沉积。建议：儿童期做窝沟封闭，成人需保证每面刷牙时间，总时长至少3分钟。" },
    "Lower_Molar_1_R": { title: "右下第一磨牙", care: "功能：下颌咀嚼中心，全口关键的承重基石。防护：因重力作用食物易沉积。建议：儿童期做窝沟封闭，成人需保证每面刷牙时间，总时长至少3分钟。" },
    "Lower_Molar_2_L": { title: "左下第二磨牙", care: "功能：强力研磨食物。防护：常作为义齿的基牙，需特别保护。建议：使用含氟牙膏增强抗酸能力，定期检查是否有隐裂纹。" },
    "Lower_Molar_2_R": { title: "右下第二磨牙", care: "功能：强力研磨食物。防护：常作为义齿的基牙，需特别保护。建议：使用含氟牙膏增强抗酸能力，定期检查是否有隐裂纹。" },
    "Lower_Molar_3_L": { title: "左下智齿", care: "功能：多属退化器官。防护：此处牙龈易形成“盲袋”，藏污纳垢引发冠周炎。建议：使用冲牙器定点清洁，若反复肿痛、引起食物嵌塞应拔除。" },
    "Lower_Molar_3_R": { title: "右下智齿", care: "功能：多属退化器官。防护：此处牙龈易形成“盲袋”，藏污纳垢引发冠周炎。建议：使用冲牙器定点清洁，若反复肿痛、引起食物嵌塞应拔除。" }
};

const internalData = {
    "defaultMaterial": { title: "牙龈组织 (Gums)", care: "功能：覆盖牙槽骨，像“密封圈”一样紧紧包裹牙颈部，防御细菌侵入牙根。防护：1. 巴氏刷牙法清洁牙龈沟（牙齿与牙龈交界处）；2. 每日使用牙线防止邻面牙龈红肿出血；3. 牙龈出血是炎症信号，切勿因此停止刷牙，应就医洗牙。" },
    "defaultMaterial_5": { title: "牙齿主体 (Tooth Body)", care: "功能：外层牙釉质是人体最硬组织，负责抵抗磨损；内层牙本质构成主体并保护牙髓。防护：1. 坚持使用含氟牙膏促进釉质再矿化；2. 减少碳酸饮料和酸性食物摄入防止酸蚀症；3. 若出现冷热酸痛，提示釉质缺损，需抗敏治疗或充填。" },
    "defaultMaterial_4": { title: "牙髓腔/根管 (Pulp Chamber)", care: "功能：位于牙齿核心的空腔，容纳神经和血管，是牙齿感觉和营养的“心脏”。防护：1. 龋病（蛀牙）若不及时修补，细菌侵入此处会引发牙髓炎（剧痛）；2. 牙髓炎多不可逆，需进行根管治疗；3. 避免牙齿受外伤撞击导致牙髓坏死。" },
    "defaultMaterial_3": { title: "动脉 (Artery)", care: "功能：将富含氧气和营养物质的鲜红血液输入牙齿内部，维持牙齿的生命力与代谢。防护：保持良好的全身血液循环；牙齿受外伤（如跌倒磕碰）可能导致动脉断裂，使牙齿失去营养供应而逐渐变黑坏死。" },
    "OdefaultMaterial_2": { title: "静脉 (Vein)", care: "功能：回收代谢废物和二氧化碳，将其运出牙齿，调节髓腔内的压力。防护：当牙髓发炎充血时，静脉回流受阻会导致坚硬的牙齿内部压力剧增，从而产生难以忍受的跳痛，此时必须开髓减压。" },
    "ObjeOdefaultMaterial_1": { title: "毛细血管 (Capillaries)", care: "功能：连接微动脉与微静脉的网状结构，直接为成牙本质细胞输送营养，支持牙本质的缓慢修复。防护：牙周健康直接影响血液供应，严重的牙周病可能导致牙髓逆行性感染，因此需定期进行牙周维护。" }
};

// 静态配置，避免重渲染
const mouthCameraPos = { x: 0, y: 0, z: 8 };
const internalCameraPos = { x: 0, y: 0, z: 6 };
const internalModelRotation = { x: 0, y: -Math.PI / 2 + Math.PI, z: 0 };
const defaultRotation = { x: 0, y: 0, z: 0 };

// 文案格式化工具
const formatCareContent = (text = '') => {
    if (!text) {
        return { functionDesc: '', protectionDesc: '', suggestions: [] };
    }

    const normalized = text
        .replace(/\s+/g, ' ')
        .replace(/护理建议：/g, '建议：')
        .trim();

    let functionDesc = '';
    let remaining = normalized;

    if (normalized.includes('功能：')) {
        const [, afterFunction] = normalized.split('功能：');
        if (afterFunction) {
            const [functionPart, rest = ''] = afterFunction.split('防护：');
            functionDesc = (functionPart || '').trim();
            remaining = rest.trim();
        }
    }

    let protectionDesc = '';
    let suggestionRaw = '';

    if (remaining.includes('建议：')) {
        const [protectPart, suggestionPart = ''] = remaining.split('建议：');
        protectionDesc = protectPart.trim();
        suggestionRaw = suggestionPart.trim();
    } else {
        protectionDesc = remaining.trim();
    }

    const suggestions = suggestionRaw
        .split(/[；;。]/)
        .map(item => item.replace(/^[0-9.、\-\s]+/, '').trim())
        .filter(Boolean);

    return {
        functionDesc,
        protectionDesc,
        suggestions
    };
};

// ==========================================
// 2. 单个 3D 视口组件 (封装 Three.js 逻辑)
// ==========================================

const DentalViewport = ({ containerRef, modelPath, dataSet, cameraPos, modelRotation, onSelect }) => {
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const modelRef = useRef(null);
    const raycasterRef = useRef(null);
    const mouseRef = useRef(null);
    const selectedObjectRef = useRef(null);
    const originalMaterialRef = useRef(null);
    const highlightMatRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        // 防止 React StrictMode 下重复初始化
        if (rendererRef.current) return;

        const container = containerRef.current;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        raycasterRef.current = raycaster;
        mouseRef.current = mouse;

        // 1. 初始化场景
        const scene = new THREE.Scene();
        scene.background = null; // 透明背景，露出 CSS 渐变
        sceneRef.current = scene;

        // 2. 初始化相机
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
        cameraRef.current = camera;

        // 3. 初始化渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.useLegacyLights = false;
        renderer.toneMapping = THREE.LinearToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. 灯光设置 (手术室级纯白光照)
        const ambientLight = new THREE.AmbientLight(0xffffff, 3.5);
        scene.add(ambientLight);
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(2, 5, 10);
        scene.add(mainLight);

        // 5. 控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 20;
        controlsRef.current = controls;

        // 高亮材质
        const highlightMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x004444,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        highlightMatRef.current = highlightMat;

        // 6. 加载模型
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;
                modelRef.current = model;

                // 自动居中与缩放
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 4.5 / maxDim;

                model.scale.set(scale, scale, scale);
                model.position.x = -center.x * scale;
                model.position.y = -center.y * scale;
                model.position.z = -center.z * scale;

                // 应用特定的旋转
                model.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z);

                scene.add(model);

                // 材质美白处理
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.side = THREE.DoubleSide;
                        child.material.color.setHex(0xffffff); // 强制纯白
                        child.material.roughness = 0.5;
                        child.material.metalness = 0.0;
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                });
            },
            undefined,
            (error) => {
                console.error("Model load error:", error);
            }
        );

        // 7. 交互逻辑 (handleClick)
        const findValidPart = (object) => {
            let current = object;
            while (current) {
                if (current.name && dataSet[current.name]) {
                    return current;
                }
                current = current.parent;
            }
            return null;
        };

        const handleClick = (event) => {
            if (!modelRef.current) return;

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(modelRef.current.children, true);

            // 核心逻辑：只允许点击在数据库中存在的部位
            if (intersects.length > 0) {
                // 查找第一个在 dataSet 中有定义的物体（向上追溯父级）
                const validHit = intersects
                    .map(hit => ({ mesh: hit.object, matched: findValidPart(hit.object) }))
                    .find(item => item.matched);

                if (validHit) {
                    // 如果找到了匹配的父级，就高亮父级；否则高亮当前网格
                    selectObject(validHit.matched || validHit.mesh);
                } else {
                    console.log("点击了未定义部位，忽略响应");
                }
            } else {
                // 点击背景取消选中
                deselectObject();
                if (onSelect) onSelect(null);
            }
        };

        const selectObject = (object) => {
            if (selectedObjectRef.current === object) return;

            // 还原旧的
            if (selectedObjectRef.current && originalMaterialRef.current) {
                selectedObjectRef.current.material = originalMaterialRef.current;
            }

            // 选中新的
            selectedObjectRef.current = object;
            originalMaterialRef.current = object.material;
            object.material = highlightMat;

            // 触发回调
            const info = dataSet[object.name];
            if (info && onSelect) {
                onSelect(info);
            }
        };

        const deselectObject = () => {
            if (selectedObjectRef.current && originalMaterialRef.current) {
                selectedObjectRef.current.material = originalMaterialRef.current;
                selectedObjectRef.current = null;
            }
        };

        // 绑定事件
        renderer.domElement.addEventListener('click', handleClick);
        renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.changedTouches.length > 0) handleClick(e.changedTouches[0]);
        }, { passive: false });

        // 动画循环
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // 窗口大小调整
        const handleResize = () => {
            if (!container || !camera || !renderer) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // 清理函数
        return () => {
            window.removeEventListener('resize', handleResize);
            if (renderer.domElement) {
                renderer.domElement.removeEventListener('click', handleClick);
                renderer.domElement.remove(); // 移除 Canvas
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            renderer.dispose();
            rendererRef.current = null; // 重置引用
        };
    }, [modelPath, dataSet, cameraPos, modelRotation, onSelect]);

    return null;
};

// ==========================================
// 3. 主页面组件 (包含 Tab 切换和 UI)
// ==========================================

const ThreeDModelPage = () => {
    const mouthViewRef = useRef(null);
    const internalViewRef = useRef(null);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 模拟加载
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleSelect = useCallback((info) => {
        setSelectedInfo(info);
    }, []);

    const handleClosePanel = () => {
        setSelectedInfo(null);
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'radial-gradient(circle at center, #1a2a3a 0%, #050810 100%)',
            color: '#fff',
            fontFamily: '"Microsoft YaHei", "Heiti SC", sans-serif',
            overflow: 'hidden'
        }}>
            {/* --- 1. 顶部 Header --- */}
            <div style={{
                background: 'rgba(5, 8, 16, 0.8)',
                borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '10px',
                flexShrink: 0
            }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h1 style={{
                        color: '#e0f7ff',
                        fontSize: '22px',
                        margin: 0,
                        textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                        letterSpacing: '2px',
                        fontWeight: 'normal'
                    }}>
                        3D 数字化口腔健康
                    </h1>
                    <span style={{ fontSize: '10px', color: '#00f0ff', letterSpacing: '4px', opacity: 0.8, display: 'block', marginTop: '4px' }}>
                        全方位口腔解剖与护理指南
                    </span>
                </div>
            </div>

            {/* --- 2. 内容区域 --- */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                
                {/* 3D 视图 */}
                <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
                }}>
                    {loading && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: 30, pointerEvents: 'none', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '8px',
                            color: '#00f0ff', letterSpacing: '2px', fontSize: '14px'
                        }}>
                            系统资源加载中...
                        </div>
                    )}

                    {/* 左视口 */}
                    <div ref={mouthViewRef} style={{
                        flex: 1,
                        position: 'relative',
                        borderRight: window.innerWidth <= 768 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderBottom: window.innerWidth <= 768 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                    }}>
                        <div style={{
                            position: 'absolute', top: '20px', left: '20px', fontSize: '14px', color: '#00f0ff',
                            background: 'rgba(0, 0, 0, 0.6)', padding: '5px 12px', borderRadius: '20px',
                            border: '1px solid rgba(0, 240, 255, 0.3)', pointerEvents: 'none', zIndex: 5, letterSpacing: '1px'
                        }}>
                            01. 全口牙列展示
                        </div>
                        <DentalViewport
                            containerRef={mouthViewRef}
                            modelPath="/models/mouth_fixed.glb"
                            dataSet={mouthData}
                            cameraPos={mouthCameraPos}
                            modelRotation={defaultRotation}
                            onSelect={handleSelect}
                        />
                    </div>

                    {/* 右视口 */}
                    <div ref={internalViewRef} style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                            position: 'absolute', top: '20px', left: '20px', fontSize: '14px', color: '#00f0ff',
                            background: 'rgba(0, 0, 0, 0.6)', padding: '5px 12px', borderRadius: '20px',
                            border: '1px solid rgba(0, 240, 255, 0.3)', pointerEvents: 'none', zIndex: 5, letterSpacing: '1px'
                        }}>
                            02. 牙齿微观解剖
                        </div>
                        <DentalViewport
                            containerRef={internalViewRef}
                            modelPath="/models/inside_my_tooth.glb"
                            dataSet={internalData}
                            cameraPos={internalCameraPos}
                            modelRotation={internalModelRotation}
                            onSelect={handleSelect}
                        />
                    </div>

                    {/* 悬浮信息面板 */}
                    {selectedInfo && (
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            width: '340px',
                            padding: '24px 26px',
                            background: 'rgba(2, 10, 18, 0.95)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            boxShadow: '0 25px 55px rgba(0, 0, 0, 0.75)',
                            borderRadius: '18px',
                            backdropFilter: 'blur(14px)',
                            zIndex: 20,
                            animation: 'fadeIn 0.25s ease-out'
                        }}>
                            <button
                                onClick={handleClosePanel}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '18px',
                                    cursor: 'pointer',
                                    color: '#6f7f92',
                                    fontSize: '18px',
                                    background: 'transparent',
                                    border: 'none'
                                }}
                                title="关闭"
                            >
                                ×
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
                                    border: '1px solid rgba(0, 240, 255, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#00f0ff',
                                    fontWeight: 'bold',
                                    fontSize: '16px'
                                }}>
                                    {selectedInfo.title.slice(0, 1)}
                                </div>
                                <div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '17px',
                                        color: '#f6ffff',
                                        fontWeight: 600,
                                        letterSpacing: '0.6px'
                                    }}>
                                        {selectedInfo.title}
                                    </p>
                                    <span style={{ fontSize: '11px', color: '#7fb8d0', letterSpacing: '1.5px' }}>
                                        FUNCTION · PROTECTION · CARE
                                    </span>
                                </div>
                            </div>
                            {(() => {
                                const { functionDesc, protectionDesc, suggestions } = formatCareContent(selectedInfo.care);
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {functionDesc && (
                                            <section style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f0ff', display: 'inline-block' }}></span>
                                                    <span style={{ fontSize: '12px', color: '#8fd2e7', letterSpacing: '1px' }}>功能识别</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#dfeef6', lineHeight: '1.6' }}>
                                                    {functionDesc}
                                                </p>
                                            </section>
                                        )}
                                        {protectionDesc && (
                                            <section style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffb347', display: 'inline-block' }}></span>
                                                    <span style={{ fontSize: '12px', color: '#ffc78f', letterSpacing: '1px' }}>防护重点</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#ffe9d1', lineHeight: '1.6' }}>
                                                    {protectionDesc}
                                                </p>
                                            </section>
                                        )}
                                        {suggestions.length > 0 && (
                                            <section>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                                                    <span style={{ fontSize: '12px', color: '#8cdca7', letterSpacing: '1px' }}>护理步骤</span>
                                                </div>
                                                <ul style={{
                                                    listStyle: 'none',
                                                    padding: 0,
                                                    margin: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '9px'
                                                }}>
                                                    {suggestions.map((tip, index) => (
                                                        <li key={index} style={{
                                                            fontSize: '13px',
                                                            color: '#eafcf4',
                                                            lineHeight: '1.5',
                                                            background: 'rgba(74, 222, 128, 0.08)',
                                                            borderRadius: '8px',
                                                            padding: '8px 10px',
                                                            border: '1px solid rgba(74, 222, 128, 0.2)'
                                                        }}>
                                                            {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

            </div>

            {/* 动画样式 */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ThreeDModelPage;