# 配方排班管理系統 - API 文檔

## 概述

本文檔描述了配方排班管理系統的 RESTful API 接口。所有 API 端點都使用 JSON 格式進行數據交換。

### 基礎信息

- **基礎 URL**: `http://your-server/api`
- **認證方式**: JWT Bearer Token
- **內容類型**: `application/json`
- **字符編碼**: UTF-8

### 響應格式

所有 API 響應都遵循統一格式：

```json
{
  "success": true|false,
  "data": {}, // 成功時的數據
  "message": "錯誤信息" // 失敗時的錯誤信息
}
```

### 狀態碼

- `200`: 成功
- `400`: 請求錯誤
- `401`: 未認證
- `403`: 權限不足
- `404`: 資源不存在
- `500`: 服務器錯誤

## 認證 API

### 登錄

獲取訪問令牌。

**端點**: `POST /auth/login`

**請求體**:
```json
{
  "username": "用戶名",
  "password": "密碼"
}
```

**響應**:
```json
{
  "success": true,
  "data": {
    "message": "登錄成功",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@restaurant.com",
      "role": "super_admin",
      "full_name": "系統管理員",
      "phone": "0912345678",
      "is_active": 1
    }
  }
}
```

### 獲取用戶資料

獲取當前登錄用戶的詳細信息。

**端點**: `GET /auth/profile`

**請求頭**:
```
Authorization: Bearer YOUR_TOKEN
```

**響應**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@restaurant.com",
      "role": "super_admin",
      "full_name": "系統管理員",
      "phone": "0912345678",
      "is_active": 1
    }
  }
}
```

### 登出

使當前令牌失效。

**端點**: `POST /auth/logout`

**請求頭**:
```
Authorization: Bearer YOUR_TOKEN
```

**響應**:
```json
{
  "success": true,
  "data": {
    "message": "登出成功"
  }
}
```

## 用戶管理 API

### 獲取用戶列表

獲取所有用戶列表（僅超級管理員）。

**端點**: `GET /users`

**權限**: super_admin

**查詢參數**:
- `page`: 頁碼（默認: 1）
- `limit`: 每頁數量（默認: 20）

**響應**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@restaurant.com",
        "role": "super_admin",
        "full_name": "系統管理員",
        "phone": "0912345678",
        "is_active": 1,
        "created_at": "2025-06-30 06:03:03"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 4,
      "pages": 1
    }
  }
}
```

### 創建用戶

創建新用戶（僅超級管理員）。

**端點**: `POST /users`

**權限**: super_admin

**請求體**:
```json
{
  "username": "new_user",
  "password": "password123",
  "email": "user@example.com",
  "full_name": "新用戶",
  "role": "staff",
  "phone": "0987654321"
}
```

**響應**:
```json
{
  "success": true,
  "data": {
    "message": "用戶創建成功",
    "user_id": 5
  }
}
```

## 配方管理 API

### 獲取配方列表

獲取配方列表，根據用戶權限過濾。

**端點**: `GET /recipes`

**查詢參數**:
- `page`: 頁碼（默認: 1）
- `limit`: 每頁數量（默認: 20）
- `category_id`: 分類ID
- `search`: 搜索關鍵詞

**響應**:
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": 1,
        "name": "經典牛肉麵",
        "description": "傳統台式牛肉麵，湯頭濃郁",
        "category_id": 2,
        "difficulty_level": "medium",
        "prep_time": 30,
        "cook_time": 120,
        "servings": 4,
        "image_url": null,
        "min_role": "staff",
        "created_by": 2,
        "is_active": 1,
        "created_at": "2025-06-30 06:03:03",
        "updated_at": "2025-06-30 06:03:03",
        "category_name": "主菜",
        "creator_name": "王主廚"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 4,
      "pages": 1
    }
  }
}
```

### 獲取配方詳情

獲取單個配方的詳細信息，包括食材和步驟。

**端點**: `GET /recipes/{id}`

**響應**:
```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": 1,
      "name": "經典牛肉麵",
      "description": "傳統台式牛肉麵，湯頭濃郁",
      "category_id": 2,
      "difficulty_level": "medium",
      "prep_time": 30,
      "cook_time": 120,
      "servings": 4,
      "image_url": null,
      "min_role": "staff",
      "created_by": 2,
      "is_active": 1,
      "created_at": "2025-06-30 06:03:03",
      "updated_at": "2025-06-30 06:03:03",
      "category_name": "主菜",
      "creator_name": "王主廚",
      "ingredients": [
        {
          "id": 1,
          "recipe_id": 1,
          "ingredient_name": "牛腱肉",
          "quantity": "500.00",
          "unit": "克",
          "notes": "切塊"
        }
      ],
      "steps": [
        {
          "id": 1,
          "recipe_id": 1,
          "step_number": 1,
          "instruction": "牛腱肉切塊，用滾水汆燙去血水",
          "image_url": null
        }
      ]
    }
  }
}
```

### 創建配方

創建新配方（主廚及以上權限）。

**端點**: `POST /recipes`

**權限**: chef, admin, super_admin

**請求體**:
```json
{
  "name": "新配方",
  "description": "配方描述",
  "category_id": 2,
  "difficulty_level": "medium",
  "prep_time": 30,
  "cook_time": 60,
  "servings": 4,
  "min_role": "staff",
  "ingredients": [
    {
      "name": "食材1",
      "quantity": "100",
      "unit": "克",
      "notes": "備註"
    }
  ],
  "steps": [
    {
      "instruction": "製作步驟1"
    }
  ]
}
```

**響應**:
```json
{
  "success": true,
  "data": {
    "message": "配方創建成功",
    "recipe_id": 5
  }
}
```

### 獲取配方分類

獲取所有配方分類。

**端點**: `GET /recipes/categories`

**響應**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "前菜",
        "description": "開胃菜和小食",
        "created_at": "2025-06-30 06:03:03"
      },
      {
        "id": 2,
        "name": "主菜",
        "description": "主要菜餚",
        "created_at": "2025-06-30 06:03:03"
      }
    ]
  }
}
```

