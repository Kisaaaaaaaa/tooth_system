# 牙科管理系统 API 接口文档


## 1. 概述

### 1.1 基础信息
- **API 基础路径**: `/api/`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: JWT Token（Bearer Token）

### 1.2 通用响应格式

#### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

### 1.4 JWT Token 认证机制

#### Token 类型
- **Access Token**: 用于访问受保护的API接口，有效期较短（2小时）
- **Refresh Token**: 用于刷新Access Token，有效期较长（30天）

#### Token 使用方式
1. 登录成功后，服务器返回 `token` 和 `refresh_token`
2. 前端将 `token` 存储在内存或安全的存储中
3. 每次请求受保护的接口时，在请求头中携带：
   ```
   Authorization: Bearer {token}
   ```
4. 当 `token` 过期时（返回401错误），使用 `refresh_token` 调用刷新接口获取新的 `token`
5. 如果 `refresh_token` 也过期，需要重新登录

#### Token 刷新流程
```
1. 用户登录 → 获得 token 和 refresh_token
2. 使用 token 访问接口
3. token 过期 → 返回 401
4. 使用 refresh_token 调用 /api/auth/refresh → 获得新 token
5. 使用新 token 继续访问接口
```

#### 安全建议
- Token 应存储在安全的地方，避免 XSS 攻击
- 实现 Token 黑名单机制（登出时使旧 Token 失效）
- 定期轮换 refresh_token

### 1.3 状态码说明
- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权（Token无效或过期）
- `403`: 权限不足（例如：普通用户尝试访问医生专属接口，或医生尝试访问其他医生的患者数据）
- `404`: 资源不存在（例如：请求的医院ID、医生ID、预约ID等不存在）
- `409`: 资源冲突（如：预约时间已被占用）
- `422`: 数据验证失败
- `500`: 服务器内部错误

---

## 2. 用户认证模块

### 2.1 用户注册

**接口地址**: `POST /api/auth/register`

**请求参数**:
```json
{
  "role": "user",           // 角色：user（普通用户）或 doctor（医生）
  "name": "张三",           // 姓名，必填
  "phone": "13800138000",   // 手机号，11位数字，必填
  "password": "password123" // 密码，必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user_id": 1,
    "name": "张三",
    "phone": "13800138000",
    "role": "user",
    "status": "active"  // active: 普通用户直接激活, pending: 医生待审核
  }
}
```

**特殊说明**:
- 普通用户注册后状态为 `active`，可直接登录
- 医生注册后状态为 `pending`，需要管理员审核
- 医生状态为 `pending` 时无法登录，需要等待审核通过

---

### 2.2 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "phone": "13800138000",      // 手机号，必填
  "password": "password123",   // 密码，必填
  "captcha_id": "uuid_string", // 验证码ID（从获取验证码接口获得），必填
  "captcha": "ABC12"           // 用户输入的图形验证码答案，必填（不区分大小写）
}
```

**验证码验证说明**:
- 登录时需要同时提交 `captcha_id` 和 `captcha`
- 后端根据 `captcha_id` 查找存储的正确答案进行比对
- 验证码验证成功后会被删除，不能重复使用
- 如果验证码错误或过期，返回错误信息，需要重新获取验证码

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_string",
    "user": {
      "id": 1,  // 用户ID，用于前端标识当前登录用户，可用于后续接口调用
      "name": "张三",
      "phone": "13800138000",
      "role": "user",
      "avatar": "https://example.com/avatar.jpg"
    },
    "expires_in": 3600  // Token过期时间（秒）
  }
}
```

**错误响应** (验证码错误):
```json
{
  "code": 400,
  "message": "验证码错误，请重新获取",
  "data": null
}
```

**错误响应** (验证码过期或不存在):
```json
{
  "code": 400,
  "message": "验证码已过期，请重新获取",
  "data": null
}
```

---

### 2.3 获取图形验证码

