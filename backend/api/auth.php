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
require_once '../utils/JWT.php';
require_once '../middleware/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

// 路由處理
switch ($path) {
    case '/login':
        if ($method === 'POST') {
            handleLogin();
        } else {
            sendMethodNotAllowed();
        }
        break;
        
    case '/logout':
        if ($method === 'POST') {
            handleLogout();
        } else {
            sendMethodNotAllowed();
        }
        break;
        
    case '/profile':
        if ($method === 'GET') {
            handleGetProfile();
        } else {
            sendMethodNotAllowed();
        }
        break;
        
    case '/refresh':
        if ($method === 'POST') {
            handleRefreshToken();
        } else {
            sendMethodNotAllowed();
        }
        break;
        
    default:
        sendNotFound();
        break;
}

/**
 * 處理用戶登錄
 */
function handleLogin() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        sendBadRequest('用戶名和密碼不能為空');
        return;
    }
    
    $user = new User();
    $userData = $user->login($input['username'], $input['password']);
    
    if ($userData) {
        $token = JWT::generateUserToken($userData);
        
        // 記錄登錄日誌
        $auth = new AuthMiddleware();
        $GLOBALS['current_user'] = $userData;
        $auth->logActivity('用戶登錄');
        
        sendSuccess([
            'message' => '登錄成功',
            'token' => $token,
            'user' => $userData
        ]);
    } else {
        sendUnauthorized('用戶名或密碼錯誤');
    }
}

/**
 * 處理用戶登出
 */
function handleLogout() {
    $auth = new AuthMiddleware();
    
    if ($auth->authenticate()) {
        $auth->logActivity('用戶登出');
        sendSuccess(['message' => '登出成功']);
    }
}

/**
 * 獲取用戶資料
 */
function handleGetProfile() {
    $auth = new AuthMiddleware();
    
    if ($auth->authenticate()) {
        $user = new User();
        $userData = $user->getById($GLOBALS['current_user']['id']);
        
        if ($userData) {
            sendSuccess([
                'user' => $userData
            ]);
        } else {
            sendNotFound('用戶不存在');
        }
    }
}

/**
 * 刷新Token
 */
function handleRefreshToken() {
    $auth = new AuthMiddleware();
    
    if ($auth->authenticate()) {
        $newToken = JWT::generateUserToken($GLOBALS['current_user']);
        
        sendSuccess([
            'message' => 'Token刷新成功',
            'token' => $newToken
        ]);
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
 * 發送401未授權
 */
function sendUnauthorized($message) {
    sendError($message, 401);
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

