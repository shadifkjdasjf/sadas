<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 處理預檢請求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../models/Recipe.php';
require_once '../middleware/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

// 認證檢查
$auth = new AuthMiddleware();
if (!$auth->authenticate()) {
    exit;
}

$currentUser = $GLOBALS['current_user'];

// 路由處理
if ($path === '' || $path === '/') {
    // /api/recipes
    switch ($method) {
        case 'GET':
            handleGetRecipes();
            break;
        case 'POST':
            handleCreateRecipe();
            break;
        default:
            sendMethodNotAllowed();
            break;
    }
} elseif ($path === '/categories') {
    // /api/recipes/categories
    if ($method === 'GET') {
        handleGetCategories();
    } else {
        sendMethodNotAllowed();
    }
} else {
    // /api/recipes/{id}
    $pathParts = explode('/', trim($path, '/'));
    $recipeId = $pathParts[0] ?? null;
    
    if (!is_numeric($recipeId)) {
        sendNotFound();
        return;
    }
    
    switch ($method) {
        case 'GET':
            handleGetRecipe($recipeId);
            break;
        case 'PUT':
            handleUpdateRecipe($recipeId);
            break;
        case 'DELETE':
            handleDeleteRecipe($recipeId);
            break;
        default:
            sendMethodNotAllowed();
            break;
    }
}

/**
 * 獲取配方列表
 */
function handleGetRecipes() {
    global $currentUser;
    
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 20;
    $categoryId = $_GET['category_id'] ?? null;
    $search = $_GET['search'] ?? null;
    
    $recipe = new Recipe();
    $recipes = $recipe->getAll($currentUser['role'], $page, $limit, $categoryId, $search);
    $total = $recipe->getCount($currentUser['role'], $categoryId, $search);
    
    sendSuccess([
        'recipes' => $recipes,
        'pagination' => [
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * 獲取單個配方詳情
 */
function handleGetRecipe($recipeId) {
    global $currentUser;
    
    $recipe = new Recipe();
    $recipeData = $recipe->getById($recipeId, $currentUser['role']);
    
    if ($recipeData) {
        sendSuccess(['recipe' => $recipeData]);
    } else {
        sendNotFound('配方不存在或無權限訪問');
    }
}

/**
 * 創建配方
 */
function handleCreateRecipe() {
    global $auth, $currentUser;
    
    // 只有主廚以上可以創建配方
    if (!$auth->checkRole(['chef', 'admin', 'super_admin'])) {
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // 驗證必填字段
    $required = ['name', 'description', 'category_id', 'difficulty_level'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendBadRequest("字段 {$field} 不能為空");
            return;
        }
    }
    
    // 驗證難度等級
    $validDifficulties = ['easy', 'medium', 'hard'];
    if (!in_array($input['difficulty_level'], $validDifficulties)) {
        sendBadRequest('無效的難度等級');
        return;
    }
    
    // 驗證權限等級
    $validRoles = ['staff', 'chef', 'admin', 'super_admin'];
    if (isset($input['min_role']) && !in_array($input['min_role'], $validRoles)) {
        sendBadRequest('無效的權限等級');
        return;
    }
    
    // 設置默認值
    $input['min_role'] = $input['min_role'] ?? 'staff';
    $input['prep_time'] = $input['prep_time'] ?? 0;
    $input['cook_time'] = $input['cook_time'] ?? 0;
    $input['servings'] = $input['servings'] ?? 1;
    
    try {
        $recipe = new Recipe();
        $recipeId = $recipe->create($input, $currentUser['id']);
        
        $auth->logActivity('創建配方', 'recipes', $recipeId, null, $input);
        
        sendSuccess([
            'message' => '配方創建成功',
            'recipe_id' => $recipeId
        ]);
    } catch (Exception $e) {
        sendError('配方創建失敗: ' . $e->getMessage(), 500);
    }
}

/**
 * 更新配方
 */
function handleUpdateRecipe($recipeId) {
    global $auth, $currentUser;
    
    // 只有主廚以上可以更新配方
    if (!$auth->checkRole(['chef', 'admin', 'super_admin'])) {
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input)) {
        sendBadRequest('沒有提供更新數據');
        return;
    }
    
    // TODO: 實現配方更新邏輯
    sendSuccess(['message' => '配方更新功能待實現']);
}

/**
 * 刪除配方
 */
function handleDeleteRecipe($recipeId) {
    global $auth, $currentUser;
    
    // 只有管理員可以刪除配方
    if (!$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    // TODO: 實現配方刪除邏輯
    sendSuccess(['message' => '配方刪除功能待實現']);
}

/**
 * 獲取配方分類
 */
function handleGetCategories() {
    $recipe = new Recipe();
    $categories = $recipe->getCategories();
    
    sendSuccess(['categories' => $categories]);
}

/**
 * 發送成功響應
 */
function sendSuccess($data) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * 發送錯誤響應
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
}

/**
 * 發送400錯誤請求
 */
function sendBadRequest($message) {
    sendError($message, 400);
}

/**
 * 發送404未找到
 */
function sendNotFound($message = '資源未找到') {
    sendError($message, 404);
}

/**
 * 發送405方法不允許
 */
function sendMethodNotAllowed() {
    sendError('方法不允許', 405);
}
?>

