// --- 模拟数据 ---
export const MOCK_HOSPITALS = [
    {
        id: 1,
        name: "武汉口腔医院总院",
        distance: 1.2,
        address: "武汉市江汉区解放大道627号",
        district: "江汉区",
        phone: "027-82860000",
        tags: ["常去", "三甲"],
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400",
        introduction: "武汉口腔医院总院是武汉市规模最大的口腔专科医院，提供全方位的口腔医疗服务。",
        doctors: [
            {
                id: 1, name: "张智齿", title: "主任医师", score: 4.9, specialty: "复杂拔牙、阻生智齿拔除", avatar: "https://i.pravatar.cc/150?u=1", reviews: 120, reviewsData: [
                    { id: 1, content: "张医生技术非常好，拔除阻生智齿一点都不疼，恢复得也很快！", rating: 5, date: "2024-01-15", patient: "王先生" },
                    { id: 2, content: "主任医师果然名不虚传，经验丰富，讲解也很清楚。", rating: 5, date: "2024-01-10", patient: "李女士" },
                    { id: 3, content: "服务态度好，技术精湛，值得推荐！", rating: 4, date: "2024-01-05", patient: "刘先生" }
                ]
            },
            {
                id: 2, name: "李正畸", title: "副主任医师", score: 4.8, specialty: "隐形矫正、传统矫正", avatar: "https://i.pravatar.cc/150?u=2", reviews: 98, reviewsData: [
                    { id: 1, content: "李医生矫正技术很棒，现在牙齿变得很整齐，非常满意！", rating: 5, date: "2024-01-12", patient: "陈女士" },
                    { id: 2, content: "隐形矫正几乎看不出来，李医生很专业，态度也很好。", rating: 4, date: "2024-01-08", patient: "张先生" },
                    { id: 3, content: "矫正过程很顺利，李医生会定期跟进，效果很好。", rating: 5, date: "2024-01-03", patient: "王女士" }
                ]
            },
            {
                id: 3, name: "王洁牙", title: "主治医师", score: 4.7, specialty: "牙周治疗、全口洁治", avatar: "https://i.pravatar.cc/150?u=3", reviews: 250, reviewsData: [
                    { id: 1, content: "王医生洁牙很细致，牙齿变得很干净，没有任何不适。", rating: 5, date: "2024-01-14", patient: "赵先生" },
                    { id: 2, content: "牙周治疗后牙龈出血的问题得到了明显改善。", rating: 4, date: "2024-01-09", patient: "孙女士" },
                    { id: 3, content: "服务态度很好，技术也不错，推荐！", rating: 4, date: "2024-01-04", patient: "周先生" }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "江岸区口腔服务中心",
        distance: 0.5,
        address: "武汉市江岸区中山大道1234号",
        district: "江岸区",
        phone: "027-82771111",
        tags: ["最近", "社区"],
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400",
        introduction: "江岸区口腔服务中心致力于为社区居民提供便捷、优质的口腔医疗服务。",
        doctors: [
            {
                id: 4, name: "赵种植", title: "教授", score: 5.0, specialty: "全口种植、半口种植", avatar: "https://i.pravatar.cc/150?u=4", reviews: 88, reviewsData: [
                    { id: 1, content: "赵教授种牙技术一流，完全感觉不到疼痛，效果非常好！", rating: 5, date: "2024-01-17", patient: "许先生" },
                    { id: 2, content: "设备先进，环境舒适，赵教授经验丰富，值得信赖。", rating: 5, date: "2024-01-12", patient: "何女士" },
                    { id: 3, content: "种牙后的牙齿非常自然，咀嚼功能恢复得很好。", rating: 5, date: "2024-01-07", patient: "吕先生" }
                ]
            },
            {
                id: 5, name: "钱修复", title: "主治医师", score: 4.6, specialty: "牙齿修复、烤瓷牙", avatar: "https://i.pravatar.cc/150?u=5", reviews: 156, reviewsData: [
                    { id: 1, content: "钱医生修复技术很好，牙齿看起来很自然，非常满意。", rating: 4, date: "2024-01-15", patient: "施女士" },
                    { id: 2, content: "态度认真负责，修复过程很顺利。", rating: 4, date: "2024-01-10", patient: "张女士" },
                    { id: 3, content: "专业水平高，解答问题耐心细致。", rating: 4, date: "2024-01-05", patient: "孔先生" }
                ]
            },
            {
                id: 6, name: "孙儿童", title: "副主任医师", score: 4.9, specialty: "儿童口腔、窝沟封闭", avatar: "https://i.pravatar.cc/150?u=6", reviews: 203, reviewsData: [
                    { id: 1, content: "孙医生对孩子特别有耐心，孩子本来很害怕，现在反而很愿意来。", rating: 5, date: "2024-01-16", patient: "朱女士" },
                    { id: 2, content: "窝沟封闭做得很好，孙医生讲解得很清楚。", rating: 5, date: "2024-01-11", patient: "秦先生" },
                    { id: 3, content: "儿童口腔治疗很专业，环境也适合孩子。", rating: 4, date: "2024-01-06", patient: "尤先生" }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "硚口区种植牙专科",
        distance: 5.8,
        address: "武汉市硚口区武胜路88号",
        district: "硚口区",
        phone: "027-83782222",
        tags: ["专家"],
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400",
        introduction: "硚口区种植牙专科专注于种植牙技术，拥有先进的设备和专业的医疗团队。",
        doctors: [
            {
                id: 7, name: "周种植", title: "主任医师", score: 4.9, specialty: "即刻种植、美学种植", avatar: "https://i.pravatar.cc/150?u=7", reviews: 189, reviewsData: [
                    { id: 1, content: "周医生种植技术精湛，当天就可以吃东西了，效果很好！", rating: 5, date: "2024-01-18", patient: "蒋先生" },
                    { id: 2, content: "美学种植的效果超出预期，非常自然美观。", rating: 5, date: "2024-01-13", patient: "沈女士" },
                    { id: 3, content: "周医生经验丰富，种植过程很顺利。", rating: 4, date: "2024-01-08", patient: "韩先生" }
                ]
            },
            {
                id: 8, name: "吴正畸", title: "副主任医师", score: 4.7, specialty: "舌侧矫正、隐形矫正", avatar: "https://i.pravatar.cc/150?u=8", reviews: 145, reviewsData: [
                    { id: 1, content: "吴医生舌侧矫正技术很好，矫正效果很满意。", rating: 4, date: "2024-01-15", patient: "杨女士" },
                    { id: 2, content: "隐形矫正方便美观，吴医生很专业。", rating: 4, date: "2024-01-10", patient: "朱先生" },
                    { id: 3, content: "矫正过程中遇到的问题吴医生都能及时解决。", rating: 4, date: "2024-01-05", patient: "秦女士" }
                ]
            },
            {
                id: 9, name: "郑牙周", title: "主治医师", score: 4.8, specialty: "牙周手术、牙周维护", avatar: "https://i.pravatar.cc/150?u=9", reviews: 212, reviewsData: [
                    { id: 1, content: "郑医生牙周手术技术很好，术后恢复很快。", rating: 5, date: "2024-01-16", patient: "尤先生" },
                    { id: 2, content: "牙周维护做得很细致，牙龈状况明显改善。", rating: 4, date: "2024-01-11", patient: "许女士" },
                    { id: 3, content: "服务态度好，技术专业，推荐！", rating: 4, date: "2024-01-06", patient: "何先生" }
                ]
            }
        ]
    },
    {
        id: 4,
        name: "汉阳口腔医院",
        distance: 3.2,
        address: "武汉市汉阳区汉阳大道630号",
        district: "汉阳区",
        phone: "027-84883333",
        tags: ["三甲"],
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 5,
        name: "武昌区牙科诊所",
        distance: 2.5,
        address: "武汉市武昌区中南路34号",
        district: "武昌区",
        phone: "027-87874444",
        tags: ["最近"],
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 6,
        name: "青山口腔医院",
        distance: 7.8,
        address: "武汉市青山区和平大道1290号",
        district: "青山区",
        phone: "027-86865555",
        tags: ["专家"],
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 7,
        name: "洪山区口腔医院",
        distance: 4.1,
        address: "武汉市洪山区珞喻路1037号",
        district: "洪山区",
        phone: "027-87546666",
        tags: ["常去"],
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 8,
        name: "东西湖区口腔诊所",
        distance: 9.5,
        address: "武汉市东西湖区吴家山七雄路100号",
        district: "东西湖区",
        phone: "027-83257777",
        tags: ["社区"],
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 9,
        name: "汉南区口腔医院",
        distance: 25.3,
        address: "武汉市汉南区纱帽正街120号",
        district: "汉南区",
        phone: "027-84858888",
        tags: ["专家"],
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 10,
        name: "蔡甸区口腔服务中心",
        distance: 18.7,
        address: "武汉市蔡甸区蔡甸大街151号",
        district: "蔡甸区",
        phone: "027-84999999",
        tags: ["最近"],
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 11,
        name: "江夏区口腔医院",
        distance: 22.4,
        address: "武汉市江夏区纸坊大街89号",
        district: "江夏区",
        phone: "027-87951111",
        tags: ["三甲"],
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 12,
        name: "黄陂区口腔诊所",
        distance: 30.1,
        address: "武汉市黄陂区前川大道200号",
        district: "黄陂区",
        phone: "027-85932222",
        tags: ["社区"],
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 13,
        name: "新洲区口腔医院",
        distance: 35.6,
        address: "武汉市新洲区邾城街齐安大道120号",
        district: "新洲区",
        phone: "027-86923333",
        tags: ["专家"],
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"
    },
];

export const MOCK_DOCTORS = [
    {
        id: 1, name: "张智齿", title: "主任医师", score: 4.9, specialty: "复杂拔牙",
        avatar: "https://i.pravatar.cc/150?u=1", reviews: 120
    },
    {
        id: 2, name: "李正畸", title: "副主任医师", score: 4.8, specialty: "隐形矫正",
        avatar: "https://i.pravatar.cc/150?u=2", reviews: 98
    },
    {
        id: 3, name: "王洁牙", title: "主治医师", score: 4.7, specialty: "牙周治疗",
        avatar: "https://i.pravatar.cc/150?u=3", reviews: 250
    },
    {
        id: 4, name: "赵种植", title: "教授", score: 5.0, specialty: "全口种植", avatar: "https://i.pravatar.cc/150?u=4",
        reviews: 88
    },
];

export const MOCK_APPOINTMENTS = [
    {
        id: 101, doctorId: 1, date: "2023-10-28", time: "14:30", status: "completed",
        hospital: "未来牙科中心总院"
    },
    {
        id: 102, doctorId: 2, date: "2023-11-15", time: "09:00", status: "cancelled",
        hospital: "未来牙科中心总院"
    },
    {
        id: 103, doctorId: 3, date: "2023-12-05", time: "10:00", status: "upcoming",
        hospital: "社区口腔服务站"
    },
];

export const MOCK_RECORDS = [
    {
        id: 201, date: "2023-10-28", doctor: "张智齿", diagnosis: "左下阻生智齿", content: "建议微创拔除，术后注意冰敷。",
        resultImage: "dental_xray_mock", rated: false
    },
    {
        id: 202, date: "2023-05-12", doctor: "王洁牙", diagnosis: "牙龈炎", content: "进行了全口洁治，牙龈红肿消退。",
        resultImage: "dental_clean_mock", rated: true, rating: 5
    },
];

export const MOCK_CHAT_HISTORY = [
    { id: 1, sender: 'doctor', text: '你好，请问牙齿哪里不舒服？', time: '10:00' },
    { id: 2, sender: 'user', text: '右边后面的一颗牙咬东西有点酸。', time: '10:02' },
    { id: 3, sender: 'doctor', text: '持续多久了？这是之前的X光片显示的区域吗？', time: '10:03' },
];