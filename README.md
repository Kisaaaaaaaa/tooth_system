# 牙科预约管理系统 - 前端项目结构

##  项目目录结构

牙科预约管理系统/
├── src/
│   ├── data/                    # 数据层
│   │   ├── mockData.js         # 模拟数据（医院、医生、预约、病历等）
│   │   └── index.js            # 数据统一导出
│   │
│   ├── components/              # 组件层
│   │   ├── common/              # 通用组件
│   │   │   └── TechToothModel.jsx    # 3D牙齿模型组件
│   │   │
│   │   ├── pages/               # 页面组件
│   │   │   ├── HomePage.jsx           # 首页
│   │   │   ├── HospitalsPage.jsx      # 医院列表页
│   │   │   ├── DoctorsPage.jsx        # 医生列表页
│   │   │   ├── ConsultationPage.jsx    # 在线问诊页
│   │   │   ├── AppointmentsPage.jsx    # 预约管理页
│   │   │   ├── RecordsPage.jsx         # 就诊档案页
│   │   │   └── index.js                # 页面组件统一导出
│   │   │
│   │   └── layout/              # 布局组件
│   │       ├── Navbar.jsx              # 顶部导航栏
│   │       ├── BottomNav.jsx           # 移动端底部导航
│   │       └── index.js                # 布局组件统一导出
│   │
│   ├── styles/                  # 样式文件
│   │   └── global.css           # 全局样式和动画
│   │
│   └── App.jsx                  # 主应用入口
│
└── README.md                    # 项目说明文档
```

##  模块说明

### 1. 数据层 (data/)
- **mockData.js**: 集中管理所有模拟数据
  - `MOCK_HOSPITALS`: 医院数据
  - `MOCK_DOCTORS`: 医生数据
  - `MOCK_APPOINTMENTS`: 预约数据
  - `MOCK_RECORDS`: 就诊记录数据
  - `MOCK_CHAT_HISTORY`: 聊天历史数据

### 2. 通用组件 (components/common/)
- **TechToothModel.jsx**: 3D科技感牙齿模型展示组件

### 3. 页面组件 (components/pages/)
每个页面组件都是独立的，便于单独开发和维护：
- **HomePage.jsx**: 首页，包含快捷功能和系统概况
- **HospitalsPage.jsx**: 医院列表页，支持筛选功能
- **DoctorsPage.jsx**: 医生列表页，支持排行榜视图
- **ConsultationPage.jsx**: 在线问诊页，包含聊天功能
- **AppointmentsPage.jsx**: 预约管理页，支持签到和取消
- **RecordsPage.jsx**: 就诊档案页，包含AI分析功能

### 4. 布局组件 (components/layout/)
- **Navbar.jsx**: 顶部导航栏（桌面端）
- **BottomNav.jsx**: 底部导航栏（移动端）

### 5. 样式文件 (styles/)
- **global.css**: 全局样式、动画效果、3D模型样式

### 6. 主应用 (App.jsx)
- 路由管理
- 状态管理
- 页面渲染

## 开发规范

### 导入规范
```javascript
// 1. React 相关
import React, { useState } from 'react';

// 2. 第三方库
import { Icon } from 'lucide-react';

// 3. 数据（推荐使用索引文件）
import { MOCK_HOSPITALS, MOCK_DOCTORS } from '../../data';
// 或直接导入
import { MOCK_DATA } from '../../data/mockData';

// 4. 组件（推荐使用索引文件）
import { HomePage, HospitalsPage } from '../pages';
import { Navbar, BottomNav } from '../layout';
// 或直接导入
import Component from '../path/to/Component';

// 5. 样式
import '../styles/global.css';
```

### 组件导出规范
```javascript
// 使用默认导出
export default ComponentName;
```

### 命名规范
- 组件文件：PascalCase (如 `HomePage.jsx`)
- 数据文件：camelCase (如 `mockData.js`)
- 样式文件：kebab-case (如 `global.css`)

##  协同开发建议

1. **数据层**: 由后端或数据团队维护 `mockData.js`
2. **页面组件**: 每个开发者可以独立负责一个或多个页面组件
3. **通用组件**: 由UI/UX团队统一维护
4. **布局组件**: 由前端架构师维护
5. **样式**: 统一使用 Tailwind CSS，全局样式在 `global.css` 中

## 🚀 运行项目

### 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **查看效果**
   - 浏览器会自动打开 `http://localhost:3000/`
   - 如果没有自动打开，请手动访问该地址

### 其他命令

- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产版本

> 📖 详细运行说明请查看 [运行说明.md](./运行说明.md)

## 📦 使用方式

### 基本使用
在主入口文件中导入：
```javascript
import DentalApp from './App';
```

### 使用索引文件（推荐）
```javascript
// 导入页面组件
import { HomePage, HospitalsPage } from './components/pages';

// 导入布局组件
import { Navbar, BottomNav } from './components/layout';

// 导入数据
import { MOCK_HOSPITALS, MOCK_DOCTORS } from './data';
```

## 📦 模块化优势

1. **职责分离**: 每个模块只负责自己的功能
2. **易于维护**: 修改某个页面不影响其他模块
3. **便于测试**: 可以单独测试每个组件
4. **团队协作**: 不同开发者可以同时开发不同模块
5. **代码复用**: 通用组件可以在多个地方使用
6. **清晰结构**: 文件组织清晰，易于查找和理解

## 📝 注意事项

- 所有组件使用函数式组件和 Hooks
- 样式使用 Tailwind CSS 类名
- 数据通过 props 传递，避免全局状态（当前版本）
- 保持组件的单一职责原则

