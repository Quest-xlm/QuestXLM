# Contributing to QuestXLM

Thank you for your interest in contributing to QuestXLM! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

- **Code Contributions**: Bug fixes, feature implementations, optimizations
- **Documentation**: Improve docs, write tutorials, create examples
- **Testing**: Write tests, report bugs, improve test coverage
- **Design**: UI/UX improvements, graphics, branding
- **Community**: Help users, moderate discussions, organize events

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Rust and Cargo (latest stable)
- Stellar CLI 21.0+
- Docker (for local development)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/questxlm.git
   cd QuestXLM
   ```

2. **Install Dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup Development Environment**
   ```bash
   npm run setup:dev
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

### Project Structure

```
QuestXLM/
├── contract/           # Soroban smart contracts (Rust)
├── frontend/          # Next.js frontend (TypeScript)
├── oracle/            # Oracle service (Node.js)
├── scripts/           # Deployment and utility scripts
├── docs/             # Documentation
├── tests/            # Integration tests
└── .github/          # GitHub workflows and templates
```

## 📝 Development Workflow

### 1. Issue First

- Check existing issues before creating new ones
- Use issue templates when available
- Discuss major changes before implementing

### 2. Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test improvements

### 3. Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

feat(contract): add reputation system
fix(frontend): resolve wallet connection issue
docs(readme): update setup instructions
test(oracle): add answer verification tests
```

### 4. Pull Request Process

1. **Create Draft PR** early for feedback
2. **Write Tests** for new functionality
3. **Update Documentation** as needed
4. **Ensure CI Passes** all checks
5. **Request Review** from maintainers

## 🧪 Testing Guidelines

### Smart Contracts
```bash
cd contract
cargo test
cargo test --release --all-features
```

### Frontend
```bash
cd frontend
npm test
npm run lint
npm run type-check
```

### Oracle
```bash
cd oracle
npm test
npm run test:integration
```

### Full Integration
```bash
npm run test:integration
```

## 📋 Code Standards

### Rust (Smart Contracts)

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` and `cargo clippy`
- Document public APIs with `///` comments
- Write comprehensive tests
- Handle errors explicitly

```rust
/// Calculate user reputation based on performance metrics
pub fn calculate_reputation(
    user_stats: &UserStats,
    difficulty_bonus: u32,
) -> Result<u32, ReputationError> {
    // Implementation
}
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Follow React best practices
- Use custom hooks for logic
- Implement proper error boundaries
- Write unit tests with Jest

```typescript
interface UserProgress {
  completions: Map<number, number>;
  totalEarned: string;
  currentStreak: number;
}

export function useUserProgress(address: string): {
  progress: UserProgress | null;
  isLoading: boolean;
  error: Error | null;
} {
  // Implementation
}
```

### Node.js (Oracle)

- Use ES modules (`import/export`)
- Implement proper error handling
- Add comprehensive logging
- Write integration tests
- Use TypeScript for complex services

```javascript
export class AnswerVerificationService {
  async verifyAnswer(submission) {
    try {
      // Implementation with proper error handling
    } catch (error) {
      this.logger.error('Verification failed', { error, submission });
      throw new VerificationError('Failed to verify answer');
    }
  }
}
```

## 🔒 Security Guidelines

### Smart Contract Security

- Follow [Soroban Security Best Practices](https://soroban.stellar.org/docs/security)
- Use formal verification when possible
- Implement access controls properly
- Handle arithmetic overflow/underflow
- Test edge cases thoroughly

### Frontend Security

- Validate all user inputs
- Use Content Security Policy
- Implement proper authentication
- Sanitize data display
- Use HTTPS in production

### Oracle Security

- Validate all API inputs
- Use rate limiting
- Implement proper authentication
- Log security events
- Use secure communication

## 📚 Documentation Standards

### Code Documentation

- Write clear, concise comments
- Document complex algorithms
- Explain business logic
- Include usage examples
- Keep docs up-to-date

### API Documentation

- Use OpenAPI/Swagger for REST APIs
- Document all parameters and responses
- Include example requests/responses
- Explain error codes
- Provide integration guides

### User Documentation

- Write step-by-step tutorials
- Include screenshots where helpful
- Explain concepts clearly
- Provide troubleshooting guides
- Keep examples current

## 🚀 Release Process

### Version Numbers

We use [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- `1.0.0` → `1.0.1` (patch: bug fixes)
- `1.0.1` → `1.1.0` (minor: new features)
- `1.1.0` → `2.0.0` (major: breaking changes)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers bumped
- [ ] Security audit completed
- [ ] Deployment tested on testnet
- [ ] Community notified

## 🏆 Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- Social media shoutouts
- Annual contributor awards
- Speaking opportunities

## ❓ Getting Help

### Questions & Discussions

- **GitHub Discussions** - General questions and ideas
- **Discord** - Real-time chat with community
- **Twitter** - Follow [@QuestXLM](https://twitter.com/questxlm)

### Bug Reports

- Use GitHub Issues with bug template
- Include reproduction steps
- Provide system information
- Share relevant logs/screenshots

### Feature Requests

- Check existing feature requests
- Use GitHub Issues with feature template
- Explain use case and benefits
- Consider implementation complexity

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

### Our Standards

- **Be Respectful** - Treat everyone with respect
- **Be Inclusive** - Welcome diverse perspectives
- **Be Constructive** - Provide helpful feedback
- **Be Professional** - Maintain high standards
- **Be Patient** - Help others learn and grow

## 🎉 Thank You!

Thank you for contributing to QuestXLM! Your contributions help make blockchain education accessible and rewarding for everyone.

For questions about contributing, please reach out to:
- Email: contribute@questxlm.org  
- Discord: [QuestXLM Community](https://discord.gg/questxlm)
- GitHub: [@questxlm](https://github.com/questxlm)