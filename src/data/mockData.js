// --- 模拟数据 ---
export const MOCK_HOSPITALS = [
    {id: 1, name: "未来牙科中心总院", distance: 1.2, address: "科技园区大道88号", tags: ["常去", "三甲"],
     image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400"},
    {id: 2, name: "社区口腔服务站", distance: 0.5, address: "幸福里小区东门", tags: ["最近", "社区"],
     image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400"},
    {id: 3, name: "高端种植牙专科", distance: 5.8, address: "金融中心B座", tags: ["专家"],
     image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"},
];

export const MOCK_DOCTORS = [
    {id: 1, name: "张智齿", title: "主任医师", score: 4.9, specialty: "复杂拔牙",
     avatar: "https://i.pravatar.cc/150?u=1", reviews: 120},
    {id: 2, name: "李正畸", title: "副主任医师", score: 4.8, specialty: "隐形矫正",
     avatar: "https://i.pravatar.cc/150?u=2", reviews: 98},
    {id: 3, name: "王洁牙", title: "主治医师", score: 4.7, specialty: "牙周治疗",
     avatar: "https://i.pravatar.cc/150?u=3", reviews: 250},
    {id: 4, name: "赵种植", title: "教授", score: 5.0, specialty: "全口种植", avatar: "https://i.pravatar.cc/150?u=4",
     reviews: 88},
];

export const MOCK_APPOINTMENTS = [
    {id: 101, doctorId: 1, date: "2023-10-28", time: "14:30", status: "completed",
     hospital: "未来牙科中心总院"},
    {id: 102, doctorId: 2, date: "2023-11-15", time: "09:00", status: "cancelled",
     hospital: "未来牙科中心总院"},
    {id: 103, doctorId: 3, date: "2023-12-05", time: "10:00", status: "upcoming",
     hospital: "社区口腔服务站"},
];

export const MOCK_RECORDS = [
    {id: 201, date: "2023-10-28", doctor: "张智齿", diagnosis: "左下阻生智齿", content: "建议微创拔除，术后注意冰敷。",
     resultImage: "dental_xray_mock", rated: false},
    {id: 202, date: "2023-05-12", doctor: "王洁牙", diagnosis: "牙龈炎", content: "进行了全口洁治，牙龈红肿消退。",
     resultImage: "dental_clean_mock", rated: true, rating: 5},
];

export const MOCK_CHAT_HISTORY = [
    {id: 1, sender: 'doctor', text: '你好，请问牙齿哪里不舒服？', time: '10:00'},
    {id: 2, sender: 'user', text: '右边后面的一颗牙咬东西有点酸。', time: '10:02'},
    {id: 3, sender: 'doctor', text: '持续多久了？这是之前的X光片显示的区域吗？', time: '10:03'},
];

