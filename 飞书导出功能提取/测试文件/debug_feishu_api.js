// 调试飞书API连接问题
const axios = require('axios');

// 飞书配置
const config = {
  appId: 'cli_a808ad9d0878d00c',
  appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
  appToken: 'WuYSbjMu8avijdsKwlpcgQOInUv',
  tableId: 'tblIcUV8Fz6JuQ7J',
  blockTypeId: 'blk_68821180a94000030d5cde2e'
};

let accessToken = null;

// 获取访问令牌
async function getAccessToken() {
  try {
    console.log('🔑 正在获取访问令牌...');
    console.log(`   App ID: ${config.appId}`);
    
    const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: config.appId,
      app_secret: config.appSecret
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   响应状态: ${response.status}`);
    console.log(`   响应代码: ${response.data.code}`);
    
    if (response.data.code === 0) {
      accessToken = response.data.tenant_access_token;
      console.log('✅ 访问令牌获取成功');
      console.log(`   令牌长度: ${accessToken.length}`);
      return accessToken;
    } else {
      throw new Error(`获取访问令牌失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('❌ 获取访问令牌失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// 测试应用信息
async function testAppInfo() {
  try {
    console.log('\n📱 正在测试应用信息...');
    console.log(`   App Token: ${config.appToken}`);
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   响应状态: ${response.status}`);
    console.log(`   响应代码: ${response.data.code}`);
    
    if (response.data.code === 0) {
      console.log('✅ 应用信息获取成功');
      console.log(`   应用名称: ${response.data.data.app.name}`);
      console.log(`   应用ID: ${response.data.data.app.app_id}`);
      return response.data.data.app;
    } else {
      console.log('❌ 应用信息获取失败');
      console.log(`   错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 测试应用信息失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 列出所有表格
async function listTables() {
  try {
    console.log('\n📋 正在列出所有表格...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   响应状态: ${response.status}`);
    console.log(`   响应代码: ${response.data.code}`);
    
    if (response.data.code === 0) {
      console.log('✅ 表格列表获取成功');
      console.log(`   表格数量: ${response.data.data.items.length}`);
      
      response.data.data.items.forEach((table, index) => {
        console.log(`   表格${index + 1}:`);
        console.log(`     名称: ${table.name}`);
        console.log(`     ID: ${table.table_id}`);
        console.log(`     类型: ${table.table_type}`);
      });
      
      return response.data.data.items;
    } else {
      console.log('❌ 表格列表获取失败');
      console.log(`   错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 列出表格失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 测试特定表格
async function testSpecificTable() {
  try {
    console.log('\n🎯 正在测试特定表格...');
    console.log(`   Table ID: ${config.tableId}`);
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   响应状态: ${response.status}`);
    console.log(`   响应代码: ${response.data.code}`);
    
    if (response.data.code === 0) {
      console.log('✅ 特定表格信息获取成功');
      console.log(`   表格名称: ${response.data.data.table.name}`);
      console.log(`   表格ID: ${response.data.data.table.table_id}`);
      console.log(`   表格类型: ${response.data.data.table.table_type}`);
      return response.data.data.table;
    } else {
      console.log('❌ 特定表格信息获取失败');
      console.log(`   错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 测试特定表格失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 获取表格字段信息
async function getTableFields() {
  try {
    console.log('\n🏷️  正在获取表格字段信息...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   响应状态: ${response.status}`);
    console.log(`   响应代码: ${response.data.code}`);
    
    if (response.data.code === 0) {
      console.log('✅ 表格字段信息获取成功');
      console.log(`   字段数量: ${response.data.data.items.length}`);
      
      response.data.data.items.forEach((field, index) => {
        console.log(`   字段${index + 1}:`);
        console.log(`     名称: ${field.field_name}`);
        console.log(`     ID: ${field.field_id}`);
        console.log(`     类型: ${field.type}`);
      });
      
      return response.data.data.items;
    } else {
      console.log('❌ 表格字段信息获取失败');
      console.log(`   错误信息: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取表格字段失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 主调试函数
async function runDebug() {
  console.log('🔍 开始飞书API调试');
  console.log('==================');
  console.log(`配置信息:`);
  console.log(`  App ID: ${config.appId}`);
  console.log(`  App Token: ${config.appToken}`);
  console.log(`  Table ID: ${config.tableId}`);
  console.log(`  Block Type ID: ${config.blockTypeId}`);
  
  try {
    // 1. 获取访问令牌
    await getAccessToken();
    
    // 2. 测试应用信息
    const appInfo = await testAppInfo();
    
    // 3. 列出所有表格
    const tables = await listTables();
    
    // 4. 测试特定表格
    const tableInfo = await testSpecificTable();
    
    // 5. 获取表格字段信息
    const fields = await getTableFields();
    
    console.log('\n📊 调试结果汇总:');
    console.log('================');
    console.log(`✅ 访问令牌: ${accessToken ? '获取成功' : '获取失败'}`);
    console.log(`✅ 应用信息: ${appInfo ? '获取成功' : '获取失败'}`);
    console.log(`✅ 表格列表: ${tables ? '获取成功' : '获取失败'}`);
    console.log(`✅ 特定表格: ${tableInfo ? '获取成功' : '获取失败'}`);
    console.log(`✅ 表格字段: ${fields ? '获取成功' : '获取失败'}`);
    
    if (tables && tables.length > 0) {
      console.log('\n💡 建议:');
      console.log('如果特定表格获取失败，请检查以下表格ID是否正确:');
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name} (ID: ${table.table_id})`);
      });
    }
    
    console.log('\n🎉 调试完成！');
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
  }
}

// 运行调试
if (require.main === module) {
  runDebug().catch(console.error);
}

module.exports = {
  getAccessToken,
  testAppInfo,
  listTables,
  testSpecificTable,
  getTableFields,
  config
};
