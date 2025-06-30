const axios = require('axios');

// 測試配置
const API_BASE_URL = 'http://169.254.0.21:8000/api';
const TEST_USERS = [
  { username: 'admin', password: 'password123', role: 'super_admin' },
  { username: 'chef_wang', password: 'password123', role: 'chef' },
  { username: 'staff_chen', password: 'password123', role: 'staff' }
];

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 測試工具函數
function logTest(testName, success, message = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: ${message}`);
    testResults.failed++;
    testResults.errors.push(`${testName}: ${message}`);
  }
}

// 主測試函數
async function runComprehensiveTests() {
  console.log('=== 配方排班管理系統 - 綜合測試 ===\n');
  
  try {
    // 1. 測試API根路徑
    await testAPIRoot();
    
    // 2. 測試用戶認證
    await testAuthentication();
    
    // 3. 測試配方管理
    await testRecipeManagement();
    
    // 4. 測試排班管理
    await testScheduleManagement();
    
    // 5. 測試權限控制
    await testPermissions();
    
    // 輸出測試結果
    console.log('\n=== 測試結果 ===');
    console.log(`通過: ${testResults.passed}`);
    console.log(`失敗: ${testResults.failed}`);
    console.log(`總計: ${testResults.passed + testResults.failed}`);
    
    if (testResults.failed > 0) {
      console.log('\n失敗的測試:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`\n測試完成率: ${(testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('測試執行失敗:', error.message);
  }
}

// 測試API根路徑
async function testAPIRoot() {
  console.log('1. 測試API根路徑...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    logTest('API根路徑訪問', response.data.success && response.data.message);
  } catch (error) {
    logTest('API根路徑訪問', false, error.message);
  }
}

// 測試用戶認證
async function testAuthentication() {
  console.log('\n2. 測試用戶認證...');
  
  for (const user of TEST_USERS) {
    try {
      // 測試登錄
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: user.username,
        password: user.password
      });
      
      logTest(`${user.username} 登錄`, loginResponse.data.success);
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        
        // 測試獲取用戶資料
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        logTest(`${user.username} 獲取資料`, profileResponse.data.success);
        
        // 驗證角色
        const actualRole = profileResponse.data.data.user.role;
        logTest(`${user.username} 角色驗證`, actualRole === user.role, `期望: ${user.role}, 實際: ${actualRole}`);
      }
      
    } catch (error) {
      logTest(`${user.username} 認證測試`, false, error.response?.data?.message || error.message);
    }
  }
}

// 測試配方管理
async function testRecipeManagement() {
  console.log('\n3. 測試配方管理...');
  
  try {
    // 使用管理員token
    const adminToken = await getToken('admin', 'password123');
    
    // 測試獲取配方列表
    const recipesResponse = await axios.get(`${API_BASE_URL}/recipes`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    logTest('獲取配方列表', recipesResponse.data.success);
    
    if (recipesResponse.data.success && recipesResponse.data.data.recipes.length > 0) {
      const firstRecipe = recipesResponse.data.data.recipes[0];
      
      // 測試獲取配方詳情
      const recipeDetailResponse = await axios.get(`${API_BASE_URL}/recipes/${firstRecipe.id}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      logTest('獲取配方詳情', recipeDetailResponse.data.success);
    }
    
    // 測試獲取配方分類
    const categoriesResponse = await axios.get(`${API_BASE_URL}/recipes/categories`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    logTest('獲取配方分類', categoriesResponse.data.success);
    
  } catch (error) {
    logTest('配方管理測試', false, error.response?.data?.message || error.message);
  }
}

// 測試排班管理
async function testScheduleManagement() {
  console.log('\n4. 測試排班管理...');
  
  try {
    // 使用管理員token
    const adminToken = await getToken('admin', 'password123');
    
    // 測試獲取排班列表
    const schedulesResponse = await axios.get(`${API_BASE_URL}/schedules`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    logTest('獲取排班列表', schedulesResponse.data.success);
    
    // 測試獲取個人排班
    const mySchedulesResponse = await axios.get(`${API_BASE_URL}/schedules/my`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    logTest('獲取個人排班', mySchedulesResponse.data.success);
    
    // 測試獲取排班統計
    const statsResponse = await axios.get(`${API_BASE_URL}/schedules/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    logTest('獲取排班統計', statsResponse.data.success);
    
  } catch (error) {
    logTest('排班管理測試', false, error.response?.data?.message || error.message);
  }
}

// 測試權限控制
async function testPermissions() {
  console.log('\n5. 測試權限控制...');
  
  try {
    // 測試員工權限限制
    const staffToken = await getToken('staff_chen', 'password123');
    
    // 員工不應該能訪問用戶管理
    try {
      await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      logTest('員工訪問用戶管理限制', false, '員工不應該能訪問用戶管理');
    } catch (error) {
      if (error.response?.status === 403) {
        logTest('員工訪問用戶管理限制', true);
      } else {
        logTest('員工訪問用戶管理限制', false, error.message);
      }
    }
    
    // 員工不應該能訪問排班統計
    try {
      await axios.get(`${API_BASE_URL}/schedules/stats`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      logTest('員工訪問排班統計限制', false, '員工不應該能訪問排班統計');
    } catch (error) {
      if (error.response?.status === 403) {
        logTest('員工訪問排班統計限制', true);
      } else {
        logTest('員工訪問排班統計限制', false, error.message);
      }
    }
    
    // 測試無效token
    try {
      await axios.get(`${API_BASE_URL}/recipes`, {
        headers: { 'Authorization': 'Bearer invalid_token' }
      });
      logTest('無效token拒絕', false, '無效token應該被拒絕');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('無效token拒絕', true);
      } else {
        logTest('無效token拒絕', false, error.message);
      }
    }
    
  } catch (error) {
    logTest('權限控制測試', false, error.message);
  }
}

// 獲取用戶token
async function getToken(username, password) {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    username,
    password
  });
  
  if (response.data.success) {
    return response.data.data.token;
  } else {
    throw new Error('登錄失敗');
  }
}

// 運行測試
runComprehensiveTests();

