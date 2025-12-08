# AI咨询历史记录数据库表设计

## ai_consultation_history 表

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 主键ID |
| user_id | BIGINT | NOT NULL, FOREIGN KEY | 用户ID（关联用户表） |
| question | TEXT | NOT NULL | 用户提问内容 |
| answer | TEXT | NOT NULL | AI回答内容 |
| files | JSON | NULL | 上传的文件信息（如文件名、类型、大小等） |
| context | TEXT | NULL | 上下文信息 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 表说明
1. **user_id**：关联用户表的外键，确保历史记录与用户账号绑定
2. **question**：存储用户的提问内容
3. **answer**：存储AI的回答内容
4. **files**：使用JSON格式存储上传的文件信息，便于扩展
5. **context**：存储对话上下文信息，用于多轮对话
6. **created_at**和**updated_at**：记录数据的创建和更新时间

## 索引设计
- 为`user_id`字段创建索引，提高按用户查询历史记录的效率
- 为`created_at`字段创建索引，便于按时间排序查询

```sql
-- 创建表语句
CREATE TABLE ai_consultation_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    files JSON NULL,
    context TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_ai_history_user_id ON ai_consultation_history(user_id);
CREATE INDEX idx_ai_history_created_at ON ai_consultation_history(created_at);
```