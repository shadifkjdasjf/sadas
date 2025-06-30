<?php
require_once __DIR__ . '/../config/database.php';

/**
 * 配方模型類
 */
class Recipe {
    private $conn;
    private $table_name = "recipes";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * 獲取配方列表（根據用戶權限過濾）
     */
    public function getAll($userRole, $page = 1, $limit = 20, $categoryId = null, $search = null) {
        $offset = ($page - 1) * $limit;
        
        // 根據用戶角色確定可見的配方
        $roleHierarchy = ['staff' => 1, 'chef' => 2, 'admin' => 3, 'super_admin' => 4];
        $userLevel = $roleHierarchy[$userRole] ?? 1;
        
        $whereConditions = ["r.is_active = 1"];
        $params = [];
        
        // 權限過濾
        $roleConditions = [];
        foreach ($roleHierarchy as $role => $level) {
            if ($level <= $userLevel) {
                $roleConditions[] = "r.min_role = ?";
                $params[] = $role;
            }
        }
        if (!empty($roleConditions)) {
            $whereConditions[] = "(" . implode(" OR ", $roleConditions) . ")";
        }
        
        // 分類過濾
        if ($categoryId) {
            $whereConditions[] = "r.category_id = ?";
            $params[] = $categoryId;
        }
        
        // 搜索過濾
        if ($search) {
            $whereConditions[] = "(r.name LIKE ? OR r.description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $whereClause = implode(" AND ", $whereConditions);
        
        $query = "SELECT r.*, c.name as category_name, u.full_name as creator_name
                  FROM " . $this->table_name . " r
                  LEFT JOIN recipe_categories c ON r.category_id = c.id
                  LEFT JOIN users u ON r.created_by = u.id
                  WHERE $whereClause
                  ORDER BY r.created_at DESC
                  LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }

    /**
     * 根據ID獲取配方詳情（包含食材和步驟）
     */
    public function getById($id, $userRole) {
        // 檢查權限
        $recipe = $this->getBasicInfo($id);
        if (!$recipe || !$this->checkAccess($recipe['min_role'], $userRole)) {
            return false;
        }
        
        // 獲取食材
        $ingredients = $this->getIngredients($id);
        
        // 獲取步驟
        $steps = $this->getSteps($id);
        
        $recipe['ingredients'] = $ingredients;
        $recipe['steps'] = $steps;
        
        return $recipe;
    }

    /**
     * 獲取配方基本信息
     */
    private function getBasicInfo($id) {
        $query = "SELECT r.*, c.name as category_name, u.full_name as creator_name
                  FROM " . $this->table_name . " r
                  LEFT JOIN recipe_categories c ON r.category_id = c.id
                  LEFT JOIN users u ON r.created_by = u.id
                  WHERE r.id = ? AND r.is_active = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        return $stmt->fetch();
    }

    /**
     * 獲取配方食材
     */
    private function getIngredients($recipeId) {
        $query = "SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$recipeId]);
        
        return $stmt->fetchAll();
    }

    /**
     * 獲取配方步驟
     */
    private function getSteps($recipeId) {
        $query = "SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$recipeId]);
        
        return $stmt->fetchAll();
    }

    /**
     * 檢查用戶是否有權限訪問配方
     */
    private function checkAccess($recipeMinRole, $userRole) {
        $roleHierarchy = ['staff' => 1, 'chef' => 2, 'admin' => 3, 'super_admin' => 4];
        
        $userLevel = $roleHierarchy[$userRole] ?? 0;
        $requiredLevel = $roleHierarchy[$recipeMinRole] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }

    /**
     * 創建配方
     */
    public function create($data, $userId) {
        $this->conn->beginTransaction();
        
        try {
            // 創建配方基本信息
            $query = "INSERT INTO " . $this->table_name . " 
                      (name, description, category_id, difficulty_level, prep_time, cook_time, servings, image_url, min_role, created_by) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'],
                $data['category_id'],
                $data['difficulty_level'],
                $data['prep_time'],
                $data['cook_time'],
                $data['servings'],
                $data['image_url'] ?? null,
                $data['min_role'],
                $userId
            ]);
            
            $recipeId = $this->conn->lastInsertId();
            
            // 添加食材
            if (!empty($data['ingredients'])) {
                $this->addIngredients($recipeId, $data['ingredients']);
            }
            
            // 添加步驟
            if (!empty($data['steps'])) {
                $this->addSteps($recipeId, $data['steps']);
            }
            
            $this->conn->commit();
            return $recipeId;
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    /**
     * 添加配方食材
     */
    private function addIngredients($recipeId, $ingredients) {
        $query = "INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        foreach ($ingredients as $ingredient) {
            $stmt->execute([
                $recipeId,
                $ingredient['name'],
                $ingredient['quantity'],
                $ingredient['unit'],
                $ingredient['notes'] ?? null
            ]);
        }
    }

    /**
     * 添加配方步驟
     */
    private function addSteps($recipeId, $steps) {
        $query = "INSERT INTO recipe_steps (recipe_id, step_number, instruction, image_url) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        foreach ($steps as $index => $step) {
            $stmt->execute([
                $recipeId,
                $index + 1,
                $step['instruction'],
                $step['image_url'] ?? null
            ]);
        }
    }

    /**
     * 獲取配方總數
     */
    public function getCount($userRole, $categoryId = null, $search = null) {
        $roleHierarchy = ['staff' => 1, 'chef' => 2, 'admin' => 3, 'super_admin' => 4];
        $userLevel = $roleHierarchy[$userRole] ?? 1;
        
        $whereConditions = ["is_active = 1"];
        $params = [];
        
        // 權限過濾
        $roleConditions = [];
        foreach ($roleHierarchy as $role => $level) {
            if ($level <= $userLevel) {
                $roleConditions[] = "min_role = ?";
                $params[] = $role;
            }
        }
        if (!empty($roleConditions)) {
            $whereConditions[] = "(" . implode(" OR ", $roleConditions) . ")";
        }
        
        // 分類過濾
        if ($categoryId) {
            $whereConditions[] = "category_id = ?";
            $params[] = $categoryId;
        }
        
        // 搜索過濾
        if ($search) {
            $whereConditions[] = "(name LIKE ? OR description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $whereClause = implode(" AND ", $whereConditions);
        
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE $whereClause";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        return $result['total'];
    }

    /**
     * 獲取配方分類
     */
    public function getCategories() {
        $query = "SELECT * FROM recipe_categories ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
?>

