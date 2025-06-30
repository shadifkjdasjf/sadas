<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 處理預檢請求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../models/Schedule.php';
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
    // /api/schedules
    switch ($method) {
        case 'GET':
            handleGetSchedules();
            break;
        case 'POST':
            handleCreateSchedule();
            break;
        default:
            sendMethodNotAllowed();
            break;
    }
} elseif ($path === '/my') {
    // /api/schedules/my
    if ($method === 'GET') {
        handleGetMySchedules();
    } else {
        sendMethodNotAllowed();
    }
} elseif ($path === '/stats') {
    // /api/schedules/stats
    if ($method === 'GET') {
        handleGetStats();
    } else {
        sendMethodNotAllowed();
    }
} else {
    // /api/schedules/{id}
    $pathParts = explode('/', trim($path, '/'));
    $scheduleId = $pathParts[0] ?? null;
    
    if (!is_numeric($scheduleId)) {
        sendNotFound();
        return;
    }
    
    switch ($method) {
        case 'GET':
            handleGetSchedule($scheduleId);
            break;
        case 'PUT':
            handleUpdateSchedule($scheduleId);
            break;
        case 'DELETE':
            handleDeleteSchedule($scheduleId);
            break;
        default:
            sendMethodNotAllowed();
            break;
    }
}

/**
 * 獲取排班列表
 */
function handleGetSchedules() {
    global $currentUser;
    
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 50;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    
    $schedule = new Schedule();
    $schedules = $schedule->getAll($currentUser['role'], $currentUser['id'], $startDate, $endDate, $page, $limit);
    $total = $schedule->getCount($currentUser['role'], $currentUser['id'], $startDate, $endDate);
    
    sendSuccess([
        'schedules' => $schedules,
        'pagination' => [
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * 獲取個人排班
 */
function handleGetMySchedules() {
    global $currentUser;
    
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    
    $schedule = new Schedule();
    $schedules = $schedule->getMySchedules($currentUser['id'], $startDate, $endDate);
    
    sendSuccess(['schedules' => $schedules]);
}

/**
 * 獲取排班統計
 */
function handleGetStats() {
    global $auth, $currentUser;
    
    // 只有管理員可以查看統計
    if (!$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $startDate = $_GET['start_date'] ?? date('Y-m-01'); // 默認本月開始
    $endDate = $_GET['end_date'] ?? date('Y-m-t'); // 默認本月結束
    
    $schedule = new Schedule();
    $stats = $schedule->getStats($startDate, $endDate);
    
    sendSuccess(['stats' => $stats]);
}

/**
 * 獲取單個排班詳情
 */
function handleGetSchedule($scheduleId) {
    global $currentUser;
    
    $schedule = new Schedule();
    $scheduleData = $schedule->getById($scheduleId);
    
    if (!$scheduleData) {
        sendNotFound('排班不存在');
        return;
    }
    
    // 權限檢查：員工只能查看自己的排班
    if ($currentUser['role'] === 'staff' && $scheduleData['user_id'] != $currentUser['id']) {
        sendForbidden('權限不足');
        return;
    }
    
    sendSuccess(['schedule' => $scheduleData]);
}

/**
 * 創建排班
 */
function handleCreateSchedule() {
    global $auth, $currentUser;
    
    // 只有管理員可以創建排班
    if (!$auth->checkRole(['admin', 'super_admin'])) {
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // 驗證必填字段
    $required = ['user_id', 'shift_date', 'shift_type', 'start_time', 'end_time'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendBadRequest("字段 {$field} 不能為空");
            return;
        }
    }
    
    // 驗證班次類型
    $validShiftTypes = ['morning', 'afternoon', 'evening'];
    if (!in_array($input['shift_type'], $validShiftTypes)) {
        sendBadRequest('無效的班次類型');
        return;
    }
    
    // 驗證狀態
    if (isset($input['status'])) {
        $validStatuses = ['scheduled', 'confirmed', 'completed', 'absent'];
        if (!in_array($input['status'], $validStatuses)) {
            sendBadRequest('無效的排班狀態');
            return;
        }
    }
    
    try {
        $schedule = new Schedule();
        $scheduleId = $schedule->create($input, $currentUser['id']);
        
        if ($scheduleId) {
            $auth->logActivity('創建排班', 'schedules', $scheduleId, null, $input);
            sendSuccess([
                'message' => '排班創建成功',
                'schedule_id' => $scheduleId
            ]);
        } else {
            sendError('排班創建失敗', 500);
        }
    } catch (Exception $e) {
        sendError('排班創建失敗: ' . $e->getMessage(), 400);
    }
}

/**
 * 更新排班
 */
function handleUpdateSchedule($scheduleId) {
    global $auth, $currentUser;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input)) {
        sendBadRequest('沒有提供更新數據');
        return;
    }
    
    try {
        $schedule = new Schedule();
        $originalSchedule = $schedule->getById($scheduleId);
        
        if (!$originalSchedule) {
            sendNotFound('排班不存在');
            return;
        }
        
        if ($schedule->update($scheduleId, $input, $currentUser['role'], $currentUser['id'])) {
            $auth->logActivity('更新排班', 'schedules', $scheduleId, $originalSchedule, $input);
            sendSuccess(['message' => '排班更新成功']);
        } else {
            sendError('排班更新失敗', 500);
        }
    } catch (Exception $e) {
        sendError('排班更新失敗: ' . $e->getMessage(), 400);
    }
}

/**
 * 刪除排班
 */
function handleDeleteSchedule($scheduleId) {
    global $auth, $currentUser;
    
    try {
        $schedule = new Schedule();
        $scheduleData = $schedule->getById($scheduleId);
        
        if (!$scheduleData) {
            sendNotFound('排班不存在');
            return;
        }
        
        if ($schedule->delete($scheduleId, $currentUser['role'], $currentUser['id'])) {
            $auth->logActivity('刪除排班', 'schedules', $scheduleId, $scheduleData, null);
            sendSuccess(['message' => '排班刪除成功']);
        } else {
            sendError('排班刪除失敗', 500);
        }
    } catch (Exception $e) {
        sendError('排班刪除失敗: ' . $e->getMessage(), 400);
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

