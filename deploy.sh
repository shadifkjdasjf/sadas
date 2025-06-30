#!/bin/bash

# 配方排班管理系統部署腳本
echo "=== 配方排班管理系統部署腳本 ==="

# 檢查是否為root用戶
if [ "$EUID" -ne 0 ]; then
  echo "請使用sudo運行此腳本"
  exit 1
fi

# 設置變量
PROJECT_DIR="/var/www/recipe_schedule_app"
BACKEND_DIR="$PROJECT_DIR/backend"
DB_NAME="recipe_schedule_db"
DB_USER="recipe_app"
DB_PASS="secure_password_$(date +%s)"

echo "開始部署..."

# 1. 安裝必要的軟件包
echo "1. 安裝軟件包..."
apt update
apt install -y nginx php-fpm php-mysql mysql-server

# 2. 配置MySQL
echo "2. 配置MySQL..."
systemctl start mysql
systemctl enable mysql

# 創建數據庫用戶
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 3. 複製項目文件
echo "3. 複製項目文件..."
mkdir -p $PROJECT_DIR
cp -r backend $PROJECT_DIR/
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 4. 更新數據庫配置
echo "4. 更新數據庫配置..."
cat > $BACKEND_DIR/config/database.php << EOF
<?php
class Database {
    private \$host = "localhost";
    private \$db_name = "$DB_NAME";
    private \$username = "$DB_USER";
    private \$password = "$DB_PASS";
    public \$conn;

    public function getConnection() {
        \$this->conn = null;
        try {
            \$this->conn = new PDO("mysql:host=" . \$this->host . ";dbname=" . \$this->db_name, \$this->username, \$this->password);
            \$this->conn->exec("set names utf8");
            \$this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            \$this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException \$exception) {
            echo "Connection error: " . \$exception->getMessage();
        }
        return \$this->conn;
    }
}
?>
EOF

# 5. 初始化數據庫
echo "5. 初始化數據庫..."
mysql $DB_NAME < $BACKEND_DIR/config/init_database.sql

# 6. 配置Nginx
echo "6. 配置Nginx..."
cat > /etc/nginx/sites-available/recipe_schedule_app << EOF
server {
    listen 80;
    server_name _;
    root $BACKEND_DIR/api;
    index index.php;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # 安全設置
    location ~ /\.ht {
        deny all;
    }
    
    # CORS設置
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
}
EOF

# 啟用站點
ln -sf /etc/nginx/sites-available/recipe_schedule_app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 7. 啟動服務
echo "7. 啟動服務..."
systemctl restart nginx
systemctl restart php8.1-fpm
systemctl enable nginx
systemctl enable php8.1-fpm

# 8. 設置防火牆
echo "8. 配置防火牆..."
ufw allow 'Nginx Full'
ufw allow ssh
ufw --force enable

# 9. 創建日誌目錄
echo "9. 設置日誌..."
mkdir -p /var/log/recipe_schedule_app
chown www-data:www-data /var/log/recipe_schedule_app

# 10. 輸出部署信息
echo ""
echo "=== 部署完成 ==="
echo "數據庫名稱: $DB_NAME"
echo "數據庫用戶: $DB_USER"
echo "數據庫密碼: $DB_PASS"
echo "項目目錄: $PROJECT_DIR"
echo ""
echo "API訪問地址: http://$(hostname -I | awk '{print $1}')/api/"
echo ""
echo "測試命令:"
echo "curl http://$(hostname -I | awk '{print $1}')/api/"
echo ""
echo "請保存數據庫密碼到安全位置！"

