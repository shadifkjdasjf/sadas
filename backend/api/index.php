<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 處理預檢請求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// 獲取請求路徑
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// 移除 /api 前綴
$path = preg_replace('#^/api#', '', $path);

// 路由分發
if (preg_match('#^/auth(/.*)?$#', $path, $matches)) {
    // 認證相關API
    $_SERVER['PATH_INFO'] = $matches[1] ?? '';
    require_once 'auth.php';
} elseif (preg_match('#^/users(/.*)?$#', $path, $matches)) {
    // 用戶管理API
    $_SERVER['PATH_INFO'] = $matches[1] ?? '';
    require_once 'users.php';
} elseif (preg_match('#^/recipes(/.*)?$#', $path, $matches)) {
    // 配方管理API
    $_SERVER['PATH_INFO'] = $matches[1] ?? '';
    require_once 'recipes.php';
} elseif (preg_match('#^/schedules(/.*)?$#', $path, $matches)) {
    // 排班管理API
    $_SERVER['PATH_INFO'] = $matches[1] ?? '';
    require_once 'schedules.php';
} elseif (preg_match('#^/leave-requests(/.*)?$#', $path, $matches)) {
    // 請假申請API
    $_SERVER['PATH_INFO'] = $matches[1] ?? '';
    require_once 'leave_requests.php';
} elseif ($path === '' || $path === '/') {
    // API根路徑
    echo json_encode([
        'success' => true,
        'message' => '配方排班管理系統 API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/auth',
            'users' => '/api/users',
            'recipes' => '/api/recipes',
            'schedules' => '/api/schedules',
            'leave_requests' => '/api/leave-requests'
        ]
    ]);
} else {
    // 404 未找到
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'API端點未找到'
    ]);
}
?>

