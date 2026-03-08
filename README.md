# 🛡️ AgentGuard

> The security control center for local AI agents - monitor, protect, and manage all your AI assistants

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 🚀 What is AgentGuard?

AgentGuard is a comprehensive security monitoring and management tool for local AI agents. It automatically discovers AI assistants running on your machine, scans for security risks, and helps you fix vulnerabilities with one click.

### Supported AI Agents

- ✅ OpenClaw
- ✅ Claude Desktop (Code/Cowork)
- ✅ Cursor
- ✅ GitHub Copilot
- ✅ 豆包桌面版 (Doubao)

## ✨ Features

### Core Security Features
- 🔍 **Auto Discovery** - Automatically detect all AI agents running on your system
- 🛡️ **Security Scanning** - Comprehensive risk assessment (3-8 checks per agent)
- 📊 **Risk Scoring** - Clear security scoring system (0-100)
- 🔧 **Auto Fix** - One-click remediation for common issues
- 🎛️ **Process Control** - Stop/restart agents instantly

### Advanced Features
- 📈 **Real-time Monitoring** - Watch agent activities in real-time
- 💰 **Token Usage Tracking** - Monitor API costs across all agents
- 📄 **Export Reports** - Generate compliance reports (PDF/JSON)

## 📦 Installation

### NPM (Recommended)
```bash
npm install -g agentguard
```

### Homebrew (macOS)
```bash
brew install agentguard
```

### From Source
```bash
git clone https://github.com/yourusername/agentguard.git
cd agentguard
npm install
npm run build
npm link
```

## 🎯 Quick Start

### 1. Scan for AI Agents
```bash
agentguard scan
```

This will:
- Discover all AI agents on your system
- Perform security checks
- Display a risk score for each agent

### 2. Fix Security Issues
```bash
agentguard fix
```

Or fix a specific agent:
```bash
agentguard fix openclaw
```

### 3. Control Agents
```bash
# Stop an agent
agentguard stop openclaw

# Restart an agent
agentguard restart openclaw

# Check status
agentguard status
```

### 4. Monitor in Real-time
```bash
agentguard monitor
```

### 5. View Token Usage
```bash
agentguard tokens
```

### 6. Export Report
```bash
agentguard export report.pdf
```

## 🔍 Security Checks

### OpenClaw (8 checks)
- Port binding configuration
- Authentication mode
- DM policy settings
- Token strength
- Sandbox status
- Node.js version
- Workspace permissions
- Network exposure

### Claude Desktop (5 checks)
- MCP server permissions
- Computer Use mode
- Config file permissions
- Plugin security
- Network connections

### Cursor (4 checks)
- Port bindings
- Workspace Trust
- Extension signatures
- Indexed directories

### GitHub Copilot (3 checks)
- Telemetry settings
- Code suggestion sources
- Network proxy config

### 豆包 (4 checks)
- Permission requests (camera/mic)
- Network connections
- Recording permissions
- Auto-update mechanism

## 📊 Risk Scoring

| Score | Level | Description |
|-------|-------|-------------|
| 90-100 | ✅ Excellent | No significant risks |
| 70-89 | 🟢 Good | Minor issues, safe to use |
| 50-69 | 🟡 Needs Improvement | Some risks, review recommended |
| 30-49 | 🟠 Risky | Multiple issues, fix soon |
| 0-29 | 🔴 Dangerous | Critical risks, immediate action required |

## 🛠️ Development

### Setup
```bash
git clone https://github.com/yourusername/agentguard.git
cd agentguard
npm install
```

### Development Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Lint
```bash
npm run lint
```

## 🏗️ Architecture

```
agentguard/
├── src/
│   ├── core/              # Core detection engine
│   │   ├── detectors/     # Agent detector plugins
│   │   │   ├── openclaw.ts
│   │   │   ├── claude.ts
│   │   │   ├── cursor.ts
│   │   │   ├── copilot.ts
│   │   │   └── doubao.ts
│   │   ├── scanner.ts     # Security scanner
│   │   ├── fixer.ts       # Auto-fix engine
│   │   ├── controller.ts  # Process controller
│   │   ├── monitor.ts     # Real-time monitor
│   │   └── tokens.ts      # Token tracker
│   ├── cli/               # CLI interface
│   │   └── index.ts
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── tests/                 # Test suite
└── docs/                  # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Adding a New Agent Detector

1. Create a new detector in `src/core/detectors/`
2. Implement the `AgentDetector` interface
3. Add security checks specific to that agent
4. Register the detector in `src/core/scanner.ts`
5. Add tests

Example:
```typescript
import { AgentDetector } from '../types';

export class MyAgentDetector implements AgentDetector {
  id = 'myagent';
  name = 'My Agent';

  async detect() {
    // Implementation
  }

  async auditConfig() {
    // Security checks
  }
}
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- OpenClaw team for their security documentation
- Claude Desktop for MCP security guidelines
- The open-source community

## 📞 Support

- 🐛 [Report Issues](https://github.com/yourusername/agentguard/issues)
- 💬 [Discussions](https://github.com/yourusername/agentguard/discussions)
- 📧 Email: security@agentguard.dev

## ⚠️ Disclaimer

AgentGuard is a security monitoring tool. It does not provide absolute security guarantees. Always review security recommendations and apply them according to your specific use case and risk tolerance.

---

Made with ❤️ by the AgentGuard team
