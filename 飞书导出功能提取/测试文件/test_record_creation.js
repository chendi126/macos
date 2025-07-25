// 测试记录创建功能
const axios = require('axios');

// 飞书配置
const config = {
  appId: 'cli_a808ad9d0878d00c',
  appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
  appToken: 'WuYSbjMu8avijdsKwlpcgQOInUv',
  tableId: 'tblIcUV8Fz6JuQ7J'
};

let accessToken = null;

// 获取访问令牌
async function getAccessToken() {
  try {
    console.log('🔑 获取访问令牌...');
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

// 创建测试记录
async function createTestRecord() {
  try {
    console.log('📝 创建测试记录...');
    
    const testRecord = {
      fields: {
        '应用名称': '测试应用',
        '使用时长': 90, // 90分钟
        '日期': Date.now(), // 使用时间戳
        '占比': 25,
        '总结': '这是一个测试记录 - 用于验证API功能'
      }
    };

    console.log('记录数据:', JSON.stringify(testRecord, null, 2));

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
      testRecord,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`响应状态: ${response.status}`);
    console.log(`响应代码: ${response.data.code}`);

    if (response.data.code === 0) {
      console.log('✅ 测试记录创建成功');
      console.log(`记录ID: ${response.data.data.record.record_id}`);
      return response.data.data.record;
    } else {
      console.log('❌ 测试记录创建失败');
      console.log(`错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建测试记录失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 批量创建测试记录
async function createBatchRecords() {
  try {
    console.log('📝 批量创建测试记录...');
    
    const testRecords = [
      {
        fields: {
          '应用名称': 'Chrome浏览器',
          '使用时长': 120,
          '日期': Date.now(),
          '占比': 40,
          '总结': 'Chrome浏览器 - 主要用于网页浏览和开发调试'
        }
      },
      {
        fields: {
          '应用名称': 'Visual Studio Code',
          '使用时长': 180,
          '日期': Date.now(),
          '占比': 60,
          '总结': 'VS Code - 代码编辑和开发工作'
        }
      }
    ];

    console.log('批量记录数据:', JSON.stringify(testRecords, null, 2));

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

    console.log(`响应状态: ${response.status}`);
    console.log(`响应代码: ${response.data.code}`);

    if (response.data.code === 0) {
      console.log('✅ 批量记录创建成功');
      console.log(`创建记录数: ${response.data.data.records.length}`);
      response.data.data.records.forEach((record, index) => {
        console.log(`  记录${index + 1} ID: ${record.record_id}`);
      });
      return response.data.data.records;
    } else {
      console.log('❌ 批量记录创建失败');
      console.log(`错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 批量创建记录失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 查询最新记录
async function queryLatestRecords() {
  try {
    console.log('🔍 查询最新记录...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 5
        }
      }
    );

    console.log(`响应状态: ${response.status}`);
    console.log(`响应代码: ${response.data.code}`);

    if (response.data.code === 0) {
      console.log('✅ 记录查询成功');
      console.log(`总记录数: ${response.data.data.total}`);
      console.log(`返回记录数: ${response.data.data.items.length}`);
      
      response.data.data.items.forEach((record, index) => {
        console.log(`记录${index + 1}:`);
        console.log(`  ID: ${record.record_id}`);
        console.log(`  应用名称: ${record.fields['应用名称'] || 'N/A'}`);
        console.log(`  使用时长: ${record.fields['使用时长'] || 'N/A'} 分钟`);
        console.log(`  日期: ${record.fields['日期'] || 'N/A'}`);
        console.log(`  占比: ${record.fields['占比'] || 'N/A'}%`);
      });
      
      return response.data.data.items;
    } else {
      console.log('❌ 记录查询失败');
      console.log(`错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 查询记录失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 主测试函数
async function runTest() {
  console.log('🚀 开始记录创建测试');
  console.log('===================');
  
  try {
    // 1. 获取访问令牌
    await getAccessToken();
    
    // 2. 创建单个测试记录
    const singleRecord = await createTestRecord();
    
    // 3. 批量创建测试记录
    const batchRecords = await createBatchRecords();
    
    // 4. 查询最新记录
    const latestRecords = await queryLatestRecords();
    
    console.log('\n📊 测试结果汇总:');
    console.log('================');
    console.log(`✅ 访问令牌: ${accessToken ? '获取成功' : '获取失败'}`);
    console.log(`✅ 单个记录: ${singleRecord ? '创建成功' : '创建失败'}`);
    console.log(`✅ 批量记录: ${batchRecords ? '创建成功' : '创建失败'}`);
    console.log(`✅ 记录查询: ${latestRecords ? '查询成功' : '查询失败'}`);
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = {
  getAccessToken,
  createTestRecord,
  createBatchRecords,
  queryLatestRecords,
  config
};
