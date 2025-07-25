// 测试应用使用汇总数据导出
const axios = require('axios');

const config = {
  appId: 'cli_a808ad9d0878d00c',
  appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
  appToken: 'WuYSbjMu8avijdsKwlpcgQOInUv',
  summaryTableId: 'tblzplhyYamB0XvW'
};

let accessToken = null;

// 获取访问令牌
async function getAccessToken() {
  try {
    const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: config.appId,
      app_secret: config.appSecret
    });

    if (response.data.code === 0) {
      accessToken = response.data.tenant_access_token;
      return accessToken;
    } else {
      throw new Error(`获取访问令牌失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('获取访问令牌失败:', error.message);
    throw error;
  }
}

// 模拟应用使用汇总数据导出
async function testAppUsageSummaryExport() {
  try {
    console.log('正在测试应用使用汇总数据导出...');
    
    // 模拟应用使用数据（8.5小时总时长）
    const totalTimeMs = 8.5 * 60 * 60 * 1000; // 8.5小时转换为毫秒
    const totalHours = totalTimeMs / (1000 * 60 * 60);
    
    console.log(`模拟数据: 总时长 ${totalTimeMs} 毫秒 = ${totalHours} 小时`);
    
    const summaryRecord = {
      fields: {
        '总时长': Math.round(totalHours * 100) / 100, // 保留2位小数
        '专注时长': Math.round(totalHours * 100) / 100, // 假设全部为专注时长
        '分心时长': 0.0, // 应用使用数据中没有分心概念，设为0
        '效率得分': 1.0 // 假设效率为100%
      }
    };

    console.log('准备导出的数据:', JSON.stringify(summaryRecord, null, 2));

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records`,
      summaryRecord,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 应用使用汇总数据导出成功');
      console.log(`   记录ID: ${response.data.data.record.record_id}`);
      return true;
    } else {
      throw new Error(`应用使用汇总数据导出失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 应用使用汇总数据导出失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 测试边界情况
async function testEdgeCases() {
  console.log('\n正在测试边界情况...');
  
  const testCases = [
    {
      name: "小时长数据",
      totalHours: 0.1
    },
    {
      name: "整数小时",
      totalHours: 5.0
    },
    {
      name: "大数值",
      totalHours: 24.0
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n测试 ${testCase.name} (${testCase.totalHours} 小时):`);
      
      const summaryRecord = {
        fields: {
          '总时长': testCase.totalHours,
          '专注时长': testCase.totalHours,
          '分心时长': 0.0,
          '效率得分': 1.0
        }
      };

      const response = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records`,
        summaryRecord,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        console.log(`✅ ${testCase.name} 成功`);
      } else {
        console.log(`❌ ${testCase.name} 失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} 错误: ${error.message}`);
    }
  }
}

// 查询记录数
async function queryRecordCount() {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 1
        }
      }
    );

    if (response.data.code === 0) {
      console.log(`\n📊 汇总表当前记录数: ${response.data.data.total}`);
      return response.data.data.total;
    }
  } catch (error) {
    console.log('❌ 查询记录数失败:', error.message);
  }
  return 0;
}

// 主函数
async function main() {
  try {
    console.log('🧪 测试应用使用汇总数据导出');
    console.log('============================');
    
    await getAccessToken();
    console.log('✅ 访问令牌获取成功');
    
    // 查询初始记录数
    const initialCount = await queryRecordCount();
    
    // 测试基本导出
    const basicSuccess = await testAppUsageSummaryExport();
    
    // 测试边界情况
    await testEdgeCases();
    
    // 查询最终记录数
    const finalCount = await queryRecordCount();
    
    console.log('\n📊 测试结果汇总:');
    console.log('================');
    console.log(`✅ 访问令牌: 获取成功`);
    console.log(`${basicSuccess ? '✅' : '❌'} 基本导出: ${basicSuccess ? '成功' : '失败'}`);
    console.log(`📈 记录数变化: ${initialCount} → ${finalCount} (+${finalCount - initialCount})`);
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

main();
