# Claude Code Agent Workflow Setup - Enhanced Edition

This repository contains **six specialized agents** that work together to implement a complete software development workflow following best practices for requirements analysis, architecture design, test-driven development, quality assurance, documentation, and workspace hygiene.

## Agent Overview

### 1. Requirements Analyst (`requirements-analyst`)
- **Purpose**: Transforms user input into clear, actionable technical specifications
- **Color**: Blue
- **When to Use**: At the start of any feature or when clarifying requirements

### 2. Architecture Designer (`architecture-designer`) 🆕
- **Purpose**: Designs high-level system architecture before implementation
- **Color**: Purple
- **When to Use**: For complex features, new components, or unclear technical approaches

### 3. Implementation Engineer (`implementation-engineer`)
- **Purpose**: Builds production-ready code following SOLID principles with test-first approach
- **Color**: Green
- **When to Use**: After requirements (and architecture if needed) are clear

### 4. QA Engineer (`qa-engineer`)
- **Purpose**: Ensures 100% test success, coverage requirements, code quality, and security
- **Color**: Red
- **When to Use**: After implementation to validate quality before approval

### 5. Documentation Specialist (`documentation-specialist`) 🆕
- **Purpose**: Creates and maintains comprehensive user and API documentation
- **Color**: Cyan
- **When to Use**: After implementation to create user-facing documentation

### 6. Cleanup Coordinator (`cleanup-coordinator`) 🆕
- **Purpose**: Ensures working directory contains only PR-relevant files, removes dead code, redirects misplaced changes
- **Color**: Yellow
- **When to Use**: After QA approval and documentation, before git operations

## Installation

### Option 1: Project-Level Agents (Recommended)
Place agents in your project's `.claude/agents/` directory:

```bash
# Create agents directory in your project
mkdir -p .claude/agents

# Copy agent definition files
cp requirements-analyst.md .claude/agents/
cp architecture-designer.md .claude/agents/
cp implementation-engineer.md .claude/agents/
cp qa-engineer.md .claude/agents/
cp documentation-specialist.md .claude/agents/
cp cleanup-coordinator.md .claude/agents/
cp git-coordinator.md .claude/agents/
```

These agents will be available to anyone working on the project and versioned with your code.

### Option 2: Global Agents
Place agents in your global Claude Code configuration:

```bash
# Copy to global agents directory
# Location varies by OS:
# - macOS/Linux: ~/.config/claude/agents/
# - Windows: %APPDATA%\Claude\agents\

cp requirements-analyst.md ~/.config/claude/agents/
cp architecture-designer.md ~/.config/claude/agents/
cp implementation-engineer.md ~/.config/claude/agents/
cp qa-engineer.md ~/.config/claude/agents/
cp documentation-specialist.md ~/.config/claude/agents/
cp cleanup-coordinator.md ~/.config/claude/agents/
cp git-coordinator.md ~/.config/claude/agents/
```

## Enhanced Workflow Process (Option 1)