**接口地址**: `GET /api/auth/captcha`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "captcha_id": "uuid_string",  // 验证码唯一标识，用于后续验证
    "captcha_image": "data:image/png;base64,iVBORw0KGgo..."  // Base64编码的图片
  }
}
```

**验证码工作机制**:

1. **获取验证码流程**:
   - 前端调用 `GET /api/auth/captcha` 接口
   - 后端生成随机验证码（如：`ABC12`）
   - 后端将验证码答案存储在服务器，设置过期时间（5分钟）
   - 后端生成验证码图片（将答案绘制成图片，添加干扰线、噪点等）
   - 后端返回 `captcha_id`（用于标识这个验证码）和 `captcha_image`（Base64编码的图片）

2. **验证流程**:
   - 前端显示验证码图片，用户输入看到的验证码
   - 用户提交登录时，前端将 `captcha_id` 和用户输入的 `captcha` 一起提交
   - 后端根据 `captcha_id` 查找存储的正确答案
   - 后端对比用户输入的答案和存储的答案
   - 验证成功后，删除该验证码记录（防止重复使用）
   - 验证失败返回错误，前端需要重新获取验证码

**存储方式建议**:
- **Session**: 存储在服务器Session中（需要Session支持）


### 2.4 刷新Token

**接口地址**: `POST /api/auth/refresh`

**请求头**:
```
Authorization: Bearer {refresh_token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "token": "new_token_string",
    "expires_in": 3600
  }
}
```

---

### 2.5 用户登出

**接口地址**: `POST /api/auth/logout`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

---

### 2.6 获取当前用户信息

**接口地址**: `GET /api/auth/me`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "张三",
    "phone": "13800138000",
    "role": "user",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active"
  }
}
```

**用途说明**:
- 用于验证Token是否有效
- 获取最新的用户信息（头像、状态等可能已更新）
- 页面刷新后恢复用户状态
- 判断用户角色和权限，决定前端显示哪些功能模块
- 医生端和用户端根据 `role` 字段显示不同的界面和功能

---

### 2.7 更新用户信息

**接口地址**: `PUT /api/auth/me`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "name": "张三",                    // 姓名，可选
  "avatar": "https://example.com/avatar.jpg"  // 头像URL，可选（需要先通过文件上传接口上传）
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

---

### 2.8 修改密码

**接口地址**: `POST /api/auth/change-password`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "old_password": "oldpassword123",  // 旧密码，必填
  "new_password": "newpassword123"   // 新密码，必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

**错误响应** (旧密码错误):
```json
{
  "code": 400,
  "message": "旧密码错误",
  "data": null
}
```

---

## 3. 医院管理模块

### 3.1 获取医院列表

**接口地址**: `GET /api/hospitals`

**请求参数** (Query Parameters):
- `filter`: 筛选类型，可选值：`all`（全部）、`near`（距离最近）、`frequent`（我常去的），默认 `all`
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 10
- `latitude`: 纬度（用于计算距离，可选）
- `longitude`: 经度（用于计算距离，可选）

**请求头**:
```
Authorization: Bearer {token}  // 可选，登录用户可获取个性化数据
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 25,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 1,
        "name": "未来牙科中心总院",
        "address": "科技园区大道88号",
        "distance": 1.2,  // 单位：km，如果提供了经纬度
        "image": "https://example.com/hospital1.jpg",
        "rating": 4.8,
        "review_count": 256
      }
    ]
  }
}
```

---

### 3.2 获取医院详情

**接口地址**: `GET /api/hospitals/{hospital_id}`

**请求头**:
```
Authorization: Bearer {token}  // 可选
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "未来牙科中心总院",
    "address": "科技园区大道88号",
    "phone": "400-123-4567",
    "latitude": 30.123456,
    "longitude": 114.123456,
    "distance": 1.2,
    "image": "https://example.com/hospital1.jpg",
    "rating": 4.8,
    "review_count": 256,
    "description": "医院简介...",
    "doctors": [  // 该医院的医生列表
      {
        "id": 1,
        "name": "张智齿",
        "title": "主任医师",
        "specialty": "复杂拔牙",
        "avatar": "https://example.com/doctor1.jpg"
      }
    ],
    "services": ["种植牙", "正畸", "洁牙"],
    "business_hours": "09:00-18:00"
  }
}
```

---

### 4.3 医生端：更新医生信息

**接口地址**: `PUT /api/doctors/me`

**请求头**:
```
Authorization: Bearer {token}  // 必须是医生角色
```

**请求参数**:
```json
{
  "name": "张智齿",                    // 姓名，可选
  "title": "主任医师",                 // 职称，可选
  "specialty": "复杂拔牙",              // 专科，可选
  "introduction": "医生简介...",        // 简介，可选
  "education": "医学博士",              // 学历，可选
  "experience": "从事口腔医学20年",     // 经验，可选
  "avatar": "https://example.com/avatar.jpg"  // 头像URL，可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "张智齿",
    "title": "主任医师",
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

---

### 4.4 医生端：设置在线状态

**接口地址**: `POST /api/doctors/me/online-status`

**请求头**:
```
Authorization: Bearer {token}  // 必须是医生角色
```

**请求参数**:
```json
{
  "is_online": true  // 是否在线，必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "状态更新成功",
  "data": {
    "id": 1,
    "is_online": true
  }
}
```

---

## 4. 医生管理模块

### 4.1 获取医生列表

**接口地址**: `GET /api/doctors`

**请求参数** (Query Parameters):
- `view`: 视图类型，可选值：`list`（全部医生）、`rank`（排行榜），默认 `list`
- `hospital_id`: 医院ID（筛选特定医院的医生，可选）
- `specialty`: 专科（筛选特定专科的医生，可选）
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 10

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 50,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 1,
        "name": "张智齿",
        "title": "主任医师",
        "specialty": "复杂拔牙",
        "score": 4.9,
        "reviews": 120,
        "avatar": "https://i.pravatar.cc/150?u=1",
        "hospital": {
          "id": 1,
          "name": "未来牙科中心总院"
        },
        "is_online": true  // 是否在线
      }
    ]
  }
}
```

