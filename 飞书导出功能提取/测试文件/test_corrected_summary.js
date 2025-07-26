// 测试修正后的汇总数据导出
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

// 模拟应用分类效率计算
function calculateEfficiencyStats(apps) {
  const productiveCategories = ['开发工具', '工作效率', '设计与创意'];
  const distractingCategories = ['娱乐', '通讯与社交'];
  
  let productiveTime = 0;
  let distractingTime = 0;
  let totalTime = 0;

  Object.values(apps).forEach(app => {
    totalTime += app.duration;
    if (productiveCategories.includes(app.category || '')) {
      productiveTime += app.duration;
    } else if (distractingCategories.includes(app.category || '')) {
      distractingTime += app.duration;
    }
  });

  const efficiencyScore = totalTime > 0 ? (productiveTime / totalTime) : 0;

  return {
    totalTime,
    productiveTime,
    distractingTime,
    efficiencyScore
  };
}

// 测试修正后的汇总数据导出
async function testCorrectedSummaryExport() {
  try {
    console.log('正在测试修正后的汇总数据导出...');
    
    // 模拟应用使用数据（包含不同分类的应用）
    const mockApps = {
      'VSCode': {
        name: 'VSCode',
        duration: 4 * 60 * 60 * 1000, // 4小时
        category: '开发工具'
      },
      'Chrome': {
        name: 'Chrome',
        duration: 2 * 60 * 60 * 1000, // 2小时
        category: '工作效率'
      },
      '微信': {
        name: '微信',
        duration: 1 * 60 * 60 * 1000, // 1小时
        category: '通讯与社交'
      },
      '网易云音乐': {
        name: '网易云音乐',
        duration: 0.5 * 60 * 60 * 1000, // 0.5小时
        category: '娱乐'
      },
      '记事本': {
        name: '记事本',
        duration: 0.5 * 60 * 60 * 1000, // 0.5小时
        category: '其他'
      }
    };
    
    // 计算效率统计
    const stats = calculateEfficiencyStats(mockApps);
    
    console.log('模拟应用数据:');
    Object.values(mockApps).forEach(app => {
      console.log(`  ${app.name}: ${app.duration / (1000 * 60 * 60)}小时 (${app.category})`);
    });
    
    console.log('\n计算的效率统计:');
    console.log(`  总时长: ${stats.totalTime / (1000 * 60 * 60)}小时`);
    console.log(`  高效时长: ${stats.productiveTime / (1000 * 60 * 60)}小时`);
    console.log(`  分心时长: ${stats.distractingTime / (1000 * 60 * 60)}小时`);
    console.log(`  效率得分: ${Math.round(stats.efficiencyScore * 100)}%`);
    
    // 转换为小时
    const totalHours = stats.totalTime / (1000 * 60 * 60);
    const productiveHours = stats.productiveTime / (1000 * 60 * 60);
    const distractingHours = stats.distractingTime / (1000 * 60 * 60);
    
    const summaryRecord = {
      fields: {
        '总时长': Math.round(totalHours * 100) / 100,
        '专注时长': Math.round(productiveHours * 100) / 100,
        '分心时长': Math.round(distractingHours * 100) / 100,
        '效率得分': Math.round(stats.efficiencyScore * 1000) / 1000
      }
    };

    console.log('\n准备导出的汇总数据:');
    console.log(JSON.stringify(summaryRecord, null, 2));

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
      console.log('\n✅ 修正后的汇总数据导出成功');
      console.log(`   记录ID: ${response.data.data.record.record_id}`);
      return true;
    } else {
      throw new Error(`汇总数据导出失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('\n❌ 修正后的汇总数据导出失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 测试不同的应用分类组合
async function testDifferentCombinations() {
  console.log('\n正在测试不同的应用分类组合...');
  
  const testCases = [
    {
      name: "纯工作场景",
      apps: {
        'VSCode': { duration: 6 * 60 * 60 * 1000, category: '开发工具' },
        'Figma': { duration: 2 * 60 * 60 * 1000, category: '设计与创意' }
      }
    },
    {
      name: "工作娱乐混合",
      apps: {
        'Excel': { duration: 4 * 60 * 60 * 1000, category: '工作效率' },
        'QQ': { duration: 1 * 60 * 60 * 1000, category: '通讯与社交' },
        '爱奇艺': { duration: 2 * 60 * 60 * 1000, category: '娱乐' }
      }
    },
    {
      name: "纯娱乐场景",
      apps: {
        '抖音': { duration: 3 * 60 * 60 * 1000, category: '娱乐' },
        '微博': { duration: 1 * 60 * 60 * 1000, category: '通讯与社交' }
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n测试 ${testCase.name}:`);
      
      const stats = calculateEfficiencyStats(testCase.apps);
      const totalHours = stats.totalTime / (1000 * 60 * 60);
      const productiveHours = stats.productiveTime / (1000 * 60 * 60);
      const distractingHours = stats.distractingTime / (1000 * 60 * 60);
      
      console.log(`  总时长: ${totalHours}小时`);
      console.log(`  高效时长: ${productiveHours}小时`);
      console.log(`  分心时长: ${distractingHours}小时`);
      console.log(`  效率得分: ${Math.round(stats.efficiencyScore * 100)}%`);
      
      const summaryRecord = {
        fields: {
          '总时长': Math.round(totalHours * 100) / 100,
          '专注时长': Math.round(productiveHours * 100) / 100,
          '分心时长': Math.round(distractingHours * 100) / 100,
          '效率得分': Math.round(stats.efficiencyScore * 1000) / 1000
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
        console.log(`  ✅ ${testCase.name} 导出成功`);
      } else {
        console.log(`  ❌ ${testCase.name} 导出失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.name} 导出错误: ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  try {
    console.log('🧪 测试修正后的汇总数据导出');
    console.log('============================');
    
    await getAccessToken();
    console.log('✅ 访问令牌获取成功');
    
    // 测试基本导出
    const basicSuccess = await testCorrectedSummaryExport();
    
    // 测试不同组合
    await testDifferentCombinations();
    
    console.log('\n📊 测试结果汇总:');
    console.log('================');
    console.log(`✅ 访问令牌: 获取成功`);
    console.log(`${basicSuccess ? '✅' : '❌'} 修正后导出: ${basicSuccess ? '成功' : '失败'}`);
    
    console.log('\n🎉 测试完成！');
    console.log('现在汇总数据将使用真实的应用分类效率统计：');
    console.log('- 总时长: 所有应用的总使用时长');
    console.log('- 专注时长: 开发工具、工作效率、设计与创意类应用的时长');
    console.log('- 分心时长: 娱乐、通讯与社交类应用的时长');
    console.log('- 效率得分: 专注时长占总时长的比例');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

main();
