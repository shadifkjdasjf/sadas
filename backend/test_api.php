<?php
/**
 * API測試腳本
 */

// 測試數據庫連接
echo "=== 測試數據庫連接 ===\n";
try {
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "✅ 數據庫連接成功\n";
        
        // 測試查詢
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        echo "✅ 用戶表查詢成功，共有 {$result['count']} 個用戶\n";
    } else {
        echo "❌ 數據庫連接失敗\n";
    }
} catch (Exception $e) {
    echo "❌ 數據庫錯誤: " . $e->getMessage() . "\n";
}

echo "\n";

// 測試JWT工具
echo "=== 測試JWT工具 ===\n";
try {
    require_once 'utils/JWT.php';
    
    $testPayload = [
        'user_id' => 1,
        'username' => 'test',
        'role' => 'admin',
        'iat' => time(),
        'exp' => time() + 3600
    ];
    
    $token = JWT::encode($testPayload);
    echo "✅ JWT Token生成成功\n";
    
    $decoded = JWT::decode($token);
    if ($decoded && $decoded['user_id'] == 1) {
        echo "✅ JWT Token解碼成功\n";
    } else {
        echo "❌ JWT Token解碼失敗\n";
    }
} catch (Exception $e) {
    echo "❌ JWT錯誤: " . $e->getMessage() . "\n";
}

echo "\n";

// 測試用戶模型
echo "=== 測試用戶模型 ===\n";
try {
    require_once 'models/User.php';
    
    $user = new User();
    $users = $user->getAll(1, 5);
    
    if (is_array($users)) {
        echo "✅ 用戶模型查詢成功，獲取到 " . count($users) . " 個用戶\n";
        
        foreach ($users as $userData) {
            echo "  - {$userData['username']} ({$userData['role']})\n";
        }
    } else {
        echo "❌ 用戶模型查詢失敗\n";
    }
} catch (Exception $e) {
    echo "❌ 用戶模型錯誤: " . $e->getMessage() . "\n";
}

echo "\n=== 測試完成 ===\n";
?>