## 排班管理 API

### 獲取排班列表

獲取排班列表，員工只能看到自己的排班。

**端點**: `GET /schedules`

**查詢參數**:
- `page`: 頁碼（默認: 1）
- `limit`: 每頁數量（默認: 50）
- `start_date`: 開始日期 (YYYY-MM-DD)
- `end_date`: 結束日期 (YYYY-MM-DD)

**響應**:
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "user_id": 2,
        "shift_date": "2025-07-01",
        "shift_type": "morning",
        "start_time": "06:00:00",
        "end_time": "14:00:00",
        "status": "scheduled",
        "notes": null,
        "created_by": 3,
        "created_at": "2025-06-30 06:03:03",
        "updated_at": "2025-06-30 06:03:03",
        "user_name": "王主廚",
        "creator_name": "李經理"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 4,
      "pages": 1
    }
  }
}
```

### 獲取個人排班

獲取當前用戶的排班信息。

**端點**: `GET /schedules/my`

**查詢參數**:
- `start_date`: 開始日期 (YYYY-MM-DD)
- `end_date`: 結束日期 (YYYY-MM-DD)

**響應**:
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "user_id": 2,
        "shift_date": "2025-07-01",
        "shift_type": "morning",
        "start_time": "06:00:00",
        "end_time": "14:00:00",
        "status": "scheduled",
        "notes": null,
        "created_at": "2025-06-30 06:03:03",
        "updated_at": "2025-06-30 06:03:03",
        "user_name": "王主廚"
      }
    ]
  }
}
```

### 創建排班

創建新排班（管理員權限）。

**端點**: `POST /schedules`

**權限**: admin, super_admin

**請求體**:
```json
{
  "user_id": 2,
  "shift_date": "2025-07-01",
  "shift_type": "morning",
  "start_time": "06:00:00",
  "end_time": "14:00:00",
  "status": "scheduled",
  "notes": "備註信息"
}
```

**響應**:
```json
{
  "success": true,
  "data": {
    "message": "排班創建成功",
    "schedule_id": 5
  }
}
```

### 更新排班

更新排班信息。員工只能更新狀態，管理員可以更新所有字段。

**端點**: `PUT /schedules/{id}`

**請求體**:
```json
{
  "status": "confirmed"
}
```

**響應**:
```json
{
  "success": true,
  "data": {
    "message": "排班更新成功"
  }
}
```

### 獲取排班統計

獲取排班統計信息（管理員權限）。

**端點**: `GET /schedules/stats`

**權限**: admin, super_admin

**查詢參數**:
- `start_date`: 開始日期 (YYYY-MM-DD)
- `end_date`: 結束日期 (YYYY-MM-DD)

**響應**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_schedules": 10,
      "scheduled_users": 4,
      "completed_schedules": 8,
      "absent_schedules": 0
    }
  }
}
```

## 錯誤處理

### 錯誤響應格式

```json
{
  "success": false,
  "message": "錯誤描述"
}
```

### 常見錯誤

#### 401 未認證
```json
{
  "success": false,
  "message": "未提供認證令牌"
}
```

#### 403 權限不足
```json
{
  "success": false,
  "message": "權限不足"
}
```

#### 404 資源不存在
```json
{
  "success": false,
  "message": "配方不存在或無權限訪問"
}
```

#### 400 請求錯誤
```json
{
  "success": false,
  "message": "字段 name 不能為空"
}
```

## 數據類型

### 用戶角色
- `staff`: 員工
- `chef`: 主廚
- `admin`: 管理員
- `super_admin`: 超級管理員

### 配方難度
- `easy`: 簡單
- `medium`: 中等
- `hard`: 困難

### 班次類型
- `morning`: 早班
- `afternoon`: 午班
- `evening`: 晚班

### 排班狀態
- `scheduled`: 已安排
- `confirmed`: 已確認
- `completed`: 已完成
- `absent`: 缺勤

## 速率限制

為防止濫用，API 實施以下速率限制：
- 每個 IP 每分鐘最多 60 次請求
- 登錄端點每個 IP 每分鐘最多 5 次請求

## 版本控制

當前 API 版本：v1.0

未來版本更新將通過 URL 路徑進行版本控制：
- v1: `/api/v1/`
- v2: `/api/v2/`

---

*API 文檔版本：1.0*  
*最後更新：2025年6月30日*

