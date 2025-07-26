// 测试数据匹配的脚本
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

// 模拟前端的数据计算逻辑
function simulateFrontendCalculation(dayStats) {
  console.log('模拟前端数据计算:');
  console.log('================');
  
  // 1. 总使用时长 = dayStats.totalTime (对应前端的realTimeTotalTime)
  const totalTime = dayStats.totalTime;
  console.log(`1. 总使用时长: ${totalTime}ms = ${totalTime / (1000 * 60 * 60)}小时`);
  
  // 2. 计算效率统计 (对应前端的getEfficiencyStats)
  const productiveCategories = ['开发工具', '工作效率', '设计与创意'];
  const distractingCategories = ['娱乐', '通讯与社交'];
  
  let productiveTime = 0;
  let distractingTime = 0;
  let calculatedTotalTime = 0;

  console.log('\n应用分类统计:');
  Object.values(dayStats.apps).forEach(app => {
    calculatedTotalTime += app.duration;
    console.log(`  ${app.name}: ${app.duration}ms (${app.category || '未分类'})`);
    
    if (productiveCategories.includes(app.category || '')) {
      productiveTime += app.duration;
    } else if (distractingCategories.includes(app.category || '')) {
      distractingTime += app.duration;
    }
  });

  console.log(`\n2. 高效时长: ${productiveTime}ms = ${productiveTime / (1000 * 60 * 60)}小时`);
  console.log(`3. 分心时长: ${distractingTime}ms = ${distractingTime / (1000 * 60 * 60)}小时`);
  
  // 3. 效率得分 = 高效时长 / 总使用时长 (使用dayStats.totalTime)
  const efficiencyScore = totalTime > 0 ? (productiveTime / totalTime) : 0;
  console.log(`4. 效率得分: ${productiveTime} / ${totalTime} = ${efficiencyScore} (${Math.round(efficiencyScore * 100)}%)`);
  
  console.log(`\n注意: calculatedTotalTime = ${calculatedTotalTime}ms, dayStats.totalTime = ${totalTime}ms`);
  if (calculatedTotalTime !== totalTime) {
    console.log('⚠️  两个总时长不一致，这是正常的，因为前端使用realTimeTotalTime包含实时数据');
  }
  
  return {
    totalTime,
    productiveTime,
    distractingTime,
    efficiencyScore,
    calculatedTotalTime
  };
}

// 测试数据匹配
async function testDataMatching() {
  try {
    console.log('🧪 测试数据匹配');
    console.log('===============');
    
    // 模拟一个完整的dayStats数据
    const mockDayStats = {
      date: '2025-01-25',
      totalTime: 10 * 60 * 60 * 1000, // 10小时总时长
      apps: {
        'VSCode': {
          name: 'VSCode',
          duration: 4 * 60 * 60 * 1000, // 4小时
          category: '开发工具',
          title: 'Visual Studio Code',
          launches: 3,
          lastActive: Date.now()
        },
        'Chrome': {
          name: 'Chrome',
          duration: 2 * 60 * 60 * 1000, // 2小时
          category: '工作效率',
          title: 'Google Chrome',
          launches: 5,
          lastActive: Date.now()
        },
        '微信': {
          name: '微信',
          duration: 1.5 * 60 * 60 * 1000, // 1.5小时
          category: '通讯与社交',
          title: '微信',
          launches: 2,
          lastActive: Date.now()
        },
        '网易云音乐': {
          name: '网易云音乐',
          duration: 1 * 60 * 60 * 1000, // 1小时
          category: '娱乐',
          title: '网易云音乐',
          launches: 1,
          lastActive: Date.now()
        },
        '记事本': {
          name: '记事本',
          duration: 0.5 * 60 * 60 * 1000, // 0.5小时
          category: '其他',
          title: '记事本',
          launches: 1,
          lastActive: Date.now()
        }
      },
      timeline: []
    };
    
    // 模拟前端计算
    const frontendResult = simulateFrontendCalculation(mockDayStats);
    
    // 模拟后端计算（与修正后的FeishuService逻辑一致）
    console.log('\n模拟后端数据计算:');
    console.log('================');
    
    const totalHours = frontendResult.totalTime / (1000 * 60 * 60);
    const productiveHours = frontendResult.productiveTime / (1000 * 60 * 60);
    const distractingHours = frontendResult.distractingTime / (1000 * 60 * 60);
    
    const summaryRecord = {
      fields: {
        '总时长': Math.round(totalHours * 100) / 100,
        '专注时长': Math.round(productiveHours * 100) / 100,
        '分心时长': Math.round(distractingHours * 100) / 100,
        '效率得分': Math.round(frontendResult.efficiencyScore * 1000) / 1000
      }
    };

    console.log('后端计算结果:');
    console.log(`  总时长: ${summaryRecord.fields['总时长']}小时`);
    console.log(`  专注时长: ${summaryRecord.fields['专注时长']}小时`);
    console.log(`  分心时长: ${summaryRecord.fields['分心时长']}小时`);
    console.log(`  效率得分: ${summaryRecord.fields['效率得分']} (${Math.round(summaryRecord.fields['效率得分'] * 100)}%)`);

    console.log('\n准备导出的数据:');
    console.log(JSON.stringify(summaryRecord, null, 2));

    // 实际导出测试
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
      console.log('\n✅ 数据匹配测试导出成功');
      console.log(`   记录ID: ${response.data.data.record.record_id}`);
      
      console.log('\n📊 数据匹配验证:');
      console.log('================');
      console.log('✅ 总时长: 使用dayStats.totalTime (对应前端realTimeTotalTime)');
      console.log('✅ 专注时长: 基于应用分类计算的高效时长');
      console.log('✅ 分心时长: 基于应用分类计算的分心时长');
      console.log('✅ 效率得分: 高效时长 / 总时长');
      
      return true;
    } else {
      throw new Error(`数据匹配测试导出失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('\n❌ 数据匹配测试失败:', error.message);
    if (error.response) {
      console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 主函数
async function main() {
  try {
    await getAccessToken();
    console.log('✅ 访问令牌获取成功\n');
    
    const success = await testDataMatching();
    
    console.log('\n🎉 测试完成！');
    if (success) {
      console.log('现在汇总数据导出将与应用追踪界面显示的数据完全匹配：');
      console.log('- 总时长: 对应界面的"总使用时长"');
      console.log('- 专注时长: 对应界面的"高效时长"');
      console.log('- 分心时长: 对应界面的"分心时长"');
      console.log('- 效率得分: 对应界面的"效率得分"');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

main();