---

### 4.2 获取医生详情

**接口地址**: `GET /api/doctors/{doctor_id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "张智齿",
    "title": "主任医师",
    "specialty": "复杂拔牙",
    "score": 4.9,
    "reviews": 120,
    "avatar": "https://i.pravatar.cc/150?u=1",
    "hospital": {
      "id": 1,
      "name": "未来牙科中心总院",
      "address": "科技园区大道88号"
    },
    "introduction": "医生简介...",
    "education": "医学博士",
    "experience": "从事口腔医学20年",
    "is_online": true,
    "available_slots": [  // 可预约时间段，每个时间段为30分钟
      {
        "date": "2024-01-15",
        "time_slots": ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30"]  // 每个时间段30分钟，如09:00-09:30, 09:30-10:00
      }
    ]
  }
}
```

---

## 5. 预约管理模块

### 5.1 创建预约

**接口地址**: `POST /api/appointments`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "doctor_id": 1,           // 医生ID，必填
  "hospital_id": 1,        // 医院ID，必填
  "appointment_date": "2024-01-15",  // 预约日期，格式：YYYY-MM-DD，必填
  "appointment_time": "14:30",       // 预约时间，格式：HH:mm，必填
  "symptoms": "牙齿疼痛",   // 症状描述，可选
  "patient_name": "张三",   // 患者姓名，可选（如果不传则使用登录用户的姓名）
  "patient_phone": "13800138000"  // 患者电话，可选（如果不传则使用登录用户的电话）
}
```

**说明**:
- `user_id` 从 Token 中自动获取，无需前端传递
- 如果 `patient_name` 和 `patient_phone` 不传，则使用登录用户的信息
- 系统会自动检查该时间段是否已被预约（同一医生同一时间段只能有一个预约）

**响应示例**:
```json
{
  "code": 200,
  "message": "预约成功",
  "data": {
    "id": 101,
    "doctor": {
      "id": 1,
      "name": "张智齿",
      "title": "主任医师"
    },
    "hospital": {
      "id": 1,
      "name": "未来牙科中心总院"
    },
    "appointment_date": "2024-01-15",
    "appointment_time": "14:30",
    "status": "upcoming",  // upcoming: 待就诊, completed: 已完成, cancelled: 已取消, checked-in: 已签到
    "created_at": "2024-01-10T10:00:00Z"
  }
}
```

---

### 5.2 获取预约列表

**接口地址**: `GET /api/appointments`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数** (Query Parameters):
- `status`: 预约状态，可选值：`upcoming`、`completed`、`cancelled`、`checked-in`，不传则返回全部
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 10

**权限说明**:
- **用户端**: 只能查看自己创建的预约列表
- **医生端**: 查看自己的接诊预约列表（通过 `doctor_id` 自动过滤）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 5,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 101,
        "doctor": {
          "id": 1,
          "name": "张智齿",
          "title": "主任医师"
        },
        "hospital": {
          "id": 1,
          "name": "未来牙科中心总院"
        },
        "appointment_date": "2024-01-15",
        "appointment_time": "14:30",
        "status": "upcoming",
        "created_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 5.3 取消预约

**接口地址**: `POST /api/appointments/{appointment_id}/cancel`

**请求头**:
```
Authorization: Bearer {token}
```

**取消条件**:
- 预约时间前2小时以上可以自由取消
- 预约时间前2小时内取消需要说明原因
- 已签到或已完成的预约不能取消
- 已取消的预约不能重复取消

**请求参数** (可选):
```json
{
  "reason": "临时有事"  // 取消原因，在预约时间前2小时内取消时建议填写
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "取消成功",
  "data": {
    "id": 101,
    "status": "cancelled",
    "cancelled_at": "2024-01-15T12:00:00Z"
  }
}
```

**错误响应** (如果不符合取消条件):
```json
{
  "code": 400,
  "message": "该预约已签到，无法取消",
  "data": null
}
```

---

### 5.4 预约改期

**接口地址**: `PUT /api/appointments/{appointment_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "appointment_date": "2024-01-20",  // 新的预约日期，格式：YYYY-MM-DD，可选
  "appointment_time": "15:00"        // 新的预约时间，格式：HH:mm，可选
}
```

**改期条件**:
- 只能修改自己的预约（用户只能修改自己创建的预约）
- 预约时间前24小时以上可以自由改期
- 已签到或已完成的预约不能改期
- 已取消的预约不能改期

**响应示例**:
```json
{
  "code": 200,
  "message": "预约改期成功",
  "data": {
    "id": 101,
    "appointment_date": "2024-01-20",
    "appointment_time": "15:00",
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```

**错误响应** (如果时间段已被占用):
```json
{
  "code": 409,
  "message": "该时间段已被预约，请选择其他时间",
  "data": null
}
```

---

### 5.5 预约签到

**接口地址**: `POST /api/appointments/{appointment_id}/checkin`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "latitude": 30.123456,   // 签到位置纬度，可选（用于验证是否在医院附近）
  "longitude": 114.123456  // 签到位置经度，可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "id": 101,
    "status": "checked-in",
    "checkin_time": "2024-01-15T14:25:00Z"
  }
}
```

**错误响应** (如果不在签到时间窗口内):
```json
{
  "code": 400,
  "message": "当前不在签到时间窗口内（预约时间前30分钟至后15分钟）",
  "data": null
}
```

---

### 5.6 医生端：完成预约

**接口地址**: `POST /api/appointments/{appointment_id}/complete`

**请求头**:
```
Authorization: Bearer {token}  // 必须是医生角色，且是该预约的接诊医生
```

**说明**:
- 只有医生可以完成预约
- 医生只能完成自己接诊的预约
- 预约状态必须为 `checked-in`（已签到）才能完成
- 完成预约后，状态变为 `completed`，可以创建病历

**响应示例**:
```json
{
  "code": 200,
  "message": "预约已完成",
  "data": {
    "id": 101,
    "status": "completed",
    "completed_at": "2024-01-15T15:30:00Z"
  }
}
```

---

## 6. 在线问诊模块

### 6.1 创建问诊会话

**接口地址**: `POST /api/consultations`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "doctor_id": 1,          // 医生ID，必填
  "initial_message": "我的牙齿有点疼"  // 初始消息，可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "问诊会话创建成功",
  "data": {
    "id": 1,
    "doctor": {
      "id": 1,
      "name": "张智齿",
      "title": "主任医师",
      "avatar": "https://i.pravatar.cc/150?u=1",
      "is_online": true
    },
    "status": "active",  // active: 进行中, closed: 已结束
    "created_at": "2024-01-10T10:00:00Z"
  }
}
```

---

### 6.2 获取问诊会话列表

**接口地址**: `GET /api/consultations`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数** (Query Parameters):
- `status`: 会话状态，可选值：`active`、`closed`，不传则返回全部
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 10

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 3,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 1,
        "doctor": {
          "id": 1,
          "name": "张智齿",
          "title": "主任医师",
          "avatar": "https://i.pravatar.cc/150?u=1"
        },
        "last_message": {
          "text": "医生：持续多久了？这是之前的...",
          "time": "2024-01-10T10:03:00Z"
        },
        "status": "active",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:03:00Z"
      }
    ]
  }
}
```

---

### 6.3 获取问诊会话详情（包含消息列表）

**接口地址**: `GET /api/consultations/{consultation_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数** (Query Parameters):
- `page`: 消息列表页码，默认 1
- `page_size`: 每页消息数量，默认 20

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "doctor": {
      "id": 1,
      "name": "张智齿",
      "title": "主任医师",
      "avatar": "https://i.pravatar.cc/150?u=1",
      "is_online": true
    },
    "status": "active",
    "messages": {
      "count": 5,
      "page": 1,
      "page_size": 20,
      "results": [
        {
          "id": 1,
          "sender": "doctor",  // doctor 或 user
          "text": "你好，请问牙齿哪里不舒服？",
          "time": "2024-01-10T10:00:00Z"
        },
        {
          "id": 2,
          "sender": "user",
          "text": "右边后面的一颗牙咬东西有点酸。",
          "time": "2024-01-10T10:02:00Z"
        }
      ]
    },
    "created_at": "2024-01-10T10:00:00Z"
  }
}
```

---

### 6.4 发送消息

**接口地址**: `POST /api/consultations/{consultation_id}/messages`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "text": "持续了大概一周了"  // 消息内容，必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "发送成功",
  "data": {
    "id": 6,
    "sender": "user",
    "text": "持续了大概一周了",
    "time": "2024-01-10T10:05:00Z"
  }
}
```

---

### 6.5 WebSocket 连接（实时消息）

**连接地址**: `ws://your-domain/api/consultations/{consultation_id}/ws`

