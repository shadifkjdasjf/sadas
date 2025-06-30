# 配方排班管理系統 - 項目設計文檔

## 項目概述

本項目旨在開發一個React Native Expo Go應用程序，用於管理配方和員工排班，具有完善的權限系統和安全保障。

## 功能需求

### 1. 用戶管理系統
- **用戶等級分明**：
  - 超級管理員（Super Admin）：全部權限
  - 管理員（Admin）：管理配方和排班
  - 主廚（Chef）：查看和編輯配方
  - 員工（Staff）：查看排班和基礎配方

### 2. 配方管理系統
- **配方權限控制**：
  - 不同等級用戶可見不同配方
  - 配方分類管理（前菜、主菜、甜點等）
  - 配方版本控制
  - 配方收藏功能
- **配方內容**：
  - 配方名稱、描述
  - 食材清單和用量
  - 製作步驟
  - 圖片上傳
  - 難度等級
  - 製作時間

### 3. 員工排班系統
- **排班管理**：
  - 週期性排班
  - 班次管理（早班、中班、晚班）
  - 請假申請和審批
  - 排班衝突檢測
- **排班查看**：
  - 個人排班查看
  - 團隊排班總覽
  - 月度/週度視圖

### 4. 安全要求
- JWT Token認證
- 密碼加密存儲
- API接口權限驗證
- 數據傳輸加密
- 操作日誌記錄

## 技術架構

### 前端技術棧
- **React Native + Expo Go**
- **UI框架**：React Native Elements / NativeBase
- **狀態管理**：Redux Toolkit
- **導航**：React Navigation
- **HTTP客戶端**：Axios
- **本地存儲**：AsyncStorage

### 後端技術棧
- **PHP 8.0+**
- **MySQL 8.0+**
- **框架**：原生PHP或Slim Framework
- **認證**：JWT (JSON Web Tokens)
- **密碼加密**：bcrypt
- **CORS支持**

## 數據庫設計

### 用戶表 (users)
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'chef', 'staff') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 配方表 (recipes)
```sql
CREATE TABLE recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    prep_time INT, -- 準備時間（分鐘）
    cook_time INT, -- 烹飪時間（分鐘）
    servings INT DEFAULT 1,
    image_url VARCHAR(500),
    min_role ENUM('super_admin', 'admin', 'chef', 'staff') DEFAULT 'staff',
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES recipe_categories(id)
);
```

### 配方分類表 (recipe_categories)
```sql
CREATE TABLE recipe_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 配方食材表 (recipe_ingredients)
```sql
CREATE TABLE recipe_ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    ingredient_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
```

### 配方步驟表 (recipe_steps)
```sql
CREATE TABLE recipe_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    image_url VARCHAR(500),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
```

### 排班表 (schedules)
```sql
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    shift_date DATE NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'evening') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'confirmed', 'completed', 'absent') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_user_shift (user_id, shift_date, shift_type)
);
```

### 請假申請表 (leave_requests)
```sql
CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

### 操作日誌表 (activity_logs)
```sql
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API接口設計

### 認證相關
- POST /api/auth/login - 用戶登錄
- POST /api/auth/logout - 用戶登出
- POST /api/auth/refresh - 刷新Token
- GET /api/auth/profile - 獲取用戶信息

### 用戶管理
- GET /api/users - 獲取用戶列表（管理員）
- POST /api/users - 創建用戶（管理員）
- PUT /api/users/{id} - 更新用戶信息
- DELETE /api/users/{id} - 刪除用戶（管理員）

### 配方管理
- GET /api/recipes - 獲取配方列表
- GET /api/recipes/{id} - 獲取配方詳情
- POST /api/recipes - 創建配方
- PUT /api/recipes/{id} - 更新配方
- DELETE /api/recipes/{id} - 刪除配方
- GET /api/recipe-categories - 獲取配方分類

### 排班管理
- GET /api/schedules - 獲取排班列表
- POST /api/schedules - 創建排班
- PUT /api/schedules/{id} - 更新排班
- DELETE /api/schedules/{id} - 刪除排班
- GET /api/schedules/my - 獲取個人排班

### 請假管理
- GET /api/leave-requests - 獲取請假申請
- POST /api/leave-requests - 提交請假申請
- PUT /api/leave-requests/{id}/approve - 審批請假申請

## 安全措施

1. **認證安全**
   - JWT Token有效期設置
   - 密碼強度要求
   - 登錄失敗次數限制

2. **數據安全**
   - SQL注入防護
   - XSS攻擊防護
   - CSRF防護

3. **權限控制**
   - 基於角色的訪問控制（RBAC）
   - API接口權限驗證
   - 前端路由權限控制

4. **數據傳輸**
   - HTTPS加密傳輸
   - 敏感數據加密存儲

## 項目結構

```
recipe_schedule_app/
├── backend/                 # PHP後端
│   ├── api/                # API接口
│   ├── config/             # 配置文件
│   ├── models/             # 數據模型
│   ├── middleware/         # 中間件
│   └── utils/              # 工具函數
├── frontend/               # React Native前端
│   ├── src/
│   │   ├── components/     # 組件
│   │   ├── screens/        # 頁面
│   │   ├── navigation/     # 導航
│   │   ├── store/          # 狀態管理
│   │   ├── services/       # API服務
│   │   └── utils/          # 工具函數
│   ├── assets/             # 資源文件
│   └── app.json            # Expo配置
└── docs/                   # 文檔
```

## 開發計劃

1. **階段一**：後端API開發和數據庫設計
2. **階段二**：前端基礎架構和認證系統
3. **階段三**：配方管理功能實現
4. **階段四**：排班管理功能實現
5. **階段五**：測試和優化
6. **階段六**：部署和文檔

