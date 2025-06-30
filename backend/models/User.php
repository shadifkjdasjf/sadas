<?php
require_once __DIR__ . '/../config/database.php';

/**
 * 用戶模型類
 */
class User {
    private $conn;
    private $table_name = "users";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * 用戶登錄驗證
     */
    public function login($username, $password) {
        $query = "SELECT id, username, email, password_hash, role, full_name, phone, is_active 
                  FROM " . $this->table_name . " 
                  WHERE (username = ? OR email = ?) AND is_active = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']); // 移除密碼哈希
            return $user;
        }
        
        return false;
    }

    /**
     * 創建新用戶
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (username, email, password_hash, role, full_name, phone) 
                  VALUES (?, ?, ?, ?, ?, ?)";
        
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([
            $data['username'],
            $data['email'],
            $passwordHash,
            $data['role'],
            $data['full_name'],
            $data['phone'] ?? null
        ])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }

    /**
     * 獲取用戶列表
     */
    public function getAll($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT id, username, email, role, full_name, phone, is_active, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC 
                  LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$limit, $offset]);
        
        return $stmt->fetchAll();
    }

    /**
     * 根據ID獲取用戶
     */
    public function getById($id) {
        $query = "SELECT id, username, email, role, full_name, phone, is_active, created_at, updated_at 
                  FROM " . $this->table_name . " 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        return $stmt->fetch();
    }

    /**
     * 更新用戶信息
     */
    public function update($id, $data) {
        $fields = [];
        $values = [];
        
        $allowedFields = ['username', 'email', 'role', 'full_name', 'phone', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = $field . " = ?";
                $values[] = $data[$field];
            }
        }
        
        if (isset($data['password'])) {
            $fields[] = "password_hash = ?";
            $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        
        $query = "UPDATE " . $this->table_name . " 
                  SET " . implode(", ", $fields) . " 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    /**
     * 刪除用戶（軟刪除）
     */
    public function delete($id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_active = 0 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$id]);
    }

    /**
     * 檢查用戶名是否存在
     */
    public function usernameExists($username, $excludeId = null) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = ?";
        $params = [$username];
        
        if ($excludeId) {
            $query .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetch() !== false;
    }

    /**
     * 檢查郵箱是否存在
     */
    public function emailExists($email, $excludeId = null) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ?";
        $params = [$email];
        
        if ($excludeId) {
            $query .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetch() !== false;
    }

    /**
     * 獲取用戶總數
     */
    public function getCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch();
        
        return $result['total'];
    }
}
?>