**连接参数**:
- 需要在连接时传递 Token（通过查询参数或请求头）

**消息格式**:

发送消息:
```json
{
  "type": "send_message",
  "text": "消息内容"
}
```

接收消息:
```json
{
  "type": "new_message",
  "data": {
    "id": 7,
    "sender": "doctor",
    "text": "收到您的信息，AI助手正在分析您的描述，医生稍后回复。",
    "time": "2024-01-10T10:06:00Z"
  }
}
```

**说明**: 如果不需要实时通信，可以使用轮询方式获取新消息

---

### 6.6 关闭问诊会话

**接口地址**: `POST /api/consultations/{consultation_id}/close`

**请求头**:
```
Authorization: Bearer {token}
```

**权限说明**:
- 用户和医生都可以关闭会话
- 用户只能关闭自己创建的会话
- 医生只能关闭自己接诊的会话

**响应示例**:
```json
{
  "code": 200,
  "message": "会话已关闭",
  "data": {
    "id": 1,
    "status": "closed",
    "closed_at": "2024-01-10T11:00:00Z"
  }
}
```

---

## 7. 病历管理模块

**权限说明**:
- **用户端**: 只能查看自己的病历列表（自动过滤，无需传参）
- **普通医生端**: 只能查看自己接诊过的患者的病历列表（自动过滤，只能看到自己创建的病历）
- **超级医生**: 拥有最大权限，可以查看所有患者的病历（需要在用户表中标记为超级医生）

