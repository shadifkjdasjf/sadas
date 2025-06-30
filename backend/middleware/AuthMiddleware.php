<?php
require_once '../utils/JWT.php';
require_once '../config/database.php';

/**
 * 認證中間件
 */
class AuthMiddleware {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * 驗證用戶認證
     */
    public function authenticate() {
        $token = JWT::getBearerToken();
        
        if (!$token) {
            $this->sendUnauthorized('缺少認證Token');
            return false;
        }
        
        $payload = JWT::decode($token);
        
        if (!$payload) {
            $this->sendUnauthorized('無效的Token');
            return false;
        }
        
        // 驗證用戶是否存在且活躍
        $query = "SELECT id, username, role, full_name, is_active FROM users WHERE id = ? AND is_active = 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $this->sendUnauthorized('用戶不存在或已停用');
            return false;
        }
        
        // 將用戶信息存儲到全局變量
        $GLOBALS['current_user'] = $user;
        
        return true;
    }

    /**
     * 檢查用戶角色權限
     */
    public function checkRole($requiredRoles) {
        if (!isset($GLOBALS['current_user'])) {
            $this->sendForbidden('未認證用戶');
            return false;
        }
        
        $userRole = $GLOBALS['current_user']['role'];
        
        if (!in_array($userRole, $requiredRoles)) {
            $this->sendForbidden('權限不足');
            return false;
        }
        
        return true;
    }

    /**
     * 檢查配方訪問權限
     */
    public function checkRecipeAccess($recipeMinRole) {
        if (!isset($GLOBALS['current_user'])) {
            return false;
        }
        
        $userRole = $GLOBALS['current_user']['role'];
        $roleHierarchy = ['staff' => 1, 'chef' => 2, 'admin' => 3, 'super_admin' => 4];
        
        $userLevel = $roleHierarchy[$userRole] ?? 0;
        $requiredLevel = $roleHierarchy[$recipeMinRole] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }

    /**
     * 發送401未授權響應
     */
    private function sendUnauthorized($message) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }

    /**
     * 發送403禁止訪問響應
     */
    private function sendForbidden($message) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }

    /**
     * 記錄操作日誌
     */
    public function logActivity($action, $tableName = null, $recordId = null, $oldValues = null, $newValues = null) {
        if (!isset($GLOBALS['current_user'])) {
            return;
        }
        
        $userId = $GLOBALS['current_user']['id'];
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $query = "INSERT INTO activity_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            $userId,
            $action,
            $tableName,
            $recordId,
            $oldValues ? json_encode($oldValues) : null,
            $newValues ? json_encode($newValues) : null,
            $ipAddress,
            $userAgent
        ]);
    }
}
?>

