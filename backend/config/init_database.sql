-- 創建數據庫
CREATE DATABASE IF NOT EXISTS recipe_schedule_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE recipe_schedule_db;

-- 用戶表
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

-- 配方分類表
CREATE TABLE recipe_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 配方表
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

-- 配方食材表
CREATE TABLE recipe_ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    ingredient_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 配方步驟表
CREATE TABLE recipe_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    image_url VARCHAR(500),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 排班表
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

-- 請假申請表
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

-- 操作日誌表
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

-- 插入初始數據

-- 插入配方分類
INSERT INTO recipe_categories (name, description) VALUES
('前菜', '開胃菜和小食'),
('主菜', '主要菜餚'),
('甜點', '甜品和點心'),
('湯品', '各式湯類'),
('飲品', '飲料和茶品'),
('醬料', '調味料和醬汁');

-- 插入初始用戶（密碼都是 'password123'，已加密）
INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES
('admin', 'admin@restaurant.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', '系統管理員', '0912345678'),
('chef_wang', 'chef.wang@restaurant.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'chef', '王主廚', '0912345679'),
('manager_li', 'manager.li@restaurant.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '李經理', '0912345680'),
('staff_chen', 'staff.chen@restaurant.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '陳員工', '0912345681');

-- 插入示例配方
INSERT INTO recipes (name, description, category_id, difficulty_level, prep_time, cook_time, servings, min_role, created_by) VALUES
('經典牛肉麵', '傳統台式牛肉麵，湯頭濃郁', 2, 'medium', 30, 120, 4, 'staff', 2),
('宮保雞丁', '經典川菜，香辣下飯', 2, 'easy', 15, 10, 2, 'staff', 2),
('紅燒獅子頭', '江浙名菜，肉質鮮嫩', 2, 'hard', 45, 60, 6, 'chef', 2),
('提拉米蘇', '義式經典甜點', 3, 'medium', 30, 0, 8, 'chef', 2);

-- 插入配方食材
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, notes) VALUES
-- 牛肉麵食材
(1, '牛腱肉', 500, '克', '切塊'),
(1, '牛肉麵條', 4, '份', ''),
(1, '豆瓣醬', 2, '大匙', ''),
(1, '蔥', 3, '根', '切段'),
(1, '薑', 1, '塊', '拍碎'),
-- 宮保雞丁食材
(2, '雞胸肉', 300, '克', '切丁'),
(2, '花生米', 50, '克', ''),
(2, '乾辣椒', 10, '個', ''),
(2, '花椒', 1, '茶匙', '');

-- 插入配方步驟
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
-- 牛肉麵步驟
(1, 1, '牛腱肉切塊，用滾水汆燙去血水'),
(1, 2, '熱鍋下油，爆香蔥薑，加入豆瓣醬炒香'),
(1, 3, '放入牛肉塊炒至上色，加水燉煮2小時'),
(1, 4, '麵條煮熟盛碗，淋上牛肉湯即可'),
-- 宮保雞丁步驟
(2, 1, '雞胸肉切丁，用醬油、料酒醃製15分鐘'),
(2, 2, '熱鍋下油，先炸花生米盛起'),
(2, 3, '下雞丁炒至變色，加入乾辣椒、花椒爆香'),
(2, 4, '調味炒勻，最後加入花生米即可');

-- 插入示例排班
INSERT INTO schedules (user_id, shift_date, shift_type, start_time, end_time, created_by) VALUES
(2, '2025-07-01', 'morning', '06:00:00', '14:00:00', 3),
(4, '2025-07-01', 'afternoon', '14:00:00', '22:00:00', 3),
(2, '2025-07-02', 'morning', '06:00:00', '14:00:00', 3),
(4, '2025-07-02', 'evening', '18:00:00', '02:00:00', 3);

