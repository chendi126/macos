// 验证表格ID的脚本
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

// 获取应用中的所有表格
async function getAllTables() {
  try {
    console.log('正在获取应用中的所有表格...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 表格列表获取成功');
      console.log(`表格数量: ${response.data.data.items.length}`);
      
      console.log('\n所有表格信息:');
      response.data.data.items.forEach((table, index) => {
        console.log(`${index + 1}. 表格名: "${table.name}"`);
        console.log(`   表格ID: ${table.table_id}`);
        console.log('');
      });
      
      return response.data.data.items;
    } else {
      throw new Error(`获取表格列表失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('获取表格列表失败:', error.message);
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 验证特定表格ID
async function verifyTableId(tableId, tableName) {
  try {
    console.log(`正在验证${tableName} (${tableId})...`);
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${tableId}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log(`✅ ${tableName}验证成功`);
      console.log(`   字段数量: ${response.data.data.items.length}`);
      console.log('   字段列表:');
      response.data.data.items.forEach((field, index) => {
        console.log(`     ${index + 1}. ${field.field_name} (${field.type})`);
      });
      return true;
    } else {
      console.log(`❌ ${tableName}验证失败: ${response.data.msg}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${tableName}验证失败: ${error.message}`);
    if (error.response) {
      console.log(`   错误代码: ${error.response.status}`);
      console.log(`   错误详情:`, error.response.data);
    }
    return false;
  }
}

// 主函数
async function main() {
  try {
    console.log('🔍 验证表格ID');
    console.log('=============');
    
    await getAccessToken();
    console.log('✅ 访问令牌获取成功\n');
    
    // 获取所有表格
    const tables = await getAllTables();
    
    console.log('\n🔍 验证配置的表格ID:');
    console.log('=====================');
    
    // 验证应用详细数据表
    const appTableValid = await verifyTableId(config.tableId, '应用详细数据表');
    console.log('');
    
    // 验证汇总数据表
    const summaryTableValid = await verifyTableId(config.summaryTableId, '汇总数据表');
    
    console.log('\n📊 验证结果汇总:');
    console.log('================');
    console.log(`应用详细数据表 (${config.tableId}): ${appTableValid ? '✅ 有效' : '❌ 无效'}`);
    console.log(`汇总数据表 (${config.summaryTableId}): ${summaryTableValid ? '✅ 有效' : '❌ 无效'}`);
    
    if (!summaryTableValid && tables) {
      console.log('\n💡 建议的汇总数据表:');
      console.log('==================');
      tables.forEach(table => {
        if (table.table_id !== config.tableId) {
          console.log(`表格名: "${table.name}" - ID: ${table.table_id}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

main();
