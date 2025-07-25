// 测试汇总数据格式的脚本
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

// 测试不同的数据格式
async function testDifferentFormats() {
  const testCases = [
    {
      name: "格式1: 普通数字",
      data: {
        fields: {
          '总时长': 8.5,
          '专注时长': 6.8,
          '分心时长': 1.7,
          '效率得分': 0.8
        }
      }
    },
    {
      name: "格式2: 整数",
      data: {
        fields: {
          '总时长': 8,
          '专注时长': 6,
          '分心时长': 2,
          '效率得分': 1
        }
      }
    },
    {
      name: "格式3: 字符串数字",
      data: {
        fields: {
          '总时长': "8.5",
          '专注时长': "6.8",
          '分心时长': "1.7",
          '效率得分': "0.8"
        }
      }
    },
    {
      name: "格式4: 明确数字类型",
      data: {
        fields: {
          '总时长': parseFloat("8.5"),
          '专注时长': parseFloat("6.8"),
          '分心时长': parseFloat("1.7"),
          '效率得分': parseFloat("0.8")
        }
      }
    },
    {
      name: "格式5: 小数点后两位",
      data: {
        fields: {
          '总时长': 8.50,
          '专注时长': 6.80,
          '分心时长': 1.70,
          '效率得分': 0.80
        }
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n测试 ${testCase.name}:`);
    console.log('数据:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await axios.post(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records`,
        testCase.data,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        console.log(`✅ ${testCase.name} 成功`);
        console.log(`   记录ID: ${response.data.data.record.record_id}`);
        return testCase; // 返回第一个成功的格式
      } else {
        console.log(`❌ ${testCase.name} 失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} 错误: ${error.message}`);
      if (error.response && error.response.data) {
        console.log(`   详细错误:`, error.response.data);
      }
    }
  }
  
  return null;
}

// 查询现有记录格式
async function queryExistingRecords() {
  try {
    console.log('正在查询现有记录格式...');
    
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.summaryTableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 3
        }
      }
    );

    if (response.data.code === 0 && response.data.data.items.length > 0) {
      console.log('✅ 现有记录格式:');
      response.data.data.items.forEach((record, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log('  字段值:', JSON.stringify(record.fields, null, 2));
      });
      return response.data.data.items;
    } else {
      console.log('❌ 没有找到现有记录');
      return [];
    }
  } catch (error) {
    console.log('❌ 查询现有记录失败:', error.message);
    return [];
  }
}

// 主函数
async function main() {
  try {
    console.log('🧪 测试汇总数据格式');
    console.log('==================');
    
    await getAccessToken();
    console.log('✅ 访问令牌获取成功');
    
    // 查询现有记录
    const existingRecords = await queryExistingRecords();
    
    // 测试不同格式
    console.log('\n🔍 测试不同数据格式:');
    const successfulFormat = await testDifferentFormats();
    
    if (successfulFormat) {
      console.log('\n🎉 找到可用格式:');
      console.log('格式名称:', successfulFormat.name);
      console.log('数据结构:', JSON.stringify(successfulFormat.data, null, 2));
    } else {
      console.log('\n❌ 所有格式都失败了');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

main();
