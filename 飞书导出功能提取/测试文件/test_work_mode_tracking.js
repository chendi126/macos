// 测试工作模式追踪功能的简单脚本
// 这个脚本可以用来验证工作模式会话数据的保存和读取

const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取用户数据目录
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'electron-react-app');
const workModesPath = path.join(userDataPath, 'work-modes');
const sessionsPath = path.join(workModesPath, 'sessions.json');

console.log('工作模式追踪功能测试');
console.log('===================');

// 检查目录是否存在
if (!fs.existsSync(workModesPath)) {
    console.log('❌ 工作模式目录不存在:', workModesPath);
    console.log('请先启动应用并创建工作模式');
    process.exit(1);
}

console.log('✅ 工作模式目录存在:', workModesPath);

// 检查会话文件
if (!fs.existsSync(sessionsPath)) {
    console.log('⚠️  会话文件不存在:', sessionsPath);
    console.log('这是正常的，会话文件会在首次启动工作模式时创建');
} else {
    console.log('✅ 会话文件存在:', sessionsPath);
    
    try {
        const sessionsData = fs.readFileSync(sessionsPath, 'utf8');
        const sessions = JSON.parse(sessionsData);
        
        console.log(`📊 找到 ${sessions.length} 个会话记录`);
        
        if (sessions.length > 0) {
            console.log('\n最近的会话记录:');
            const latestSession = sessions[sessions.length - 1];
            
            console.log(`- 会话ID: ${latestSession.id}`);
            console.log(`- 模式ID: ${latestSession.modeId}`);
            console.log(`- 开始时间: ${new Date(latestSession.startTime).toLocaleString()}`);
            
            if (latestSession.endTime) {
                console.log(`- 结束时间: ${new Date(latestSession.endTime).toLocaleString()}`);
                const duration = latestSession.endTime - latestSession.startTime;
                console.log(`- 总时长: ${Math.round(duration / 1000 / 60)} 分钟`);
            } else {
                console.log('- 状态: 进行中');
            }
            
            console.log(`- 专注时长: ${Math.round(latestSession.productiveTime / 1000 / 60)} 分钟`);
            console.log(`- 分心时长: ${Math.round(latestSession.distractingTime / 1000 / 60)} 分钟`);
            
            const totalTime = latestSession.productiveTime + latestSession.distractingTime;
            if (totalTime > 0) {
                const focusRate = Math.round((latestSession.productiveTime / totalTime) * 100);
                console.log(`- 专注率: ${focusRate}%`);
            }
        }
    } catch (error) {
        console.log('❌ 读取会话文件失败:', error.message);
    }
}

// 检查模式文件
const modesPath = path.join(workModesPath, 'modes.json');
if (fs.existsSync(modesPath)) {
    try {
        const modesData = fs.readFileSync(modesPath, 'utf8');
        const modes = JSON.parse(modesData);
        
        console.log(`\n📋 找到 ${modes.length} 个工作模式`);
        
        modes.forEach((mode, index) => {
            console.log(`${index + 1}. ${mode.name}`);
            console.log(`   - 自动创建桌面: ${mode.autoCreateDesktop ? '是' : '否'}`);
            console.log(`   - 自启动应用: ${mode.autoStartApps ? mode.autoStartApps.length : 0} 个`);
        });
    } catch (error) {
        console.log('❌ 读取模式文件失败:', error.message);
    }
}

console.log('\n测试说明:');
console.log('1. 启动应用并进入工作模式设置页面');
console.log('2. 创建一个工作模式并启用"自动创建桌面"');
console.log('3. 点击"启动模式"按钮');
console.log('4. 进入应用追踪页面查看工作模式状态');
console.log('5. 切换到其他应用测试分心时长记录');
console.log('6. 再次运行此脚本查看会话数据');

console.log('\n功能验证清单:');
console.log('□ 工作模式状态卡片显示');
console.log('□ 专注时长实时更新');
console.log('□ 分心时长实时更新');
console.log('□ 专注率计算正确');
console.log('□ 统计卡片优先显示工作模式数据');
console.log('□ 会话数据正确保存');
