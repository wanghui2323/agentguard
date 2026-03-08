"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityScanner = void 0;
const openclaw_1 = require("./detectors/openclaw");
const claude_1 = require("./detectors/claude");
const cursor_1 = require("./detectors/cursor");
class SecurityScanner {
    constructor() {
        this.detectors = new Map();
        // Register default detectors
        this.registerDetector(new openclaw_1.OpenClawDetector());
        this.registerDetector(new claude_1.ClaudeDetector());
        this.registerDetector(new cursor_1.CursorDetector());
        // TODO: Add more detectors
        // this.registerDetector(new CopilotDetector());
        // this.registerDetector(new DoubaoDetector());
    }
    /**
     * Register a new detector
     */
    registerDetector(detector) {
        this.detectors.set(detector.id, detector);
    }
    /**
     * Scan all agents (in parallel for better performance)
     */
    async scanAll() {
        // Parallel scanning for improved performance
        const scanPromises = Array.from(this.detectors.values()).map(detector => this.scanAgent(detector));
        const results = await Promise.all(scanPromises);
        // Filter out null results (agents not detected)
        return results.filter((result) => result !== null);
    }
    /**
     * Scan a specific agent
     */
    async scanAgent(detector) {
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
        }
        catch (error) {
            console.error(`Failed to scan ${detector.name}:`, error);
            return null;
        }
    }
    /**
     * Calculate security score
     */
    calculateScore(issues) {
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
    getSecurityLevel(score) {
        if (score >= 90)
            return 'excellent';
        if (score >= 70)
            return 'good';
        if (score >= 50)
            return 'needs-improvement';
        if (score >= 30)
            return 'risky';
        return 'dangerous';
    }
    /**
     * Get detector by ID
     */
    getDetector(id) {
        return this.detectors.get(id);
    }
    /**
     * Get all registered detectors
     */
    getAllDetectors() {
        return Array.from(this.detectors.values());
    }
}
exports.SecurityScanner = SecurityScanner;