```
User Input
    ↓
┌─────────────────────────────────────────┐
│  1. Requirements Analyst                │
│     - Analyzes user needs               │
│     - Creates requirements.md           │
│     - Creates test-scenarios.md         │
│     - Creates initial documentation     │
└──────────────────┬──────────────────────┘
                   ↓
            ┌──────────────┐
            │  Complex?    │
            └──┬────────┬──┘
             NO│        │YES
               │        ↓
               │  ┌─────────────────────────────────┐
               │  │  2. Architecture Designer       │
               │  │     - Reviews requirements      │
               │  │     - Designs system            │
               │  │     - Creates architecture.md   │
               │  │     - Selects patterns          │
               │  └─────────┬───────────────────────┘
               │            │
               └────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  3. Implementation Engineer             │
│     - Writes tests FIRST (TDD)          │
│     - Implements code (SOLID)           │
│     - Updates implementation-notes.md   │
│     - Updates test-scenarios.md         │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  4. QA Engineer                         │
│     - Runs all tests (100% pass)        │
│     - Checks coverage                   │
│     - Runs lint/security checks         │
│     - Validates SOLID principles        │
│     - Verifies documentation            │
└──────────────────┬──────────────────────┘
                   ↓
            ┌──────────────┐
            │    PASS?     │
            └──┬────────┬──┘
             NO│        │YES
               │        ↓
               │  ┌─────────────────────────────────┐
               │  │  5. Documentation Specialist    │
               │  │     - Creates user-guide.md     │
               │  │     - Creates api-docs.md       │
               │  │     - Updates README            │
               │  └─────────┬───────────────────────┘
               │            │
               │            ↓
               │  ┌─────────────────────────────────┐
               │  │  6. Cleanup Coordinator 🆕      │
               │  │     - Verifies PR scope         │
               │  │     - Removes dead code         │
               │  │     - Redirects out-of-scope    │
               │  │     - Cleans artifacts          │
               │  │     - Creates cleanup-report.md │
               │  └─────────┬───────────────────────┘
               │            │
               │            ↓
               │  ┌─────────────────────────────────┐
               │  │  7. Git Coordinator 🆕          │
               │  │     - Commits changes           │
               │  │     - Creates PR                │
               │  │     - Handles redirected PRs    │
               │  └─────────┬───────────────────────┘
               │            │
               │            ↓
               │  ┌─────────────────────────────────┐
               │  │  8. Human Review (OPTIONAL)     │
               │  │     - Verify design decisions   │
               │  │     - Check business logic      │
               │  │     - Approve for deployment    │
               │  └─────────┬───────────────────────┘
               │            │
               │            ↓
               │      ┌──────────┐
               │      │APPROVED? │
               │      └──┬────┬──┘
               │       NO│    │YES
               ↓         ↓    ↓
        Back to      DONE/READY
        Implementation  FOR MERGE
```

## Usage Examples

### Example 1: Building a Complex New Feature

```
User: I need a real-time notification system that sends notifications via WebSocket, email, and SMS based on user preferences.

Claude: This is a complex feature. I'll start with requirements analysis, then architecture design.

[Invokes requirements-analyst agent]
→ Produces detailed technical specification in feature-dev/notifications/
  - requirements.md (functional & non-functional requirements)
  - test-scenarios.md (all test cases)
  - Initial user-guide.md structure

Claude: This is a complex feature with multiple integrations. Let me design the architecture.

[Invokes architecture-designer agent]
→ Creates architecture.md with:
  - Event-driven architecture design
  - Component breakdown (WebSocket server, Email service, SMS service)
  - Message queue integration (Redis Pub/Sub)
  - Data models and schemas
  - Integration patterns
  - Scalability strategy
  - Architecture Decision Records (ADRs)

Claude: Now I'll implement this following TDD principles.

[Invokes implementation-engineer agent]
→ Writes tests first for each component
→ Implements notification system following SOLID principles
→ Creates implementation-notes.md
→ Updates test-scenarios.md with actual coverage

Claude: Let me submit this to QA for verification.

[Invokes qa-engineer agent]
→ Runs all tests (100% pass required)
→ Checks coverage (meets 85% requirement)
→ Runs lint and security checks
→ Verifies documentation is complete
→ Validates SOLID principles application

Result: ✅ PASS

Claude: Now let me create comprehensive documentation.

[Invokes documentation-specialist agent]
→ Creates detailed user-guide.md
→ Creates api-documentation.md with WebSocket API
→ Updates README with notification feature
→ Adds examples and troubleshooting

Result: Documentation complete

Claude: Let me clean up the workspace before creating the PR.

[Invokes cleanup-coordinator agent]
→ Analyzes PR scope (notifications feature)
→ Detects 3 unrelated CSS changes from styling branch
→ Finds 2 obsolete helper files no longer used
→ Identifies 15 unused imports across files
→ Removes build artifacts (.next/, dist/)
→ Creates cleanup-report.md with full details
→ Redirects CSS changes to feature/style-updates branch
→ Removes dead code and unused imports

Result: ✅ Workspace clean, ready for git operations

Claude: Now I'll create the PR.

[Invokes git-coordinator agent]
→ Commits notification feature changes
→ Creates PR for notifications
→ Notes: CSS changes will be separate PR (feature/style-updates)
→ Returns PR URL

Result: Feature complete and ready for human review/merge
```

