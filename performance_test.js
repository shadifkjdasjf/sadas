const axios = require('axios');

// 性能測試配置
const API_BASE_URL = 'http://169.254.0.21:8000/api';
const TEST_ITERATIONS = 10;

// 性能測試結果
let performanceResults = [];

// 測試單個API端點的性能
async function testEndpointPerformance(name, url, headers = {}) {
  const times = [];
  
  console.log(`測試 ${name}...`);
  
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const startTime = Date.now();
    
    try {
      await axios.get(url, { headers });
      const endTime = Date.now();
      times.push(endTime - startTime);
    } catch (error) {
      console.log(`  請求 ${i + 1} 失敗: ${error.message}`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const result = {
      endpoint: name,
      avgTime: Math.round(avgTime),
      minTime,
      maxTime,
      successRate: (times.length / TEST_ITERATIONS * 100).toFixed(1)
    };
    
    performanceResults.push(result);
    
    console.log(`  平均響應時間: ${result.avgTime}ms`);
    console.log(`  最快響應時間: ${result.minTime}ms`);
    console.log(`  最慢響應時間: ${result.maxTime}ms`);
    console.log(`  成功率: ${result.successRate}%`);
  }
  
  console.log('');
}

// 獲取認證token
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'password123'
    });
    
    if (response.data.success) {
      return response.data.data.token;
    }
  } catch (error) {
    console.error('獲取認證token失敗:', error.message);
  }
  
  return null;
}

// 主性能測試函數
async function runPerformanceTests() {
  console.log('=== 配方排班管理系統 - 性能測試 ===\n');
  console.log(`測試迭代次數: ${TEST_ITERATIONS}\n`);
  
  // 獲取認證token
  const token = await getAuthToken();
  if (!token) {
    console.error('無法獲取認證token，測試終止');
    return;
  }
  
  const authHeaders = { 'Authorization': `Bearer ${token}` };
  
  // 測試各個API端點
  await testEndpointPerformance('API根路徑', `${API_BASE_URL}/`);
  await testEndpointPerformance('用戶資料', `${API_BASE_URL}/auth/profile`, authHeaders);
  await testEndpointPerformance('配方列表', `${API_BASE_URL}/recipes`, authHeaders);
  await testEndpointPerformance('配方分類', `${API_BASE_URL}/recipes/categories`, authHeaders);
  await testEndpointPerformance('排班列表', `${API_BASE_URL}/schedules`, authHeaders);
  await testEndpointPerformance('個人排班', `${API_BASE_URL}/schedules/my`, authHeaders);
  
  // 輸出性能總結
  console.log('=== 性能測試總結 ===');
  console.log('端點\t\t\t平均響應時間\t成功率');
  console.log('─'.repeat(50));
  
  performanceResults.forEach(result => {
    const endpoint = result.endpoint.padEnd(20);
    const avgTime = `${result.avgTime}ms`.padEnd(12);
    const successRate = `${result.successRate}%`;
    console.log(`${endpoint}\t${avgTime}\t${successRate}`);
  });
  
  // 計算總體性能指標
  const totalAvgTime = performanceResults.reduce((sum, result) => sum + result.avgTime, 0) / performanceResults.length;
  const totalSuccessRate = performanceResults.reduce((sum, result) => sum + parseFloat(result.successRate), 0) / performanceResults.length;
  
  console.log('─'.repeat(50));
  console.log(`總體平均響應時間: ${Math.round(totalAvgTime)}ms`);
  console.log(`總體成功率: ${totalSuccessRate.toFixed(1)}%`);
  
  // 性能評估
  console.log('\n=== 性能評估 ===');
  if (totalAvgTime < 100) {
    console.log('✅ 響應時間優秀 (< 100ms)');
  } else if (totalAvgTime < 500) {
    console.log('✅ 響應時間良好 (< 500ms)');
  } else if (totalAvgTime < 1000) {
    console.log('⚠️  響應時間一般 (< 1000ms)');
  } else {
    console.log('❌ 響應時間需要優化 (> 1000ms)');
  }
  
  if (totalSuccessRate >= 99) {
    console.log('✅ 系統穩定性優秀 (≥ 99%)');
  } else if (totalSuccessRate >= 95) {
    console.log('✅ 系統穩定性良好 (≥ 95%)');
  } else if (totalSuccessRate >= 90) {
    console.log('⚠️  系統穩定性一般 (≥ 90%)');
  } else {
    console.log('❌ 系統穩定性需要改善 (< 90%)');
  }
}

// 運行性能測試
runPerformanceTests().catch(error => {
  console.error('性能測試執行失敗:', error.message);
});

