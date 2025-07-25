// 检查汇总表字段的脚本
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

// 获取汇总表字段信息
async function getSummaryTableFields() {
  try {
    console.log('正在获取汇总表字段信息...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      console.log('✅ 汇总表字段获取成功');
      console.log(`字段数量: ${response.data.data.items.length}`);
      
      console.log('\n字段详情:');
      response.data.data.items.forEach((field, index) => {
        console.log(`${index + 1}. 字段名: "${field.field_name}"`);
        console.log(`   字段ID: ${field.field_id}`);
        console.log(`   字段类型: ${field.type}`);
        console.log('');
      });
      
      return response.data.data.items;
    } else {
      throw new Error(`获取字段失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('获取汇总表字段失败:', error.message);
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// 主函数
async function main() {
  try {
    console.log('🔍 检查汇总表字段信息');
    console.log('========================');
    
    await getAccessToken();
    console.log('✅ 访问令牌获取成功');
    
    const fields = await getSummaryTableFields();
    
    if (fields) {
      console.log('📋 建议的字段映射:');
      console.log('==================');
      fields.forEach(field => {
        console.log(`'${field.field_name}': 对应的数据值`);
      });
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

main();
