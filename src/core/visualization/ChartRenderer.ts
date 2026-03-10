/**
 * CLI文本图表渲染器
 */
import asciichart from 'asciichart';
import chalk from 'chalk';
import type { TrendDataPoint } from '../history/types';

export class ChartRenderer {
  /**
   * 渲染成本趋势折线图
   */
  renderCostTrend(data: TrendDataPoint[], options: {
    title?: string;
    height?: number;
    width?: number;
    colors?: string[];
  } = {}): string {
    if (data.length === 0) {
      return chalk.yellow('No data available');
    }

    const {
      title = 'Cost Trend',
      height = 15,
      width = 60
    } = options;

    // 提取数值
    const values = data.map(d => d.value);

    // 生成图表
    const plot = asciichart.plot(values, {
      height,
      format: (x: number) => `$${x.toFixed(2)}`.padStart(8)
    });

    // 构建输出
    const lines: string[] = [];

    // 标题
    lines.push('');
    lines.push(chalk.bold.cyan(`📊 ${title}`));
    lines.push(chalk.dim('─'.repeat(width)));
    lines.push('');

    // 图表
    lines.push(plot);
    lines.push('');

    // 日期标签 (显示第一个和最后一个日期)
    if (data.length > 0) {
      const startDate = this.formatDateLabel(data[0].date);
      const endDate = this.formatDateLabel(data[data.length - 1].date);
      const padding = ' '.repeat(Math.max(0, width - startDate.length - endDate.length - 10));
      lines.push(chalk.dim(`    ${startDate}${padding}${endDate}`));
    }

    lines.push('');

    // 统计信息
    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    lines.push(chalk.bold('Statistics:'));
    lines.push(`  Total:   ${chalk.green('$' + total.toFixed(2))}`);
    lines.push(`  Average: ${chalk.cyan('$' + avg.toFixed(2))}`);
    lines.push(`  Min:     ${chalk.yellow('$' + min.toFixed(2))}`);
    lines.push(`  Max:     ${chalk.red('$' + max.toFixed(2))}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 渲染Token使用趋势
   */
  renderTokenTrend(data: TrendDataPoint[], options: {
    title?: string;
    height?: number;
    width?: number;
  } = {}): string {
    if (data.length === 0) {
      return chalk.yellow('No data available');
    }

    const {
      title = 'Token Usage Trend',
      height = 15,
      width = 60
    } = options;

    // 提取数值
    const values = data.map(d => d.value);

    // 生成图表
    const plot = asciichart.plot(values, {
      height,
      format: (x: number) => this.formatNumber(x).padStart(10)
    });

    // 构建输出
    const lines: string[] = [];

    // 标题
    lines.push('');
    lines.push(chalk.bold.cyan(`📊 ${title}`));
    lines.push(chalk.dim('─'.repeat(width)));
    lines.push('');

    // 图表
    lines.push(plot);
    lines.push('');

    // 日期标签
    if (data.length > 0) {
      const startDate = this.formatDateLabel(data[0].date);
      const endDate = this.formatDateLabel(data[data.length - 1].date);
      const padding = ' '.repeat(Math.max(0, width - startDate.length - endDate.length - 10));
      lines.push(chalk.dim(`    ${startDate}${padding}${endDate}`));
    }

    lines.push('');

    // 统计信息
    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = total / values.length;

    lines.push(chalk.bold('Statistics:'));
    lines.push(`  Total:   ${chalk.green(this.formatNumber(total) + ' tokens')}`);
    lines.push(`  Average: ${chalk.cyan(this.formatNumber(avg) + ' tokens/day')}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 渲染多条趋势对比
   */
  renderMultipleTrends(datasets: Array<{
    name: string;
    data: TrendDataPoint[];
    color?: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
  }>, options: {
    title?: string;
    height?: number;
    width?: number;
  } = {}): string {
    if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) {
      return chalk.yellow('No data available');
    }

    const {
      title = 'Comparison',
      height = 15,
      width = 60
    } = options;

    // 提取所有数据系列的值
    const series = datasets.map(ds => ds.data.map(d => d.value));

    // 生成图表
    const plot = asciichart.plot(series, {
      height,
      colors: datasets.map(ds => {
        switch (ds.color) {
          case 'red': return asciichart.red;
          case 'green': return asciichart.green;
          case 'blue': return asciichart.blue;
          case 'yellow': return asciichart.yellow;
          case 'magenta': return asciichart.magenta;
          case 'cyan': return asciichart.cyan;
          default: return asciichart.defaultColor;
        }
      })
    });

    // 构建输出
    const lines: string[] = [];

    // 标题
    lines.push('');
    lines.push(chalk.bold.cyan(`📊 ${title}`));
    lines.push(chalk.dim('─'.repeat(width)));
    lines.push('');

    // 图例
    lines.push(chalk.bold('Legend:'));
    for (const ds of datasets) {
      const colorFn = ds.color ? (chalk as any)[ds.color] : chalk.white;
      lines.push(`  ${colorFn('■')} ${ds.name}`);
    }
    lines.push('');

    // 图表
    lines.push(plot);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 渲染Agent成本占比（横向条形图）
   */
  renderAgentCostBreakdown(agents: Array<{
    name: string;
    cost: number;
    percentage: number;
  }>, options: {
    title?: string;
    maxBars?: number;
  } = {}): string {
    if (agents.length === 0) {
      return chalk.yellow('No data available');
    }

    const {
      title = 'Cost Breakdown by Agent',
      maxBars = 10
    } = options;

    const lines: string[] = [];

    // 标题
    lines.push('');
    lines.push(chalk.bold.cyan(`📊 ${title}`));
    lines.push(chalk.dim('─'.repeat(60)));
    lines.push('');

    // 显示前N个agent
    const topAgents = agents.slice(0, maxBars);

    // 找出最长的名称，用于对齐
    const maxNameLength = Math.max(...topAgents.map(a => a.name.length));

    for (const agent of topAgents) {
      const name = agent.name.padEnd(maxNameLength);
      const barLength = Math.round(agent.percentage / 2); // 50% = 25个字符
      const bar = '█'.repeat(Math.max(1, barLength));
      const colorFn = this.getColorForPercentage(agent.percentage);

      lines.push(
        `  ${chalk.bold(name)}  ${colorFn(bar)} ` +
        `${chalk.cyan(agent.percentage.toFixed(1) + '%')} ` +
        chalk.dim(`($${agent.cost.toFixed(2)})`)
      );
    }

    lines.push('');

    // 总计
    const totalCost = agents.reduce((sum, a) => sum + a.cost, 0);
    lines.push(chalk.bold(`  Total: ${chalk.green('$' + totalCost.toFixed(2))}`));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 根据百分比选择颜色
   */
  private getColorForPercentage(percentage: number): (text: string) => string {
    if (percentage >= 50) return chalk.red;
    if (percentage >= 30) return chalk.yellow;
    if (percentage >= 15) return chalk.cyan;
    return chalk.green;
  }

  /**
   * 格式化日期标签
   */
  private formatDateLabel(date: string): string {
    // 从 YYYY-MM-DD 转换为 MM/DD
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return date;
  }

  /**
   * 格式化数字（添加千位分隔符）
   */
  private formatNumber(num: number): string {
    return Math.round(num).toLocaleString();
  }
}
