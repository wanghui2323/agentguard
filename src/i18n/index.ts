/**
 * Internationalization (i18n) System
 *
 * Supports: Chinese (zh-CN) and English (en-US)
 * Default: Chinese
 */

export type Locale = 'zh-CN' | 'en-US';

export interface I18nMessages {
  // Common
  common: {
    appName: string;
    version: string;
    generatedAt: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
  };

  // CLI Commands
  cli: {
    scan: {
      scanning: string;
      completed: string;
      found: string;
      agents: string;
      overallScore: string;
      status: string;
      running: string;
      stopped: string;
      issues: string;
      noIssues: string;
      suggestion: string;
    };
    tokens: {
      analyzing: string;
      completed: string;
      report: string;
      costSummary: string;
      today: string;
      thisWeek: string;
      thisMonth: string;
      perAgent: string;
      tip: string;
    };
    export: {
      generating: string;
      completed: string;
      savedTo: string;
    };
  };

  // Security
  security: {
    score: string;
    excellent: string;
    good: string;
    needsImprovement: string;
    risky: string;
    dangerous: string;
    severity: {
      critical: string;
      high: string;
      medium: string;
      low: string;
      info: string;
    };
  };

  // Tokens & Cost
  tokens: {
    usage: string;
    inputTokens: string;
    outputTokens: string;
    totalTokens: string;
    cost: string;
    budget: string;
    dailyBudget: string;
    weeklyBudget: string;
    monthlyBudget: string;
    alert: string;
    setBudget: string;
  };

  // Report
  report: {
    title: string;
    securityReport: string;
    tokenReport: string;
    securityOverview: string;
    agentDetails: string;
    tokenStatistics: string;
    budgetTracking: string;
  };

  // Actions
  actions: {
    scan: string;
    fix: string;
    stop: string;
    restart: string;
    export: string;
    refresh: string;
    close: string;
  };
}