**筛选功能**:
- 支持日期范围筛选（`date_from` 和 `date_to`）
- 支持患者名字模糊搜索（`patient_name`）
- 支持医生名字模糊搜索（`doctor_name`）
- 多个筛选条件可以组合使用

### 7.1 获取病历列表

**接口地址**: `GET /api/records`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数** (Query Parameters):
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 10
- `date_from`: 开始日期，格式：YYYY-MM-DD（可选，用于日期范围筛选）
- `date_to`: 结束日期，格式：YYYY-MM-DD（可选，用于日期范围筛选）
- `patient_name`: 患者名字（可选，支持模糊搜索，仅医生端可用）
- `doctor_name`: 医生名字（可选，支持模糊搜索，用户端和医生端都可用）

**筛选说明**:
- `patient_name` 和 `doctor_name` 支持模糊匹配（如：输入"张"可以匹配"张三"、"张四"等）
- **用户端**: 只能使用 `date_from`、`date_to`、`doctor_name` 筛选自己的病历（`patient_name` 对用户端无效）
- **普通医生端**: 可以使用所有筛选条件，但只能筛选自己患者的病历
- **超级医生端**: 可以使用所有筛选条件，可以筛选所有病历


**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 5,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 201,
        "date": "2023-10-28",
        "doctor": {
          "id": 1,
          "name": "张智齿",
          "title": "主任医师"
        },
        "hospital": {
          "id": 1,
          "name": "未来牙科中心总院"
        },
        "diagnosis": "左下阻生智齿",
        "content": "建议微创拔除，术后注意冰敷。",
        "result_image": "https://example.com/xray1.jpg",  // 病历图片URL（单张）
        "rated": false,  // 是否已评价
        "rating": null,  // 评价分数（1-5），如果已评价
        "created_at": "2023-10-28T14:30:00Z"
      }
    ]
  }
}
```

---

### 7.2 获取病历详情

**接口地址**: `GET /api/records/{record_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 201,
    "date": "2023-10-28",
    "doctor": {
      "id": 1,
      "name": "张智齿",
      "title": "主任医师",
      "avatar": "https://i.pravatar.cc/150?u=1"
    },
    "hospital": {
      "id": 1,
      "name": "未来牙科中心总院",
      "address": "科技园区大道88号"
    },
    "diagnosis": "左下阻生智齿",
    "content": "建议微创拔除，术后注意冰敷。",
    "treatment": "微创拔牙术",
    "medications": ["阿莫西林", "布洛芬"],
    "result_image": "https://example.com/xray1.jpg",  // 病历图片URL（单张）
    "rated": false,
    "rating": null,
    "created_at": "2023-10-28T14:30:00Z"
  }
}
```

---

### 7.3 评价就诊

**接口地址**: `POST /api/records/{record_id}/rating`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "rating": 5,              // 评分，1-5，必填
  "comment": "医生很专业"   // 评价内容，可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "评价成功",
  "data": {
    "id": 201,
    "rated": true,
    "rating": 5,
    "comment": "医生很专业"
  }
}
```

