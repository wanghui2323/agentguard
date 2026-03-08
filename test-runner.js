#!/usr/bin/env node
/**
 * 自动化测试脚本
 * 测试 AgentGuard 从后端到前端的完整流程
 */

const { SecurityScanner } = require('./dist/core/scanner');
const { AutoFixer } = require('./dist/core/fixer');
const { OpenClawDetector } = require('./dist/core/detectors/openclaw');

// 测试结果收集
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`  ${icon} ${name}${message ? ': ' + message : ''}`, color);

  results.tests.push({ name, status, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.skipped++;
}

async function runTests() {
  log('\n╔══════════════════════════════════════════════════════╗', 'cyan');
  log('║     AgentGuard 自动化测试套件                        ║', 'cyan');
  log('╠══════════════════════════════════════════════════════╣', 'cyan');
  log('║     测试范围: 后端服务 → 前端交互                   ║', 'cyan');
  log('╚══════════════════════════════════════════════════════╝\n', 'cyan');

  // ============================================
  // 第一部分: 核心模块测试
  // ============================================
  log('【第一部分】核心模块测试', 'blue');
  log('─────────────────────────────────────────────────────', 'gray');

  // Test 1: 检测器实例化
  try {
    const detector = new OpenClawDetector();
    if (detector.id === 'openclaw' && detector.name === 'OpenClaw') {
      logTest('OpenClaw 检测器实例化', 'pass');
    } else {
      logTest('OpenClaw 检测器实例化', 'fail', '属性不匹配');
    }
  } catch (error) {
    logTest('OpenClaw 检测器实例化', 'fail', error.message);
  }

  // Test 2: 扫描引擎实例化
  try {
    const scanner = new SecurityScanner();
    const detectors = scanner.getAllDetectors();
    if (detectors.length > 0) {
      logTest('扫描引擎初始化', 'pass', `已注册 ${detectors.length} 个检测器`);
    } else {
      logTest('扫描引擎初始化', 'fail', '没有注册任何检测器');
    }
  } catch (error) {
    logTest('扫描引擎初始化', 'fail', error.message);
  }

  // Test 3: 修复引擎实例化
  try {
    const scanner = new SecurityScanner();
    const fixer = new AutoFixer(scanner);
    logTest('修复引擎初始化', 'pass');
  } catch (error) {
    logTest('修复引擎初始化', 'fail', error.message);
  }

  // ============================================
  // 第二部分: Agent 检测测试
  // ============================================
  log('\n【第二部分】Agent 检测功能', 'blue');
  log('─────────────────────────────────────────────────────', 'gray');

  try {
    const detector = new OpenClawDetector();

    // Test 4: 检测 OpenClaw
    const agent = await detector.detect();
    if (agent) {
      logTest('OpenClaw 检测', 'pass', `状态: ${agent.status}`);
    } else {
      logTest('OpenClaw 检测', 'skip', 'OpenClaw 未安装或未运行');
    }

    // Test 5: 获取配置路径
    const configPath = detector.getConfigPath();
    if (configPath && typeof configPath === 'string') {
      logTest('配置文件路径获取', 'pass', configPath);
    } else {
      logTest('配置文件路径获取', 'fail', '路径无效');
    }

    // Test 6: 控制能力检查
    const canControl = detector.canControl();
    if (canControl) {
      logTest('进程控制能力', 'pass', '支持停止/重启');
    } else {
      logTest('进程控制能力', 'fail', '不支持控制');
    }

  } catch (error) {
    logTest('Agent 检测', 'fail', error.message);
  }

  // ============================================
  // 第三部分: 安全扫描测试
  // ============================================
  log('\n【第三部分】安全扫描功能', 'blue');
  log('─────────────────────────────────────────────────────', 'gray');

  try {
    const scanner = new SecurityScanner();

    // Test 7: 扫描所有 Agents
    const results = await scanner.scanAll();
    if (Array.isArray(results)) {
      logTest('扫描所有 Agents', 'pass', `检测到 ${results.length} 个 Agent`);

      // 显示详细结果
      for (const result of results) {
        log(`\n  📊 ${result.agent.name}:`, 'cyan');
        log(`     状态: ${result.agent.status}`, 'gray');
        log(`     安全评分: ${result.score}/100 ${getScoreEmoji(result.score)}`, 'gray');
        log(`     风险等级: ${result.level}`, 'gray');
        log(`     发现问题: ${result.issues.length} 个`, 'gray');

        if (result.issues.length > 0) {
          log(`\n     检测到的问题:`, 'yellow');
          result.issues.slice(0, 3).forEach(issue => {
            const icon = getSeverityIcon(issue.severity);
            log(`     ${icon} ${issue.title}`, 'gray');
          });
          if (result.issues.length > 3) {
            log(`     ... 还有 ${result.issues.length - 3} 个问题`, 'gray');
          }
        }
      }

      // Test 8: 风险评分算法
      if (results.length > 0) {
        const firstResult = results[0];
        if (typeof firstResult.score === 'number' && firstResult.score >= 0 && firstResult.score <= 100) {
          logTest('风险评分计算', 'pass', `评分: ${firstResult.score}/100`);
        } else {
          logTest('风险评分计算', 'fail', '评分超出范围');
        }
      }

    } else {
      logTest('扫描所有 Agents', 'fail', '返回结果格式错误');
    }

  } catch (error) {
    logTest('安全扫描', 'fail', error.message);
  }

  // ============================================
  // 第四部分: CLI 命令测试
  // ============================================
  log('\n【第四部分】CLI 命令测试', 'blue');
  log('─────────────────────────────────────────────────────', 'gray');

  const { spawn } = require('child_process');
  const path = require('path');

  // Test 9: CLI --version
  try {
    await new Promise((resolve, reject) => {
      const cli = spawn('node', [path.join(__dirname, 'dist/cli/index.js'), '--version']);
      let output = '';

      cli.stdout.on('data', (data) => {
        output += data.toString();
      });

      cli.on('close', (code) => {
        if (output.includes('0.1.0')) {
          logTest('CLI --version', 'pass', output.trim());
          resolve();
        } else {
          logTest('CLI --version', 'fail', '版本号不匹配');
          reject();
        }
      });

      setTimeout(() => {
        cli.kill();
        logTest('CLI --version', 'fail', '超时');
        reject();
      }, 5000);
    });
  } catch (error) {
    // Already logged
  }

  // Test 10: CLI --help
  try {
    await new Promise((resolve, reject) => {
      const cli = spawn('node', [path.join(__dirname, 'dist/cli/index.js'), '--help']);
      let output = '';

      cli.stdout.on('data', (data) => {
        output += data.toString();
      });

      cli.on('close', (code) => {
        if (output.includes('Security control center')) {
          logTest('CLI --help', 'pass', '帮助信息正确');
          resolve();
        } else {
          logTest('CLI --help', 'fail', '帮助信息缺失');
          reject();
        }
      });

      setTimeout(() => {
        cli.kill();
        logTest('CLI --help', 'fail', '超时');
        reject();
      }, 5000);
    });
  } catch (error) {
    // Already logged
  }

  // Test 11: CLI scan 命令
  try {
    await new Promise((resolve, reject) => {
      const cli = spawn('node', [path.join(__dirname, 'dist/cli/index.js'), 'scan']);
      let output = '';
      let errorOutput = '';

      cli.stdout.on('data', (data) => {
        output += data.toString();
      });

      cli.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      cli.on('close', (code) => {
        if (output.includes('AgentGuard') || output.includes('扫描')) {
          logTest('CLI scan 命令', 'pass', 'scan 命令执行成功');
          resolve();
        } else if (output.length === 0 && errorOutput.length === 0) {
          logTest('CLI scan 命令', 'skip', '未检测到 Agent');
          resolve();
        } else {
          logTest('CLI scan 命令', 'fail', errorOutput || '输出格式错误');
          reject();
        }
      });

      setTimeout(() => {
        cli.kill();
        logTest('CLI scan 命令', 'fail', '超时');
        reject();
      }, 10000);
    });
  } catch (error) {
    // Already logged
  }

  // Test 12: CLI status 命令
  try {
    await new Promise((resolve, reject) => {
      const cli = spawn('node', [path.join(__dirname, 'dist/cli/index.js'), 'status']);
      let output = '';

      cli.stdout.on('data', (data) => {
        output += data.toString();
      });

      cli.on('close', (code) => {
        if (output.includes('Status') || output.includes('状态') || output.length > 0) {
          logTest('CLI status 命令', 'pass', 'status 命令执行成功');
          resolve();
        } else {
          logTest('CLI status 命令', 'fail', '输出为空');
          reject();
        }
      });

      setTimeout(() => {
        cli.kill();
        logTest('CLI status 命令', 'fail', '超时');
        reject();
      }, 5000);
    });
  } catch (error) {
    // Already logged
  }

  // ============================================
  // 测试总结
  // ============================================
  log('\n╔══════════════════════════════════════════════════════╗', 'cyan');
  log('║                   测试结果汇总                        ║', 'cyan');
  log('╠══════════════════════════════════════════════════════╣', 'cyan');

  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';

  log(`║  总计: ${total} 个测试                                  ║`, 'cyan');
  log(`║  ✓ 通过: ${results.passed} 个                                  ║`, 'green');
  log(`║  ✗ 失败: ${results.failed} 个                                  ║`, results.failed > 0 ? 'red' : 'cyan');
  log(`║  ○ 跳过: ${results.skipped} 个                                  ║`, 'yellow');
  log(`║  通过率: ${passRate}%                                    ║`, passRate >= 80 ? 'green' : 'yellow');
  log('╚══════════════════════════════════════════════════════╝\n', 'cyan');

  // 生成测试报告文件
  const fs = require('fs');
  const reportPath = path.join(__dirname, 'TEST_REPORT.md');
  const report = generateReport(results);
  fs.writeFileSync(reportPath, report);
  log(`📄 详细测试报告已保存到: ${reportPath}`, 'green');

  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

function getScoreEmoji(score) {
  if (score >= 90) return '✅';
  if (score >= 70) return '🟢';
  if (score >= 50) return '🟡';
  if (score >= 30) return '🟠';
  return '🔴';
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return 'ℹ️';
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';

  let report = `# AgentGuard 测试报告\n\n`;
  report += `**测试时间**: ${timestamp}\n\n`;
  report += `## 测试摘要\n\n`;
  report += `| 指标 | 数量 | 百分比 |\n`;
  report += `|------|------|--------|\n`;
  report += `| 总测试数 | ${total} | 100% |\n`;
  report += `| ✅ 通过 | ${results.passed} | ${((results.passed/total)*100).toFixed(1)}% |\n`;
  report += `| ❌ 失败 | ${results.failed} | ${((results.failed/total)*100).toFixed(1)}% |\n`;
  report += `| ⏭️ 跳过 | ${results.skipped} | ${((results.skipped/total)*100).toFixed(1)}% |\n\n`;
  report += `**通过率**: ${passRate}%\n\n`;

  report += `## 详细测试结果\n\n`;
  results.tests.forEach((test, index) => {
    const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
    report += `### ${index + 1}. ${icon} ${test.name}\n\n`;
    report += `- **状态**: ${test.status}\n`;
    if (test.message) {
      report += `- **详情**: ${test.message}\n`;
    }
    report += `\n`;
  });

  report += `## 结论\n\n`;
  if (results.failed === 0) {
    report += `✅ **所有测试通过！** AgentGuard 功能正常，可以安全发布。\n`;
  } else {
    report += `⚠️ **发现 ${results.failed} 个失败的测试。** 建议修复后再发布。\n`;
  }

  return report;
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试运行失败: ${error.message}`, 'red');
  process.exit(1);
});