const messages: Record<Locale, I18nMessages> = {
  'zh-CN': {
    common: {
      appName: 'AgentGuard',
      version: '版本',
      generatedAt: '生成时间',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告'
    },
    cli: {
      scan: {
        scanning: '正在扫描 AI Agents...',
        completed: '扫描完成',
        found: '检测到',
        agents: '个 AI Agents',
        overallScore: '总体安全评分',
        status: '状态',
        running: '运行中',
        stopped: '已停止',
        issues: '个问题',
        noIssues: '无安全问题',
        suggestion: '建议操作'
      },
      tokens: {
        analyzing: '正在分析 Token 使用情况...',
        completed: 'Token 分析完成',
        report: 'Token 使用报告',
        costSummary: '成本汇总',
        today: '今日',
        thisWeek: '本周',
        thisMonth: '本月',
        perAgent: '按 Agent 分类',
        tip: '提示：使用 --budget-daily、--budget-weekly 或 --budget-monthly 设置预算限制'
      },
      export: {
        generating: '正在生成报告...',
        completed: '报告导出成功',
        savedTo: '报告已保存到'
      }
    },
    security: {
      score: '安全评分',
      excellent: '优秀',
      good: '良好',
      needsImprovement: '需改进',
      risky: '有风险',
      dangerous: '危险',
      severity: {
        critical: '严重',
        high: '高危',
        medium: '中危',
        low: '低危',
        info: '信息'
      }
    },
    tokens: {
      usage: 'Token 使用量',
      inputTokens: '输入 Token',
      outputTokens: '输出 Token',
      totalTokens: '总 Token',
      cost: '成本',
      budget: '预算',
      dailyBudget: '日预算',
      weeklyBudget: '周预算',
      monthlyBudget: '月预算',
      alert: '预算告警',
      setBudget: '设置预算'
    },
    report: {
      title: 'AgentGuard 安全报告',
      securityReport: '安全扫描报告',
      tokenReport: 'Token 使用报告',
      securityOverview: '安全概览',
      agentDetails: 'Agent 详情',
      tokenStatistics: 'Token 统计',
      budgetTracking: '预算追踪'
    },
    actions: {
      scan: '扫描',
      fix: '修复',
      stop: '停止',
      restart: '重启',
      export: '导出',
      refresh: '刷新',
      close: '关闭'
    }
  },
  'en-US': {
    common: {
      appName: 'AgentGuard',
      version: 'Version',
      generatedAt: 'Generated at',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning'
    },
    cli: {
      scan: {
        scanning: 'Scanning AI Agents...',
        completed: 'Scan completed',
        found: 'Found',
        agents: 'AI Agents',
        overallScore: 'Overall Security Score',
        status: 'Status',
        running: 'running',
        stopped: 'stopped',
        issues: 'issues',
        noIssues: 'No security issues',
        suggestion: 'Suggested action'
      },
      tokens: {
        analyzing: 'Analyzing token usage...',
        completed: 'Token analysis complete',
        report: 'Token Usage Report',
        costSummary: 'Cost Summary',
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        perAgent: 'Per-Agent Breakdown',
        tip: 'Tip: Set budget limits with --budget-daily, --budget-weekly, or --budget-monthly'
      },
      export: {
        generating: 'Generating security report...',
        completed: 'Report exported successfully',
        savedTo: 'Report saved to'
      }
    },
    security: {
      score: 'Security Score',
      excellent: 'Excellent',
      good: 'Good',
      needsImprovement: 'Needs Improvement',
      risky: 'Risky',
      dangerous: 'Dangerous',
      severity: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        info: 'Info'
      }
    },
    tokens: {
      usage: 'Token Usage',
      inputTokens: 'Input Tokens',
      outputTokens: 'Output Tokens',
      totalTokens: 'Total Tokens',
      cost: 'Cost',
      budget: 'Budget',
      dailyBudget: 'Daily Budget',
      weeklyBudget: 'Weekly Budget',
      monthlyBudget: 'Monthly Budget',
      alert: 'Budget Alert',
      setBudget: 'Set Budget'
    },
    report: {
      title: 'AgentGuard Security Report',
      securityReport: 'Security Scan Report',
      tokenReport: 'Token Usage Report',
      securityOverview: 'Security Overview',
      agentDetails: 'Agent Details',
      tokenStatistics: 'Token Statistics',
      budgetTracking: 'Budget Tracking'
    },
    actions: {
      scan: 'Scan',
      fix: 'Fix',
      stop: 'Stop',
      restart: 'Restart',
      export: 'Export',
      refresh: 'Refresh',
      close: 'Close'
    }
  }
};

export class I18n {
  private locale: Locale = 'zh-CN'; // Default to Chinese

  constructor(locale?: Locale) {
    if (locale) {
      this.locale = locale;
    } else {
      // Auto-detect from environment
      this.locale = this.detectLocale();
    }
  }

  /**
   * Detect locale from environment
   */
  private detectLocale(): Locale {
    // Check environment variable
    const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || '';

    if (lang.includes('zh') || lang.includes('CN')) {
      return 'zh-CN';
    } else if (lang.includes('en') || lang.includes('US')) {
      return 'en-US';
    }

    // Default to Chinese
    return 'zh-CN';
  }

  /**
   * Get current locale
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * Set locale
   */
  setLocale(locale: Locale): void {
    this.locale = locale;
  }

  /**
   * Get messages for current locale
   */
  getMessages(): I18nMessages {
    return messages[this.locale];
  }

  /**
   * Translate a key path
   */
  t(keyPath: string): string {
    const keys = keyPath.split('.');
    let value: any = messages[this.locale];

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return keyPath; // Return key if not found
      }
    }

    return value as string;
  }
}

// Export singleton instance
export const i18n = new I18n();

// Export convenience function
export const t = (keyPath: string) => i18n.t(keyPath);
