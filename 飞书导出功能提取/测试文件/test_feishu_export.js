// 测试飞书多维表格导出功能
const axios = require('axios');

// 飞书配置
const config = {
  appId: 'cli_a808ad9d0878d00c',
  appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
  appToken: 'WuYSbjMu8avijdsKwlpcgQOInUv',
  tableId: 'tblIcUV8Fz6JuQ7J', // 应用详细数据表
  summaryTableId: 'tblzplhyYamB0XvW', // 汇总数据表
  blockTypeId: 'blk_68821180a94000030d5cde2e'
};

let accessToken = null;

// 获取访问令牌
async function getAccessToken() {
  try {
    console.log('正在获取访问令牌...');
    const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: config.appId,
      app_secret: config.appSecret
    });

    if (response.data.code === 0) {
      accessToken = response.data.tenant_access_token;
      console.log('✅ 访问令牌获取成功');
      return accessToken;
    } else {
      throw new Error(`获取访问令牌失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 获取访问令牌失败:', error.message);
    throw error;
  }
}

// 测试表格连接
async function testTableConnection() {
  try {
    console.log('正在测试应用连接...');

    // 测试获取应用信息
    const appResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (appResponse.data.code === 0) {
      console.log('✅ 应用连接成功');
      console.log(`   应用名称: ${appResponse.data.data.app.name}`);

      // 测试获取应用详细数据表字段信息
      console.log('正在测试应用详细数据表字段获取...');
      const appFieldsResponse = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/fields`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (appFieldsResponse.data.code === 0) {
        console.log('✅ 应用详细数据表字段获取成功');
        console.log(`   字段数量: ${appFieldsResponse.data.data.items.length}`);

        // 测试获取汇总数据表字段信息
        console.log('正在测试汇总数据表字段获取...');
        const summaryFieldsResponse = await axios.get(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/fields`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (summaryFieldsResponse.data.code === 0) {
          console.log('✅ 汇总数据表字段获取成功');
          console.log(`   字段数量: ${summaryFieldsResponse.data.data.items.length}`);
          return true;
        } else {
          throw new Error(`汇总数据表字段获取失败: ${summaryFieldsResponse.data.msg}`);
        }
      } else {
        throw new Error(`应用详细数据表字段获取失败: ${appFieldsResponse.data.msg}`);
      }
    } else {
      throw new Error(`应用连接失败: ${appResponse.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   错误详情:`, error.response.data);
    }
    return false;
  }
}

// 创建应用详细数据测试记录
async function createTestRecord() {
  try {
    console.log('正在创建应用详细数据测试记录...');

    const testRecord = {
      fields: {
        '应用名称': '测试应用',
        '使用时长': 1.5, // 小时数（1.5小时）
        '日期': Date.now(), // 毫秒级时间戳
        '占比': 0.3 // 小数形式（0.3表示30%）
      }
    };

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
      {
        fields: testRecord.fields
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 应用详细数据测试记录创建成功');
      console.log(`   记录ID: ${response.data.data.record.record_id}`);
      return response.data.data.record.record_id;
    } else {
      throw new Error(`创建记录失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 创建应用详细数据测试记录失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 创建汇总数据测试记录
async function createSummaryTestRecord() {
  try {
    console.log('正在创建汇总数据测试记录...');

    const summaryRecord = {
      fields: {
        '总时长': 8.5, // 小时数
        '专注时长': 6.8, // 小时数
        '分心时长': 1.7, // 小时数
        '效率得分': 0.8 // 效率得分（小数形式，0.8表示80%）
      }
    };

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records`,
      {
        fields: summaryRecord.fields
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 汇总数据测试记录创建成功');
      console.log(`   记录ID: ${response.data.data.record.record_id}`);
      return response.data.data.record.record_id;
    } else {
      throw new Error(`创建汇总记录失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 创建汇总数据测试记录失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 批量创建测试记录
async function createBatchTestRecords() {
  try {
    console.log('正在批量创建测试记录...');
    
    const testRecords = [];
    for (let i = 1; i <= 3; i++) {
      testRecords.push({
        fields: {
          '应用名称': `测试应用${i}`,
          '使用时长': i * 0.5, // 小时数（0.5, 1.0, 1.5小时）
          '日期': Date.now(), // 毫秒级时间戳
          '占比': i * 0.1 // 小数形式（0.1, 0.2, 0.3）
        }
      });
    }

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records/batch_create`,
      {
        records: testRecords
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 批量测试记录创建成功');
      console.log(`   创建记录数: ${response.data.data.records.length}`);
      return response.data.data.records;
    } else {
      throw new Error(`批量创建记录失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 批量创建测试记录失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 查询记录
async function queryRecords() {
  try {
    console.log('正在查询记录...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 10
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 记录查询成功');
      console.log(`   总记录数: ${response.data.data.total}`);
      console.log(`   返回记录数: ${response.data.data.items.length}`);
      
      if (response.data.data.items.length > 0) {
        console.log('   最新记录:');
        const latestRecord = response.data.data.items[0];
        console.log(`     记录ID: ${latestRecord.record_id}`);
        console.log(`     记录类型: ${latestRecord.fields['记录类型'] || 'N/A'}`);
        console.log(`     应用名称: ${latestRecord.fields['应用名称'] || 'N/A'}`);
      }
      
      return response.data.data.items;
    } else {
      throw new Error(`查询记录失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 查询记录失败:', error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始飞书多维表格导出功能测试');
  console.log('=====================================');
  
  try {
    // 1. 获取访问令牌
    await getAccessToken();
    
    // 2. 测试表格连接
    const connectionSuccess = await testTableConnection();
    if (!connectionSuccess) {
      console.log('❌ 表格连接失败，终止测试');
      return;
    }
    
    // 3. 创建应用详细数据测试记录
    const recordId = await createTestRecord();

    // 4. 创建汇总数据测试记录
    const summaryRecordId = await createSummaryTestRecord();

    // 5. 批量创建测试记录
    const batchRecords = await createBatchTestRecords();
    
    // 6. 查询记录
    const records = await queryRecords();

    console.log('\n📊 测试结果汇总:');
    console.log('================');
    console.log(`✅ 访问令牌: ${accessToken ? '获取成功' : '获取失败'}`);
    console.log(`✅ 表格连接: ${connectionSuccess ? '连接成功' : '连接失败'}`);
    console.log(`✅ 应用详细记录: ${recordId ? '创建成功' : '创建失败'}`);
    console.log(`✅ 汇总数据记录: ${summaryRecordId ? '创建成功' : '创建失败'}`);
    console.log(`✅ 批量记录: ${batchRecords ? '创建成功' : '创建失败'}`);
    console.log(`✅ 记录查询: ${records ? '查询成功' : '查询失败'}`);
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  getAccessToken,
  testTableConnection,
  createTestRecord,
  createBatchTestRecords,
  queryRecords,
  config
};