### Example 2: Simple Feature (Architecture Not Needed)

```
User: Add a GET endpoint to retrieve user profile by ID

Claude: This is straightforward. I'll start with requirements.

[Invokes requirements-analyst agent]
→ Creates requirements.md (simple endpoint spec)
→ Creates test-scenarios.md

Claude: This follows existing patterns, no architecture needed. Moving to implementation.

[Invokes implementation-engineer agent]
→ Writes tests first
→ Implements endpoint
→ Updates documentation

[Invokes qa-engineer agent]
→ Verifies all tests pass and coverage
Result: ✅ PASS

[Invokes documentation-specialist agent]
→ Updates API documentation
→ Adds endpoint examples

Result: Complete
```

### Example 3: Manual Agent Invocation

You can explicitly invoke agents at any time:

```bash
# Start with requirements analysis
Use the requirements-analyst agent to analyze this feature request: 
"Build a REST API endpoint for user authentication"

# For complex features, add architecture design
Use the architecture-designer agent to design the system architecture
for this authentication service

# Move to implementation
Use the implementation-engineer agent to implement the specification 
following TDD principles

# Validate with QA
Use the qa-engineer agent to verify this implementation meets all 
quality standards

# Create user documentation
Use the documentation-specialist agent to create comprehensive 
user and API documentation
```

### Example 4: Fixing Issues After QA Failure

```
# QA identifies test failures and code quality issues
qa-engineer: ❌ FAIL
- 3 tests failing (email validation, duplicate user, rate limiting)
- Coverage at 75% (need 80%)
- 2 security issues (hardcoded secret, SQL injection risk)
- Missing implementation-notes.md

# User or Claude invokes implementation engineer to fix
Use the implementation-engineer agent to fix these issues:
1. Fix failing tests for email validation and duplicate user check
2. Add rate limiting tests and implementation
3. Remove hardcoded secrets, use environment variables
4. Use parameterized queries to prevent SQL injection
5. Add tests to reach 80% coverage
6. Create implementation-notes.md

[implementation-engineer fixes all issues]

# Re-submit to QA
Use the qa-engineer agent to re-verify the implementation

qa-engineer: ✅ PASS
- All tests passing (100%)
- Coverage at 82%
- No security issues
- All documentation complete

[documentation-specialist updates docs with security notes]

Result: Approved for merge
```

## Configuration

### Project-Specific Settings

Create a `CLAUDE.md` file in your project root to define project standards:

```markdown
# Project Configuration for Claude Code Agents

## Testing Standards
- Framework: pytest
- Coverage Requirement: 85% line coverage
- Test Location: tests/ directory
- Coverage Config: .coveragerc

## Code Quality
- Linter: pylint + flake8
- Formatter: black
- Type Checking: mypy
- Max Function Length: 20 lines
- Max Function Complexity: 10

## Security
- Security Scanner: bandit
- Dependency Scanner: safety

## Architecture Principles
- Follow SOLID principles strictly
- Use dependency injection
- Repository pattern for data access
- Service layer for business logic

## Testing Approach
- Test-Driven Development (TDD) required
- Write tests before implementation
- AAA pattern (Arrange-Act-Assert)
- Test happy paths, edge cases, and errors
```

### Coverage Configuration Example

**Python (.coveragerc)**
```ini
[run]
source = src
omit = 
    */tests/*
    */migrations/*
    */__init__.py

[report]
precision = 2
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
```

**JavaScript (jest.config.js)**
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Agent Capabilities

### Requirements Analyst
- **Tools**: Read, Write, Grep, Glob, TodoWrite, WebSearch
- **Outputs**: 
  - Technical specifications (requirements.md)
  - Test scenarios (test-scenarios.md)
  - Initial documentation structure
- **Key Features**:
  - Clarifies ambiguous requirements
  - Defines testable acceptance criteria
  - Identifies dependencies and constraints
  - Prepares test strategy
  - Creates feature-dev/ directory structure

