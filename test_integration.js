const axios = require('axios');

// 測試API集成
async function testAPIIntegration() {
  const API_BASE_URL = 'http://169.254.0.21:8000/api';
  
  console.log('=== API集成測試 ===\n');
  
  try {
    // 測試API根路徑
    console.log('1. 測試API根路徑...');
    const rootResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ API根路徑正常:', rootResponse.data.message);
    
    // 測試用戶登錄
    console.log('\n2. 測試用戶登錄...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登錄成功');
      console.log('   用戶:', loginResponse.data.data.user.full_name);
      console.log('   角色:', loginResponse.data.data.user.role);
      
      const token = loginResponse.data.data.token;
      
      // 測試獲取用戶資料
      console.log('\n3. 測試獲取用戶資料...');
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ 獲取用戶資料成功');
        console.log('   用戶ID:', profileResponse.data.data.user.id);
      }
      
      // 測試用戶列表（管理員權限）
      console.log('\n4. 測試用戶列表...');
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.data.success) {
        console.log('✅ 獲取用戶列表成功');
        console.log('   用戶數量:', usersResponse.data.data.users.length);
      }
      
    } else {
      console.log('❌ 登錄失敗:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ 測試失敗:', error.response?.data?.message || error.message);
  }
  
  console.log('\n=== 測試完成 ===');
}

// 運行測試
testAPIIntegration();