---

### 7.4 医生端：获取患者病历列表

**接口地址**: `GET /api/doctors/patients/records`

**请求头**:
```
Authorization: Bearer {token}  // 必须是医生角色
```

**请求参数** (Query Parameters):
- `patient_id`: 患者用户ID（筛选特定患者的病历，可选）
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 10
- `date_from`: 开始日期，格式：YYYY-MM-DD（可选，用于日期范围筛选）
- `date_to`: 结束日期，格式：YYYY-MM-DD（可选，用于日期范围筛选）
- `patient_name`: 患者名字（可选，支持模糊搜索）
- `doctor_name`: 医生名字（可选，支持模糊搜索，超级医生可用）

**权限说明**:
- 只有医生角色可以访问此接口
- **普通医生**: 只能查看自己接诊过的患者的病历（自动过滤，只能看到自己创建的病历）
- **超级医生**: 可以查看所有患者的病历（需要在用户表中标记 `is_super_doctor = true`）

**筛选说明**:
- 普通医生使用筛选条件时，仍然只能看到自己患者的病历
- 超级医生可以使用所有筛选条件查看所有病历

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 10,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 201,
        "date": "2023-10-28",
        "patient": {
          "id": 5,
          "name": "李四",
          "phone": "13900139000"
        },
        "hospital": {
          "id": 1,
          "name": "未来牙科中心总院"
        },
        "diagnosis": "左下阻生智齿",
        "content": "建议微创拔除，术后注意冰敷。",
        "result_image": "https://example.com/xray1.jpg",  // 病历图片URL（单张）
        "created_at": "2023-10-28T14:30:00Z"
      }
    ]
  }
}
```

---

### 7.5 医生端：创建病历

**接口地址**: `POST /api/records`

**请求头**:
```
Authorization: Bearer {token}  // 必须是医生角色
```

**请求参数**:
```json
{
  "user_id": 5,                    // 患者用户ID，必填
  "hospital_id": 1,                // 医院ID，必填
  "date": "2024-01-15",            // 就诊日期，格式：YYYY-MM-DD，必填
  "diagnosis": "左下阻生智齿",     // 诊断，必填
  "content": "建议微创拔除，术后注意冰敷。",  // 病历内容，必填
  "treatment": "微创拔牙术",       // 治疗方案，可选
  "medications": ["阿莫西林", "布洛芬"],  // 药物列表，可选
  "result_image": "https://example.com/xray1.jpg"  // 病历图片URL（单张），可选（需要先通过文件上传接口上传）
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "病历创建成功",
  "data": {
    "id": 201,
    "user_id": 5,
    "doctor_id": 1,
    "hospital_id": 1,
    "date": "2024-01-15",
    "diagnosis": "左下阻生智齿",
    "content": "建议微创拔除，术后注意冰敷。",
    "treatment": "微创拔牙术",
    "medications": ["阿莫西林", "布洛芬"],
    "result_image": "https://example.com/xray1.jpg",  // 病历图片URL（单张）
    "created_at": "2024-01-15T14:30:00Z"
  }
}
```

**说明**:
- 只有医生可以创建病历
- 医生只能为自己接诊过的患者创建病历
- 图片需要先通过文件上传接口上传，获得URL后再传入此接口

---

### 7.6 医生端：更新病历

**接口地址**: `PUT /api/records/{record_id}`

**请求头**:
```
Authorization: Bearer {token}  // 必须是医生角色，且是该病历的创建医生
```

**请求参数**: 同创建病历接口，所有字段可选（只传需要更新的字段）

**响应示例**:
```json
{
  "code": 200,
  "message": "病历更新成功",
  "data": {
    "id": 201,
    "date": "2024-01-15",
    "diagnosis": "左下阻生智齿（已拔除）",
    "content": "已完成微创拔除，术后恢复良好。",
    "updated_at": "2024-01-20T10:00:00Z"
  }
}
```

---

## 8. AI问询模块

### 8.1 AI问询

**接口地址**: `POST /api/ai/inquiry`

**请求头**:
```
Authorization: Bearer {token}  // 可选
```

**请求参数**:
```json
{
  "question": "我的牙齿有点疼，应该怎么办？",  // 问题内容，必填
  "context": {  // 上下文信息，可选
    "symptoms": "牙齿疼痛",
    "duration": "3天",
    "location": "右上后牙"
  }
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "inquiry_123",
    "question": "我的牙齿有点疼，应该怎么办？",
    "answer": "根据您的描述，建议您尽快就医检查。牙齿疼痛可能由多种原因引起...",
    "suggestions": [
      "建议尽快预约牙医检查",
      "可以先用温水漱口缓解疼痛",
      "避免食用过冷过热的食物"
    ],
    "created_at": "2024-01-10T10:00:00Z"
  }
}
```

---

## 9. 统计数据模块

### 9.1 获取首页统计数据

**接口地址**: `GET /api/statistics/home`

**请求头**: 无需认证（公开数据）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "cooperation_clinics": 2000,      // 合作诊所数量
    "appointment_efficiency": 98,    // 预约效率提升百分比
    "revenue_growth": 45,             // 收入增长百分比
    "patient_satisfaction": 95,       // 患者满意度百分比
    "today_patients": 128,            // 今日接诊数
    "online_doctors": 12              // 在线医生数
  }
}
```