### Architecture Designer 🆕
- **Tools**: Read, Write, Grep, Glob, WebSearch, TodoWrite
- **Outputs**:
  - System architecture design (architecture.md)
  - Architecture Decision Records (ADRs)
  - Component diagrams and data models
- **Key Features**:
  - High-level system design
  - Pattern selection (microservices, event-driven, etc.)
  - Technology stack recommendations
  - Scalability and performance planning
  - Security architecture
  - Integration design
  - **When to Use**: Complex features, new services, multiple integrations

### Implementation Engineer
- **Tools**: Read, Write, Edit, MultiEdit, Grep, Glob, Bash, TodoWrite
- **Outputs**: 
  - Tests + Implementation code
  - Implementation notes (implementation-notes.md)
  - Updated test scenarios
- **Key Features**:
  - Test-Driven Development (TDD)
  - SOLID principles application
  - Clean code practices
  - Comprehensive documentation
  - Automatic QA collaboration
  - Reads from feature-dev/ documentation

### QA Engineer
- **Tools**: Read, Grep, Glob, Bash, TodoWrite, Write
- **Outputs**: 
  - Comprehensive QA report
  - Pass/Fail verdict
  - Actionable feedback
- **Key Features**:
  - Runs complete test suite
  - Measures code coverage
  - Executes lint/security checks
  - Reviews SOLID/clean code adherence
  - Verifies documentation completeness
  - Provides actionable feedback
  - Coordinates with implementation engineer for fixes

### Documentation Specialist 🆕
- **Tools**: Read, Write, Edit, Grep, Glob, TodoWrite
- **Outputs**:
  - User guides (user-guide.md)
  - API documentation (api-documentation.md)
  - Updated README files
  - Examples and tutorials
- **Key Features**:
  - Creates comprehensive user documentation
  - Writes API reference docs
  - Provides practical examples
  - Updates project README
  - Ensures documentation accuracy
  - **When to Use**: After implementation for user-facing docs

### Cleanup Coordinator 🆕
- **Tools**: Read, Write, Bash, Grep, Glob, TodoWrite
- **Outputs**:
  - Cleanup report (cleanup-report.md)
  - Clean git status
  - Redirected PR branches
- **Key Features**:
  - PR scope verification
  - Dead code detection and removal
  - Out-of-scope change redirection
  - Build artifact cleanup
  - Sensitive data detection
  - Working directory hygiene
  - Coordinates with git-coordinator
  - **When to Use**: After QA + documentation, before git operations

### Git Coordinator 🆕
- **Tools**: Bash, Read, Grep, Glob, Write, TodoWrite
- **Outputs**:
  - Git commits with conventional format
  - Pull requests
  - Branch management
- **Key Features**:
  - Collects all changes
  - Creates conventional commits
  - Opens pull requests
  - Handles multiple PR branches (from cleanup coordinator)
  - Ensures clean git history
  - **When to Use**: After cleanup coordinator approval

## Best Practices

### 1. Always Start with Requirements Analysis
Don't skip the requirements phase, even for small features. It ensures:
- Clear understanding of what needs to be built
- Testable acceptance criteria
- Proper test strategy

### 2. Follow Test-First Development
Implementation engineer always writes tests before implementation:
- Helps think through design
- Ensures testability
- Provides living documentation
- Catches bugs early

### 3. Iterate on QA Feedback
Don't merge code until QA approves:
- Fix all critical issues
- Meet coverage requirements
- Pass all quality checks
- Address security vulnerabilities

### 4. Keep Agents Focused
Each agent has a specific role:
- Requirements analyst: Only analyzes requirements
- Implementation engineer: Only writes code and tests
- QA engineer: Only validates quality

### 5. Document Project Standards
Use CLAUDE.md to communicate:
- Testing requirements
- Coverage thresholds
- Code quality standards
- Security requirements
- Architecture principles

## Troubleshooting

