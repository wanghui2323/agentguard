/**
 * 历史数据记录系统测试
 */
import { HistoryDatabase } from '../src/core/history/HistoryDatabase';
import { HistoryRecorder } from '../src/core/history/HistoryRecorder';
import type { TokenUsageHistory } from '../src/core/history/types';
import type { Agent } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('History System Tests', () => {
  const testDbPath = path.join(os.tmpdir(), 'agentguard-test-history.db');
  let db: HistoryDatabase;

  beforeEach(() => {
    // 删除测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = new HistoryDatabase({ dbPath: testDbPath });
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('HistoryDatabase', () => {
    test('should create database and tables', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);

      const stats = db.getDatabaseStats();
      expect(stats.dbPath).toBe(testDbPath);
      expect(stats.tokenRecords).toBe(0);
      expect(stats.costRecords).toBe(0);
    });

    test('should save and retrieve token usage', () => {
      const record: TokenUsageHistory = {
        date: '2026-03-10',
        agentId: 'claude-code',
        agentName: 'Claude Code',
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationTokens: 100,
        cacheReadTokens: 200,
        totalTokens: 1800,
        estimatedCost: 0.05,
        requestCount: 5,
        createdAt: new Date().toISOString()
      };

      db.saveTokenUsage(record);

      const records = db.getTokenUsageHistory({ startDate: '2026-03-10', endDate: '2026-03-10' });
      expect(records.length).toBe(1);
      expect(records[0].agentId).toBe('claude-code');
      expect(records[0].totalTokens).toBe(1800);
    });

    test('should save batch token usage', () => {
      const records: TokenUsageHistory[] = [
        {
          date: '2026-03-10',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 1500,
          estimatedCost: 0.05,
          requestCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          date: '2026-03-10',
          agentId: 'cursor',
          agentName: 'Cursor',
          inputTokens: 2000,
          outputTokens: 1000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 3000,
          estimatedCost: 0.10,
          requestCount: 10,
          createdAt: new Date().toISOString()
        }
      ];

      db.saveTokenUsageBatch(records);

      const retrieved = db.getTokenUsageHistory({ startDate: '2026-03-10', endDate: '2026-03-10' });
      expect(retrieved.length).toBe(2);
    });

    test('should query token usage by date range', () => {
      const records: TokenUsageHistory[] = [
        {
          date: '2026-03-08',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 1500,
          estimatedCost: 0.05,
          requestCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          date: '2026-03-09',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 2000,
          outputTokens: 1000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 3000,
          estimatedCost: 0.10,
          requestCount: 10,
          createdAt: new Date().toISOString()
        },
        {
          date: '2026-03-10',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 1500,
          outputTokens: 750,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 2250,
          estimatedCost: 0.075,
          requestCount: 7,
          createdAt: new Date().toISOString()
        }
      ];

      db.saveTokenUsageBatch(records);

      const result = db.getTokenUsageHistory({
        startDate: '2026-03-09',
        endDate: '2026-03-10'
      });

      expect(result.length).toBe(2);
      expect(result[0].date).toBe('2026-03-10');
      expect(result[1].date).toBe('2026-03-09');
    });

    test('should filter by agent ID', () => {
      const records: TokenUsageHistory[] = [
        {
          date: '2026-03-10',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 1500,
          estimatedCost: 0.05,
          requestCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          date: '2026-03-10',
          agentId: 'cursor',
          agentName: 'Cursor',
          inputTokens: 2000,
          outputTokens: 1000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 3000,
          estimatedCost: 0.10,
          requestCount: 10,
          createdAt: new Date().toISOString()
        }
      ];

      db.saveTokenUsageBatch(records);

      const result = db.getTokenUsageHistory({ agentId: 'cursor' });
      expect(result.length).toBe(1);
      expect(result[0].agentId).toBe('cursor');
    });

    test('should get aggregated stats', () => {
      const records: TokenUsageHistory[] = [
        {
          date: '2026-03-08',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 1500,
          estimatedCost: 0.05,
          requestCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          date: '2026-03-09',
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 2000,
          outputTokens: 1000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 3000,
          estimatedCost: 0.10,
          requestCount: 10,
          createdAt: new Date().toISOString()
        },
        {
          date: '2026-03-09',
          agentId: 'cursor',
          agentName: 'Cursor',
          inputTokens: 1500,
          outputTokens: 750,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 2250,
          estimatedCost: 0.075,
          requestCount: 7,
          createdAt: new Date().toISOString()
        }
      ];

      db.saveTokenUsageBatch(records);

      const stats = db.getAggregatedStats('daily', '2026-03-08', '2026-03-09');

      expect(stats.totalCost).toBeCloseTo(0.225, 3);
      expect(stats.totalTokens).toBe(6750);
      expect(stats.totalRequests).toBe(22);
      expect(stats.topAgents.length).toBe(2);
      expect(stats.topAgents[0].agentId).toBe('claude-code');
    });

    test('should save and retrieve cost history', () => {
      const record = {
        date: '2026-03-10',
        totalCost: 0.25,
        breakdown: {
          'claude-code': 0.15,
          'cursor': 0.10
        },
        createdAt: new Date().toISOString()
      };

      db.saveCostHistory(record);

      const records = db.getCostHistory({ startDate: '2026-03-10' });
      expect(records.length).toBe(1);
      expect(records[0].totalCost).toBe(0.25);
      expect(records[0].breakdown['claude-code']).toBe(0.15);
    });

    test('should get database stats', () => {
      const stats = db.getDatabaseStats();

      expect(stats.dbPath).toBe(testDbPath);
      expect(stats.tokenRecords).toBe(0);
      expect(stats.costRecords).toBe(0);
      expect(typeof stats.fileSize).toBe('number');
      expect(typeof stats.fileSizeMB).toBe('string');
    });
  });

  describe('HistoryRecorder', () => {
    test('should record agent usage', () => {
      const recorder = new HistoryRecorder(db);

      const agent: Agent = {
        id: 'claude-code',
        name: 'Claude Code',
        status: 'running',
        detectedAt: new Date(),
        tokenUsage: {
          agentId: 'claude-code',
          agentName: 'Claude Code',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          estimatedCost: 0.05,
          requestCount: 5,
          period: 'daily',
          timestamp: new Date()
        }
      };

      recorder.recordAgentUsage(agent, '2026-03-10');

      const records = db.getTokenUsageHistory({ startDate: '2026-03-10', endDate: '2026-03-10' });
      expect(records.length).toBe(1);
      expect(records[0].agentId).toBe('claude-code');
    });

    test('should record all agents', () => {
      const recorder = new HistoryRecorder(db);

      const agents: Agent[] = [
        {
          id: 'claude-code',
          name: 'Claude Code',
          status: 'running',
          detectedAt: new Date(),
          tokenUsage: {
            agentId: 'claude-code',
            agentName: 'Claude Code',
            inputTokens: 1000,
            outputTokens: 500,
            totalTokens: 1500,
            estimatedCost: 0.05,
            requestCount: 5,
            period: 'daily',
            timestamp: new Date()
          }
        },
        {
          id: 'cursor',
          name: 'Cursor',
          status: 'running',
          detectedAt: new Date(),
          tokenUsage: {
            agentId: 'cursor',
            agentName: 'Cursor',
            inputTokens: 2000,
            outputTokens: 1000,
            totalTokens: 3000,
            estimatedCost: 0.10,
            requestCount: 10,
            period: 'daily',
            timestamp: new Date()
          }
        }
      ];

      recorder.recordAllAgents(agents, '2026-03-10');

      const tokenRecords = db.getTokenUsageHistory({ startDate: '2026-03-10', endDate: '2026-03-10' });
      expect(tokenRecords.length).toBe(2);

      const costRecords = db.getCostHistory({ startDate: '2026-03-10' });
      expect(costRecords.length).toBe(1);
      expect(costRecords[0].totalCost).toBeCloseTo(0.15, 2);
    });
  });
});
