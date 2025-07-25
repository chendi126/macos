// 测试修复后的导出功能
const axios = require('axios');

const config = {
  appId: 'cli_a808ad9d0878d00c',
  appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
  appToken: 'WuYSbjMu8avijdsKwlpcgQOInUv',
  tableId: 'tblIcUV8Fz6JuQ7J', // 应用详细数据表
  summaryTableId: 'tblzplhyYamB0XvW' // 汇总数据表
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

// 模拟应用使用数据导出（只导出到应用详细数据表）
async function testAppUsageDataExport() {
  try {
    console.log('正在测试应用使用数据导出...');
    
    const appRecords = [
      {
        fields: {
          '应用名称': 'Chrome',
          '使用时长': 2.5,
          '日期': Date.now(),
          '占比': 0.4
        }
      },
      {
        fields: {
          '应用名称': 'VSCode',
          '使用时长': 1.8,
          '日期': Date.now(),
          '占比': 0.3
        }
      },
      {
        fields: {
          '应用名称': '微信',
          '使用时长': 1.2,
          '日期': Date.now(),
          '占比': 0.2
        }
      }
    ];

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records/batch_create`,
      {
        records: appRecords
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 应用使用数据导出成功');
      console.log(`   导出记录数: ${response.data.data.records.length}`);
      return true;
    } else {
      throw new Error(`应用使用数据导出失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 应用使用数据导出失败:', error.message);
    if (error.response) {
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 模拟工作模式会话数据导出（只导出到汇总数据表）
async function testWorkModeSessionExport() {
  try {
    console.log('正在测试工作模式会话数据导出...');
    
    const sessionRecords = [
      {
        fields: {
          '总时长': 8.5,
          '专注时长': 6.8,
          '分心时长': 1.7,
          '效率得分': 0.8
        }
      },
      {
        fields: {
          '总时长': 4.2,
          '专注时长': 3.8,
          '分心时长': 0.4,
          '效率得分': 0.9
        }
      }
    ];

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records/batch_create`,
      {
        records: sessionRecords
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 工作模式会话数据导出成功');
      console.log(`   导出记录数: ${response.data.data.records.length}`);
      return true;
    } else {
      throw new Error(`工作模式会话数据导出失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 工作模式会话数据导出失败:', error.message);
    if (error.response) {
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 查询两个表格的记录数
async function queryRecordCounts() {
  try {
    console.log('正在查询记录数...');
    
    // 查询应用详细数据表
    const appResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
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

    // 查询汇总数据表
    const summaryResponse = await axios.get(
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

    if (appResponse.data.code === 0 && summaryResponse.data.code === 0) {
      console.log('✅ 记录数查询成功');
      console.log(`   应用详细数据表记录数: ${appResponse.data.data.total}`);
      console.log(`   汇总数据表记录数: ${summaryResponse.data.data.total}`);
      return {
        appRecords: appResponse.data.data.total,
        summaryRecords: summaryResponse.data.data.total
      };
    } else {
      throw new Error('记录数查询失败');
    }
  } catch (error) {
    console.error('❌ 记录数查询失败:', error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('🧪 测试修复后的导出功能');
    console.log('========================');
    
    await getAccessToken();
    console.log('✅ 访问令牌获取成功\n');
    
    // 测试应用使用数据导出
    const appExportSuccess = await testAppUsageDataExport();
    console.log('');
    
    // 测试工作模式会话数据导出
    const sessionExportSuccess = await testWorkModeSessionExport();
    console.log('');
    
    // 查询记录数
    const recordCounts = await queryRecordCounts();
    
    console.log('\n📊 测试结果汇总:');
    console.log('================');
    console.log(`✅ 访问令牌: 获取成功`);
    console.log(`${appExportSuccess ? '✅' : '❌'} 应用使用数据导出: ${appExportSuccess ? '成功' : '失败'}`);
    console.log(`${sessionExportSuccess ? '✅' : '❌'} 工作模式会话数据导出: ${sessionExportSuccess ? '成功' : '失败'}`);
    console.log(`${recordCounts ? '✅' : '❌'} 记录数查询: ${recordCounts ? '成功' : '失败'}`);
    
    if (recordCounts) {
      console.log(`📈 当前记录数: 应用详细表 ${recordCounts.appRecords} 条, 汇总表 ${recordCounts.summaryRecords} 条`);
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
runTests();
