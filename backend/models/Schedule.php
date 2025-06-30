<?php
require_once __DIR__ . '/../config/database.php';

/**
 * 排班模型類
 */
class Schedule {
    private $conn;
    private $table_name = "schedules";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * 獲取排班列表
     */
    public function getAll($userRole, $userId, $startDate = null, $endDate = null, $page = 1, $limit = 50) {
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        // 根據用戶角色決定可見範圍
        if ($userRole === 'staff') {
            // 員工只能看自己的排班
            $whereConditions[] = "s.user_id = ?";
            $params[] = $userId;
        }
        // 管理員和主廚可以看所有排班
        
        // 日期範圍過濾
        if ($startDate) {
            $whereConditions[] = "s.shift_date >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $whereConditions[] = "s.shift_date <= ?";
            $params[] = $endDate;
        }
        
        $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";
        
        $query = "SELECT s.*, u.full_name as user_name, c.full_name as creator_name
                  FROM " . $this->table_name . " s
                  LEFT JOIN users u ON s.user_id = u.id
                  LEFT JOIN users c ON s.created_by = c.id
                  $whereClause
                  ORDER BY s.shift_date DESC, s.start_time ASC
                  LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }

    /**
     * 獲取個人排班
     */
    public function getMySchedules($userId, $startDate = null, $endDate = null) {
        $whereConditions = ["user_id = ?"];
        $params = [$userId];
        
        if ($startDate) {
            $whereConditions[] = "shift_date >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $whereConditions[] = "shift_date <= ?";
            $params[] = $endDate;
        }
        
        $whereClause = implode(" AND ", $whereConditions);
        
        $query = "SELECT s.*, u.full_name as user_name
                  FROM " . $this->table_name . " s
                  LEFT JOIN users u ON s.user_id = u.id
                  WHERE $whereClause
                  ORDER BY s.shift_date ASC, s.start_time ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }

    /**
     * 創建排班
     */
    public function create($data, $createdBy) {
        // 檢查是否有衝突
        if ($this->hasConflict($data['user_id'], $data['shift_date'], $data['shift_type'])) {
            throw new Exception('該時段已有排班安排');
        }
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, shift_date, shift_type, start_time, end_time, status, notes, created_by) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([
            $data['user_id'],
            $data['shift_date'],
            $data['shift_type'],
            $data['start_time'],
            $data['end_time'],
            $data['status'] ?? 'scheduled',
            $data['notes'] ?? null,
            $createdBy
        ])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }

    /**
     * 更新排班
     */
    public function update($id, $data, $userRole, $userId) {
        // 獲取原始排班信息
        $originalSchedule = $this->getById($id);
        if (!$originalSchedule) {
            return false;
        }
        
        // 權限檢查：員工只能更新自己的排班狀態
        if ($userRole === 'staff' && $originalSchedule['user_id'] != $userId) {
            throw new Exception('權限不足');
        }
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['shift_date', 'shift_type', 'start_time', 'end_time', 'status', 'notes'];
        
        // 員工只能更新狀態
        if ($userRole === 'staff') {
            $allowedFields = ['status'];
        }
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = $field . " = ?";
                $values[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        // 如果更新了關鍵信息，檢查衝突
        if (isset($data['user_id']) || isset($data['shift_date']) || isset($data['shift_type'])) {
            $checkUserId = $data['user_id'] ?? $originalSchedule['user_id'];
            $checkDate = $data['shift_date'] ?? $originalSchedule['shift_date'];
            $checkType = $data['shift_type'] ?? $originalSchedule['shift_type'];
            
            if ($this->hasConflict($checkUserId, $checkDate, $checkType, $id)) {
                throw new Exception('該時段已有排班安排');
            }
        }
        
        $values[] = $id;
        
        $query = "UPDATE " . $this->table_name . " 
                  SET " . implode(", ", $fields) . " 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    /**
     * 刪除排班
     */
    public function delete($id, $userRole, $userId) {
        // 獲取排班信息
        $schedule = $this->getById($id);
        if (!$schedule) {
            return false;
        }
        
        // 權限檢查：只有管理員可以刪除排班
        if (!in_array($userRole, ['admin', 'super_admin'])) {
            throw new Exception('權限不足');
        }
        
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$id]);
    }

    /**
     * 根據ID獲取排班
     */
    public function getById($id) {
        $query = "SELECT s.*, u.full_name as user_name, c.full_name as creator_name
                  FROM " . $this->table_name . " s
                  LEFT JOIN users u ON s.user_id = u.id
                  LEFT JOIN users c ON s.created_by = c.id
                  WHERE s.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        return $stmt->fetch();
    }

    /**
     * 檢查排班衝突
     */
    private function hasConflict($userId, $shiftDate, $shiftType, $excludeId = null) {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE user_id = ? AND shift_date = ? AND shift_type = ?";
        $params = [$userId, $shiftDate, $shiftType];
        
        if ($excludeId) {
            $query .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetch() !== false;
    }

    /**
     * 獲取排班統計
     */
    public function getStats($startDate, $endDate) {
        $query = "SELECT 
                    COUNT(*) as total_schedules,
                    COUNT(DISTINCT user_id) as scheduled_users,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_schedules,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_schedules
                  FROM " . $this->table_name . "
                  WHERE shift_date BETWEEN ? AND ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$startDate, $endDate]);
        
        return $stmt->fetch();
    }

    /**
     * 獲取排班總數
     */
    public function getCount($userRole, $userId, $startDate = null, $endDate = null) {
        $whereConditions = [];
        $params = [];
        
        if ($userRole === 'staff') {
            $whereConditions[] = "user_id = ?";
            $params[] = $userId;
        }
        
        if ($startDate) {
            $whereConditions[] = "shift_date >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $whereConditions[] = "shift_date <= ?";
            $params[] = $endDate;
        }
        
        $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";
        
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " $whereClause";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        return $result['total'];
    }
}
?>

