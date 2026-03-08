# Contributing to AgentGuard

Thank you for your interest in contributing to AgentGuard! This document provides guidelines for contributing to the project.

## 🌟 How to Contribute

### Reporting Issues

- Check if the issue already exists
- Use a clear and descriptive title
- Provide detailed steps to reproduce
- Include your environment details (OS, Node version, etc.)

### Adding a New Agent Detector

We welcome contributions for new AI agent detectors! Here's how:

1. **Create a new detector file** in `src/core/detectors/`

```typescript
import type { AgentDetector, Agent, SecurityIssue } from '../../types';

export class MyAgentDetector implements AgentDetector {
  id = 'myagent';
  name = 'My Agent';
  version = '1.0.0';

  async detect(): Promise<Agent | null> {
    // Implement detection logic
  }

  async auditConfig(): Promise<SecurityIssue[]> {
    // Implement security checks
  }

  // Implement other required methods...
}
```

2. **Register the detector** in `src/core/scanner.ts`

```typescript
import { MyAgentDetector } from './detectors/myagent';

constructor() {
  this.registerDetector(new MyAgentDetector());
}
```

3. **Add tests** in `tests/detectors/myagent.test.ts`

4. **Update documentation** - Add your agent to the README

### Security Checks Guidelines

When adding security checks:

- **Be specific**: Clearly explain what the risk is
- **Provide recommendations**: Tell users how to fix it
- **Set appropriate severity**:
  - `critical`: Immediate action required (e.g., no authentication)
  - `high`: Significant risk (e.g., outdated software with CVEs)
  - `medium`: Moderate risk (e.g., weak passwords)
  - `low`: Minor concern (e.g., verbose logging)
  - `info`: Informational only

- **Mark auto-fixable**: Only if you can safely automate the fix

### Code Style

- Use TypeScript strict mode
- Follow existing code structure
- Add JSDoc comments for public APIs
- Run `npm run lint` before committing

### Testing

- Add unit tests for new features
- Ensure all tests pass: `npm test`
- Test on different platforms if possible

## 📋 Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/agentguard.git
cd agentguard

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test
```

## 🔄 Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting
5. Commit with clear messages: `git commit -m "Add: MyAgent detector"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

### PR Checklist

- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No linting errors

## 🎯 Priority Areas

We especially welcome contributions in these areas:

1. **New Agent Detectors**
   - Claude Desktop
   - Cursor
   - GitHub Copilot
   - 豆包 (Doubao)
   - MiniMax
   - 通义千问

2. **Advanced Features**
   - Token usage tracking
   - Real-time monitoring
   - Export reports (PDF/HTML)
   - GUI dashboard

3. **Platform Support**
   - Windows support
   - Linux support improvements
   - Docker containerization

4. **Documentation**
   - Translation (中文/English)
   - Video tutorials
   - Best practices guides

## 💬 Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and ideas
- **Email**: security@agentguard.dev (security issues only)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making AgentGuard better! 🛡️