---

## 10. 文件上传模块

### 10.1 上传图片

**接口地址**: `POST /api/upload/image`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**说明**:
- 上传成功后返回图片URL，前端可以将此URL用于创建病历、更新头像等接口
- 每次只能上传一张图片
- 多个用户可能上传同名文件（如：`photo.jpg`），后端自动生成唯一文件名（如：`20240115_143025_abc123.jpg`）避免覆盖
- 支持的文件格式：jpg, png


**文件存储示例**:
```
原始文件名: 我的牙齿X光片.jpg
后端生成: 20240115_143025_user5_a3f8b2c1.jpg
存储路径: /uploads/records/2024/01/15/20240115_143025_user5_a3f8b2c1.jpg
返回URL: https://yourdomain.com/uploads/records/2024/01/15/20240115_143025_user5_a3f8b2c1.jpg
```

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/image_123.jpg",
    "filename": "image_123.jpg",
    "size": 102400  // 文件大小（字节）
  }
}
```

---

## 11. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如：预约时间已被占用） |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

---

## 12. 数据模型说明

### 12.1 用户模型 (User)
```python
{
  "id": int,              # 用户ID
  "name": str,            # 姓名
  "phone": str,           # 手机号（11位）
  "password": str,        # 密码（加密存储）
  "role": str,            # 角色：user, doctor, admin
  "avatar": str,          # 头像URL
  "status": str,          # 状态：active, pending, inactive
  "created_at": datetime, # 创建时间
  "updated_at": datetime  # 更新时间
}
```

### 12.2 医院模型 (Hospital)
```python
{
  "id": int,              # 医院ID
  "name": str,            # 医院名称
  "address": str,         # 地址
  "phone": str,           # 联系电话
  "latitude": float,      # 纬度
  "longitude": float,     # 经度
  "image": str,           # 图片URL
  "rating": float,        # 评分（0-5）
  "review_count": int,    # 评价数量
  "description": str,     # 简介
  "business_hours": str,  # 营业时间
  "created_at": datetime,
  "updated_at": datetime
}
```

### 12.3 医生模型 (Doctor)
```python
{
  "id": int,              # 医生ID（业务主键）
  "user_id": int,         # 关联用户ID（外键关联User表）
  "name": str,            # 姓名
  "title": str,           # 职称
  "specialty": str,       # 专科
  "hospital_id": int,     # 所属医院ID
  "avatar": str,          # 头像URL
  "score": float,         # 评分（0-5）
  "reviews": int,         # 评价数量
  "introduction": str,    # 简介
  "education": str,       # 学历
  "experience": str,      # 经验
  "is_online": bool,      # 是否在线
  "is_super_doctor": bool, # 是否为超级医生（拥有最大权限，可以查看所有病历）
  "created_at": datetime,
  "updated_at": datetime
}
```

**数据模型设计说明**:
- **user_id 的作用**: 
  - 医生和普通用户共用同一个 User 表存储基础信息（手机号、密码、角色等）
  - Doctor 表通过 `user_id` 关联到 User 表，实现：
    - 医生可以使用 User 表的账号密码登录
    - 医生和用户共享认证系统
    - 一个 User 记录对应一个 Doctor 记录（一对一关系）


### 12.4 预约模型 (Appointment)
```python
{
  "id": int,                      # 预约ID
  "user_id": int,                 # 用户ID
  "doctor_id": int,               # 医生ID
  "hospital_id": int,             # 医院ID
  "appointment_date": date,       # 预约日期
  "appointment_time": time,       # 预约时间（时间段开始时间，如14:30表示14:30-15:00）
  "symptoms": str,                # 症状描述
  "patient_name": str,            # 患者姓名
  "patient_phone": str,           # 患者电话
  "status": str,                  # 状态：upcoming, completed, cancelled, checked-in
  "checkin_time": datetime,       # 签到时间
  "created_at": datetime,
  "updated_at": datetime          # 更新日期参数：当预约被修改（如改期、取消）时，此字段会自动更新
}
```

### 12.5 问诊会话模型 (Consultation)
```python
{
  "id": int,              # 会话ID
  "user_id": int,         # 用户ID
  "doctor_id": int,       # 医生ID
  "status": str,          # 状态：active, closed
  "created_at": datetime,
  "updated_at": datetime
}
```

### 12.6 消息模型 (Message)
```python
{
  "id": int,                    # 消息ID
  "consultation_id": int,       # 会话ID
  "sender": str,                # 发送者：user, doctor
  "text": str,                  # 消息内容
  "time": datetime,             # 发送时间
  "created_at": datetime
}
```

### 12.7 病历模型 (Record)
```python
{
  "id": int,              # 病历ID
  "user_id": int,         # 用户ID
  "doctor_id": int,       # 医生ID
  "hospital_id": int,     # 医院ID
  "date": date,           # 就诊日期
  "diagnosis": str,       # 诊断
  "content": str,         # 病历内容
  "treatment": str,       # 治疗方案
  "medications": list,    # 药物列表
  "result_image": str,    # 结果图片URL（单张）
  "rated": bool,          # 是否已评价
  "rating": int,          # 评分（1-5）
  "comment": str,         # 评价内容
  "created_at": datetime,
  "updated_at": datetime
}
```

---

## 13. 开发建议

### 13.1 Django 项目结构
```
dental_system/
├── manage.py
├── dental_system/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/          # 用户认证模块
│   ├── hospitals/      # 医院管理模块
│   ├── doctors/        # 医生管理模块
│   ├── appointments/   # 预约管理模块
│   ├── consultations/  # 在线问诊模块
│   ├── records/        # 病历管理模块
│   ├── ai/             # AI问询模块
│   └── common/         # 通用模块（文件上传、统计等）
└── requirements.txt
```

### 13.2 技术栈
- **框架**: Django 4.2+ / Django REST Framework
- **数据库**: MySQL
- **认证**: JWT (djangorestframework-simplejwt)
- **文件存储**: 本地存储 
- **实时通信**: Django Channels (WebSocket) #待定
- **AI集成**: OpenAI API / 本地AI模型 #待定
- **缓存**: Redis #暂时不用
- **任务队列**: Celery (用于异步任务) #暂时不用



---## 15. 用户端与医生端差异

**用户端（role: user）**:
- 首页：显示预约、找医院、找医生等功能入口
- 预约管理：只能查看和管理自己的预约
- 病历管理：只能查看自己的病历
- 在线问诊：作为患者与医生聊天
- 功能入口：预约挂号、查看病历、在线问诊、AI问询

**医生端（role: doctor）**:
- 首页：显示今日预约、待处理问诊、患者统计等
- 预约管理：查看自己的接诊预约列表
- 病历管理：可以查看和创建自己接诊过的患者的病历
- 在线问诊：作为医生与患者聊天
- 功能入口：我的排班、患者管理、病历录入、问诊回复

### 15.2 接口权限差异

| 接口 | 用户端 | 医生端 |
|------|--------|--------|
| GET /api/records | ✅ 只能查看自己的 | ✅ 普通医生：只能查看自己患者的病历<br>✅ 超级医生：可以查看所有病历 |
| POST /api/records | ❌ 无权限 | ✅ 可以创建病历 |
| PUT /api/records/{id} | ❌ 无权限 | ✅ 可以更新自己创建的病历 |
| GET /api/appointments | ✅ 只能查看自己的预约 | ✅ 可以查看自己的接诊预约 |
| POST /api/appointments/{id}/complete | ❌ 无权限 | ✅ 可以完成预约 |
| GET /api/doctors/patients/records | ❌ 无权限 | ✅ 普通医生：只能查看自己患者的病历<br>✅ 超级医生：可以查看所有病历 |
| PUT /api/doctors/me | ❌ 无权限 | ✅ 可以更新自己的医生信息 |
| POST /api/doctors/me/online-status | ❌ 无权限 | ✅ 可以设置在线状态 |

### 15.3 前端路由建议

**用户端路由**:
- `/home` - 首页
- `/appointments` - 我的预约
- `/records` - 我的病历
- `/consultations` - 在线问诊
- `/doctors` - 找医生
- `/hospitals` - 找医院

**医生端路由**:
- `/doctor/home` - 医生首页
- `/doctor/appointments` - 我的排班
- `/doctor/patients` - 患者管理
- `/doctor/records` - 病历管理
- `/doctor/consultations` - 问诊管理