### Agent Not Being Invoked Automatically
Claude Code will automatically invoke agents based on context. If not:
- Use explicit invocation: "Use the [agent-name] agent to..."
- Check agent description matches your task
- Ensure agents are in correct directory

### Tests Not Running
QA engineer will discover test framework automatically. Ensure:
- Tests are in standard locations (tests/, __tests__, etc.)
- Test framework is installed
- Configuration files are present

### Coverage Tool Not Found
QA engineer looks for coverage configuration. Make sure:
- Coverage tool is installed (coverage.py, jest, etc.)
- Configuration file exists
- Coverage command is available in PATH

### Lint/Security Tools Not Running
QA engineer only runs configured tools. To enable:
- Install tools (pylint, bandit, eslint, etc.)
- Add configuration files
- Document in CLAUDE.md which tools to use

## Advanced Usage

### Custom Coverage Requirements
Override default coverage in your configuration:

```markdown
# In CLAUDE.md
Coverage Requirements:
- Overall: 90% line coverage
- Critical modules: 95% coverage
- Utility modules: 80% coverage
```

### Additional Quality Checks
Extend QA engineer's checks:

```markdown
# In CLAUDE.md
Additional Quality Checks:
- Run integration tests: npm run test:integration
- Check bundle size: npm run build && npm run size-check
- Validate documentation: npm run docs:validate
```

### Multi-Language Projects
Agents work with any language. Configure per language:

```markdown
# In CLAUDE.md
Language-Specific Standards:

Python:
- Test Framework: pytest
- Linter: pylint + flake8
- Coverage: 85%

TypeScript:
- Test Framework: jest
- Linter: eslint
- Coverage: 80%
```

## Contributing

When contributing to projects using these agents:

1. **New Features**: Start with requirements-analyst
2. **Bug Fixes**: Use implementation-engineer with QA verification
3. **Refactoring**: Let QA engineer validate no regressions
4. **Documentation**: Can update CLAUDE.md to improve agent behavior

## Summary

This enhanced workflow with **seven specialized agents** provides:
- ✅ Clear requirements before coding
- ✅ **Architecture design for complex features** 🆕
- ✅ Test-driven development by default
- ✅ SOLID principles and clean code
- ✅ Comprehensive quality assurance
- ✅ Automated security checking
- ✅ High test coverage
- ✅ **Complete user and API documentation** 🆕
- ✅ **Workspace cleanup and PR hygiene** 🆕
- ✅ **Dead code removal** 🆕
- ✅ **Out-of-scope change management** 🆕
- ✅ **Professional git workflow** 🆕
- ✅ Production-ready code
- ✅ **Human review gate option** 🆕

### Enhanced Workflow - What's New:

1. **Architecture Designer Agent**: Prevents poor architectural decisions by designing system structure upfront for complex features
2. **Documentation Specialist Agent**: Creates comprehensive user guides and API documentation
3. **Cleanup Coordinator Agent**: Ensures workspace hygiene, removes dead code, redirects out-of-scope changes
4. **Git Coordinator Agent**: Professional git workflow with conventional commits and PR management
5. **Human Review Gate**: Optional step before deployment for critical features
6. **Feature-dev/ Directory**: Structured documentation for every feature
7. **Flexible Workflow**: Architecture step is optional for simple features
8. **Automated Cleanup**: Never commit dead code or out-of-scope changes

### When to Use Full Workflow:
- ✅ Complex features with multiple components
- ✅ New microservices or APIs
- ✅ Features with unclear technical approach
- ✅ Systems requiring specific scalability patterns
- ✅ Public-facing APIs
- ✅ Features with multiple integrations

### When to Skip Architecture Step:
- ❌ Simple CRUD operations
- ❌ Minor bug fixes
- ❌ UI-only changes
- ❌ Features following established patterns
- ❌ Configuration changes

### When to Skip Cleanup Step:
- ❌ Trivial one-file changes
- ❌ Documentation-only updates
- ❌ Quick bug fixes (single file)
- ❌ When workspace is already clean

The seven agents work together seamlessly, with each specializing in their domain while communicating effectively to deliver high-quality, well-documented, and clean software with professional git workflow.
