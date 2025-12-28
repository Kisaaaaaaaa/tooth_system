# 牙科预约管理系统（前端）

React + Vite 构建的单页应用，提供预约、问诊、医生日程等牙科业务的用户界面。项目支持桌面端与移动端自适应，集成地图选址、AI 问诊、3D 牙齿模型等功能模块。

## 技术栈
- React 18 + React Router 7（前端框架与路由）
- Vite 4（开发与构建工具）
- Tailwind CSS 3（样式与原子化类）
- lucide-react（图标库）
- three.js（3D 场景/牙齿模型）
- @amap/amap-jsapi-loader（高德地图加载器）

## 功能概览
- 医院与医生浏览：列表、筛选、排行榜等视图
- 预约管理：创建、查看、签到/取消等操作
- 在线问诊：聊天记录与会话展示（AI 问诊入口）
- 就诊档案：历史记录与分析展示
- 医生排班：医生个人日程与时间段管理
- 3D 牙齿模型与地图选址：科技感展示与位置选择

## 快速开始
1) 安装依赖（Node.js 16+）
```bash
npm install
# 或 pnpm i / yarn
```
2) 启动开发服务器
```bash
npm run dev
```
3) 访问地址
- 默认本地端口：http://localhost:3000/
- 若端口被占用，Vite 会自动顺延，请以终端提示为准。

## 可用脚本
- `npm run dev`：启动开发环境（HMR 热更新）
- `npm run build`：构建生产包
- `npm run preview`：本地预览构建产物

## 目录结构（核心）
```
牙科预约管理系统/
├─ src/
│  ├─ api/                # 前后端接口封装（预约、医生、医院、AI 等）
│  ├─ components/         # 业务组件与页面模块
│  ├─ data/               # 模拟数据与数据出口
│  ├─ styles/             # 全局样式（Tailwind + 自定义）
│  ├─ App.jsx             # 应用入口与路由挂载
│  └─ main.jsx            # Vite 入口
├─ public/                # 静态资源（images、models 等）
├─ package.json           # 项目脚本与依赖
├─ vite.config.js         # Vite 配置
├─ tailwind.config.js     # Tailwind 配置
└─ 运行说明.md            # 运行指引（简版）
```

### 主要目录说明
- [src/api](src/api)：REST 请求封装，按业务域划分文件（如 appointments、doctors、records、ai 等）。
- [src/components](src/components)：功能组件与页面片段，包含医生排班、预约卡片、导航等业务模块。
- [src/data](src/data)：模拟数据与索引，便于无后端时联调与展示。
- [src/styles](src/styles)：全局样式与 Tailwind 定制，项目统一的视觉规则入口。
- [src/App.jsx](src/App.jsx)：应用路由与页面装配。
- [src/main.jsx](src/main.jsx)：挂载 React 应用、引入全局样式。
- [public](public)：静态资源目录，部署时会被直接复制。

## 开发提示
- Tailwind 已按 Vite 预设接入，可直接在 className 中使用原子类。
- 修改代码后支持热更新；若样式异常，可重启 `npm run dev`。
- 若需要地图能力，请在对应组件中配置高德 Key（参照 @amap/amap-jsapi-loader 官方用法）。
- 构建前可运行 `npm install --registry https://registry.npmmirror.com` 以提升国内安装速度。

## 常见问题
- 端口占用：终端提示新的端口号，按提示访问即可。
- 依赖安装失败：检查 Node 版本与网络，必要时切换镜像源。
- 样式缺失：确认 Tailwind 依赖已安装，并检查 [src/styles](src/styles) 是否被正确引入。

## 相关文档
- 运行步骤与截图可参考 [运行说明.md](运行说明.md)

> 如需与后端联调，请根据后端部署地址调整接口基础路径，或在 Vite 配置中添加代理。

