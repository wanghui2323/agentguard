/**
 * Security Scanner Engine
 */
import type { Agent, AgentDetector, SecurityScanResult, SecurityIssue } from '../types';
import { OpenClawDetector } from './detectors/openclaw';
import { ClaudeDetector } from './detectors/claude';
import { CursorDetector } from './detectors/cursor';

export class SecurityScanner {
  private detectors: Map<string, AgentDetector> = new Map();

  constructor() {
    // Register default detectors
    this.registerDetector(new OpenClawDetector());
    this.registerDetector(new ClaudeDetector());
    this.registerDetector(new CursorDetector());
    // TODO: Add more detectors
    // this.registerDetector(new CopilotDetector());
    // this.registerDetector(new DoubaoDetector());
  }

  /**
   * Register a new detector
   */
  registerDetector(detector: AgentDetector): void {
    this.detectors.set(detector.id, detector);
  }

  /**
   * Scan all agents (in parallel for better performance)
   */
  async scanAll(): Promise<SecurityScanResult[]> {
    // Parallel scanning for improved performance
    const scanPromises = Array.from(this.detectors.values()).map(detector =>
      this.scanAgent(detector)
    );

    const results = await Promise.all(scanPromises);

    // Filter out null results (agents not detected)
    return results.filter((result): result is SecurityScanResult => result !== null);
  }

  /**
   * Scan a specific agent
   */
  async scanAgent(detector: AgentDetector): Promise<SecurityScanResult | null> {
    try {
      // Detect the agent
      const agent = await detector.detect();
      if (!agent) {
        return null;
      }

      // Perform security audits
      const issues = await detector.auditConfig();

      // Calculate risk score
      const score = this.calculateScore(issues);
      const level = this.getSecurityLevel(score);

      return {
        agent,
        issues,
        score,
        level,
        scannedAt: new Date()
      };
    } catch (error) {
      console.error(`Failed to scan ${detector.name}:`, error);
      return null;
    }
  }

  /**
   * Calculate security score
   */
  private calculateScore(issues: SecurityIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 40;
          break;
        case 'high':
          score -= 25;
          break;
        case 'medium':
          score -= 15;
          break;
        case 'low':
          score -= 5;
          break;
        case 'info':
          score -= 0;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Get security level from score
   */
  private getSecurityLevel(score: number): SecurityScanResult['level'] {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs-improvement';
    if (score >= 30) return 'risky';
    return 'dangerous';
  }

  /**
   * Get detector by ID
   */
  getDetector(id: string): AgentDetector | undefined {
    return this.detectors.get(id);
  }

  /**
   * Get all registered detectors
   */
  getAllDetectors(): AgentDetector[] {
    return Array.from(this.detectors.values());
  }
}
