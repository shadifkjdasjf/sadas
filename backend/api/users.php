<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 處理預檢請求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../models/User.php';
require_once '../middleware/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

// 認證檢查
$auth = new AuthMiddleware();
if (!$auth->authenticate()) {
    exit;
}

// 路由處理
if ($path === '' || $path === '/') {
    // /api/users
    switch ($method) {
        case 'GET':
            handleGetUsers();
            break;
        case 'POST':
            handleCreateUser();
            break;
        default:
            sendMethodNotAllowed();
            break;
    }
} else {
    // /api/users/{id}
    $pathParts = explode('/', trim($path, '/'));
    $userId = $pathParts[0] ?? null;
    
    if (!is_numeric($userId)) {
        sendNotFound();
        return;
    }
    
    switch ($method) {
        case 'GET':
            handleGetUser($userId);
            break;
        case 'PUT':
            handleUpdateUser($userId);
            break;
        case 'DELETE':
            handleDeleteUser($userId);
            break;
        default:
            sendMethodNotAllowed();
            break;
    }
}

/**
 * 獲取用戶列表
 */
function handleGetUsers() {
    global $auth;
    
    // 只有管理員可以查看用戶列表
    if (!$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 20;
    
    $user = new User();
    $users = $user->getAll($page, $limit);
    $total = $user->getCount();
    
    sendSuccess([
        'users' => $users,
        'pagination' => [
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * 獲取單個用戶
 */
function handleGetUser($userId) {
    global $auth;
    
    // 用戶只能查看自己的信息，管理員可以查看所有用戶
    $currentUser = $GLOBALS['current_user'];
    if ($currentUser['id'] != $userId && !$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $user = new User();
    $userData = $user->getById($userId);
    
    if ($userData) {
        sendSuccess(['user' => $userData]);
    } else {
        sendNotFound('用戶不存在');
    }
}

/**
 * 創建用戶
 */
function handleCreateUser() {
    global $auth;
    
    // 只有管理員可以創建用戶
    if (!$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // 驗證必填字段
    $required = ['username', 'email', 'password', 'role', 'full_name'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendBadRequest("字段 {$field} 不能為空");
            return;
        }
    }
    
    // 驗證角色
    $validRoles = ['staff', 'chef', 'admin', 'super_admin'];
    if (!in_array($input['role'], $validRoles)) {
        sendBadRequest('無效的用戶角色');
        return;
    }
    
    // 只有超級管理員可以創建管理員
    if ($input['role'] === 'super_admin' && !$auth->checkRole(['super_admin'])) {
        sendForbidden('權限不足，無法創建超級管理員');
        return;
    }
    
    $user = new User();
    
    // 檢查用戶名是否已存在
    if ($user->usernameExists($input['username'])) {
        sendBadRequest('用戶名已存在');
        return;
    }
    
    // 檢查郵箱是否已存在
    if ($user->emailExists($input['email'])) {
        sendBadRequest('郵箱已存在');
        return;
    }
    
    $userId = $user->create($input);
    
    if ($userId) {
        $auth->logActivity('創建用戶', 'users', $userId, null, $input);
        sendSuccess([
            'message' => '用戶創建成功',
            'user_id' => $userId
        ]);
    } else {
        sendError('用戶創建失敗', 500);
    }
}

/**
 * 更新用戶
 */
function handleUpdateUser($userId) {
    global $auth;
    
    $currentUser = $GLOBALS['current_user'];
    
    // 用戶只能更新自己的信息，管理員可以更新所有用戶
    if ($currentUser['id'] != $userId && !$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input)) {
        sendBadRequest('沒有提供更新數據');
        return;
    }
    
    $user = new User();
    
    // 獲取原始用戶數據
    $originalUser = $user->getById($userId);
    if (!$originalUser) {
        sendNotFound('用戶不存在');
        return;
    }
    
    // 檢查權限限制
    if (isset($input['role'])) {
        // 只有管理員可以修改角色
        if (!$auth->checkRole(['admin', 'super_admin'])) {
            sendForbidden('權限不足，無法修改用戶角色');
            return;
        }
        
        // 只有超級管理員可以設置超級管理員角色
        if ($input['role'] === 'super_admin' && !$auth->checkRole(['super_admin'])) {
            sendForbidden('權限不足，無法設置超級管理員角色');
            return;
        }
    }
    
    // 檢查用戶名唯一性
    if (isset($input['username']) && $user->usernameExists($input['username'], $userId)) {
        sendBadRequest('用戶名已存在');
        return;
    }
    
    // 檢查郵箱唯一性
    if (isset($input['email']) && $user->emailExists($input['email'], $userId)) {
        sendBadRequest('郵箱已存在');
        return;
    }
    
    if ($user->update($userId, $input)) {
        $auth->logActivity('更新用戶', 'users', $userId, $originalUser, $input);
        sendSuccess(['message' => '用戶更新成功']);
    } else {
        sendError('用戶更新失敗', 500);
    }
}

/**
 * 刪除用戶
 */
function handleDeleteUser($userId) {
    global $auth;
    
    // 只有管理員可以刪除用戶
    if (!$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $currentUser = $GLOBALS['current_user'];
    
    // 不能刪除自己
    if ($currentUser['id'] == $userId) {
        sendBadRequest('不能刪除自己的帳號');
        return;
    }
    
    $user = new User();
    $userData = $user->getById($userId);
    
    if (!$userData) {
        sendNotFound('用戶不存在');
        return;
    }
    
    if ($user->delete($userId)) {
        $auth->logActivity('刪除用戶', 'users', $userId, $userData, null);
        sendSuccess(['message' => '用戶刪除成功']);
    } else {
        sendError('用戶刪除失敗', 500);
    }
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
 * 發送403禁止訪問
 */
function sendForbidden($message) {
    sendError($message, 403);
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

