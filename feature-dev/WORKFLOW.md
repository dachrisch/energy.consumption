# Claude Code Agent Workflow - Complete Guide

## 🚀 Quick Start

```bash
# 1. Install agents in your project
mkdir -p .claude/agents
cp requirements-analyst.md .claude/agents/
cp architecture-designer.md .claude/agents/
cp implementation-engineer.md .claude/agents/
cp qa-engineer.md .claude/agents/
cp documentation-specialist.md .claude/agents/
cp git-coordinator.md .claude/agents/

# 2. Create feature documentation directory
mkdir -p feature-dev

# 3. Start using
claude code
"Analyze requirements for user authentication"
```

---

## 🎯 Development Context

**Primary Target**: Mobile applications (iOS/Android)  
**Secondary Target**: Desktop/web (must be functional)

**This means:**
- Mobile-first design approach
- Touch-optimized interactions (44x44px minimum touch targets)
- Responsive design required (mobile → tablet → desktop)
- Test on mobile viewports first
- Consider mobile network conditions (3G/4G)
- Desktop is fully functional but optimized second

---

## 🔧 Tools & Capabilities

### Google Chrome MCP Integration
Requirements Analyst and QA Engineer have Chrome access to:
- ✅ Inspect current application state
- ✅ Test mobile viewports (375x667, 414x896, etc.)
- ✅ Test desktop viewports (1920x1080, 1366x768, etc.)
- ✅ Verify responsive behavior across breakpoints
- ✅ Test user flows in actual browser
- ✅ Capture screenshots for documentation
- ✅ Simulate network conditions (3G, 4G, offline)
- ✅ Test touch vs mouse/keyboard interactions

---

## 📋 The Workflow

```
USER INPUT
    ↓
┌─────────────────────────────┐
│ 1. Requirements Analyst     │ ← Always
│    Creates: requirements.md │
└─────────────┬───────────────┘
              ↓
        ┌──────────┐
        │Complex?  │
        └─┬──────┬─┘
        NO│      │YES
          │      ↓
          │  ┌─────────────────────────────┐
          │  │ 2. Architecture Designer    │ ← Complex features only
          │  │    Creates: architecture.md │
          │  └─────────────┬───────────────┘
          │                │
          └────────────────┘
              ↓
┌─────────────────────────────────┐
│ 3. Implementation Engineer      │ ← Always
│    Creates: code + tests        │
└─────────────┬───────────────────┘
              ↓
┌─────────────────────────────────┐
│ 4. QA Engineer                  │ ← Always
│    Verifies: tests + quality    │
└─────────────┬───────────────────┘
              ↓
        ┌──────────┐
        │  PASS?   │
        └─┬──────┬─┘
        NO│      │YES
          │      ↓
          │  ┌─────────────────────────────┐
          │  │ 5. Documentation Specialist │ ← User-facing features
          │  │    Creates: user-guide.md   │
          │  └─────────────┬───────────────┘
          │                │
          │                ↓
          │  ┌─────────────────────────────┐
          │  │ 6. Git Coordinator          │ ← Always when ready
          │  │    Creates: commit + PR     │
          │  └─────────────┬───────────────┘
          │                │
          ↓                ↓
    Fix Issues         DONE → PR Created
```

---

## 🎯 Agents Overview

| # | Agent | Color | Always Use? | Chrome Access | Output |
|---|-------|-------|-------------|---------------|--------|
| 1 | **Requirements Analyst** | 🔵 Blue | ✅ Yes | ✅ Yes | requirements.md, test-scenarios.md |
| 2 | **Architecture Designer** | 🟣 Purple | ⚠️ Complex only | ❌ No | architecture.md |
| 3 | **Implementation Engineer** | 🟢 Green | ✅ Yes | ❌ No | Code + tests + implementation-notes.md |
| 4 | **QA Engineer** | 🔴 Red | ✅ Yes | ✅ Yes | QA report (pass/fail) |
| 5 | **Documentation Specialist** | 🔷 Cyan | ⚠️ User features | ❌ No | user-guide.md, api-documentation.md |
| 6 | **Git Coordinator** | 🟠 Orange | ✅ Yes (when approved) | ❌ No | Commit + PR |

---

## 📁 Documentation Structure

Every feature gets organized documentation in `feature-dev/[feature-name]/`:

```
feature-dev/
└── user-authentication/
    ├── requirements.md          # Requirements Analyst
    ├── test-scenarios.md        # Requirements → Implementation
    ├── architecture.md          # Architecture Designer (optional)
    ├── implementation-notes.md  # Implementation Engineer
    ├── user-guide.md            # Documentation Specialist (optional)
    └── api-documentation.md     # Documentation Specialist (optional)
```

---

## 🤔 Decision Points

### When to Use Architecture Designer?

**✅ USE for:**
- New microservices
- Public APIs
- Multiple system integrations
- Complex state management
- Unclear technical approach
- Scalability requirements

**❌ SKIP for:**
- Simple CRUD operations
- Bug fixes
- UI-only changes
- Following existing patterns
- Configuration changes

### When to Use Documentation Specialist?

**✅ USE for:**
- User-facing features
- Public APIs
- Libraries or SDKs
- Complex features needing guides

**❌ SKIP for:**
- Internal utilities
- Bug fixes
- Refactoring without API changes

---

## 💬 Example Session

```
You: I need to build a REST API for user authentication with JWT tokens.

Claude: I'll start by analyzing the requirements.
[Invokes requirements-analyst]
✅ Created feature-dev/user-authentication/requirements.md

Claude: This is a complex feature with security implications. Let me design the architecture.
[Invokes architecture-designer]
✅ Created feature-dev/user-authentication/architecture.md

Claude: Now I'll implement this using test-driven development.
[Invokes implementation-engineer]
✅ Tests written (25 tests)
✅ Implementation complete
✅ Updated implementation-notes.md

Claude: Let me verify quality before proceeding.
[Invokes qa-engineer]
✅ All 25 tests passing (100%)
✅ Coverage: 87% (target: 80%)
✅ No lint issues
✅ No security vulnerabilities
✅ APPROVED

Claude: I'll create comprehensive API documentation.
[Invokes documentation-specialist]
✅ Created user-guide.md
✅ Created api-documentation.md
✅ Updated README.md

Claude: Everything is approved. Let me commit and create a PR.
[Invokes git-coordinator]
✅ Branch created: feature/user-authentication
✅ Commit created: feat(auth): add JWT authentication API
✅ PR #42 created: https://github.com/org/repo/pull/42

Done! Feature is ready for code review.
```

---

## ✅ Quality Gates

### After Requirements Analyst
- ✅ Clear, testable requirements
- ✅ Test scenarios defined
- ✅ Dependencies identified
- ✅ Mobile-first approach considered
- ✅ Current app state inspected (if exists)
- ✅ Platform requirements defined (mobile + desktop)

### After Architecture Designer (if used)
- ✅ System design documented
- ✅ Patterns selected
- ✅ Scalability considered
- ✅ Mobile-first architecture

### After Implementation Engineer
- ✅ Tests written FIRST
- ✅ All tests passing
- ✅ SOLID principles applied
- ✅ Clean code practices
- ✅ Responsive design implemented

### After QA Engineer (MUST PASS)
- ✅ 100% test pass rate
- ✅ Coverage requirements met
- ✅ No critical lint issues
- ✅ No security vulnerabilities
- ✅ Documentation complete
- ✅ **Mobile functionality verified (primary)**
- ✅ **Desktop functionality verified (secondary)**
- ✅ **Responsive breakpoints tested**
- ✅ **User flows work in browser**

### After Documentation Specialist
- ✅ User guide created
- ✅ API docs complete (if API)
- ✅ Examples provided
- ✅ Mobile + desktop usage documented

### After Git Coordinator
- ✅ Conventional commit created
- ✅ PR opened with description
- ✅ Ready for code review

---

## 🔄 Iteration Loop

If QA fails, the workflow iterates:

```
Implementation → QA → FAIL?
                       ↓
              Review feedback
                       ↓
              Fix issues
                       ↓
              Re-run QA
                       ↓
              PASS? → Continue
```

---

## 🎨 Key Concepts

### Test-Driven Development (TDD)
1. **RED**: Write failing test
2. **GREEN**: Write code to pass test
3. **REFACTOR**: Improve code, tests still pass
4. Repeat

### SOLID Principles
- **S**ingle Responsibility: One class, one job
- **O**pen/Closed: Extend, don't modify
- **L**iskov Substitution: Subtypes work like base types
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Depend on abstractions

### Conventional Commits
```
<type>(<scope>): <description>

Examples:
feat(auth): add JWT authentication
fix(email): resolve validation bug
docs(api): add endpoint examples
```

---

## 🛠️ Project Configuration

Create `CLAUDE.md` in your project root:

```markdown
# Testing Standards
- Framework: pytest
- Coverage Target: 85%
- Test Location: tests/

# Code Quality
- Linter: pylint + flake8
- Formatter: black
- Type Checking: mypy

# Security
- Scanner: bandit + safety

# Git
- Base Branch: main
- Branch Naming: feature/, fix/, docs/
- Commit Style: Conventional Commits
```

---

## 📊 Coverage Targets by Project Type

| Project Type | Target | Rationale |
|--------------|--------|-----------|
| Internal Tools | 70-80% | Speed/quality balance |
| SaaS Product | 85-90% | Production quality |
| Public API | 90-95% | High reliability |
| Financial/Healthcare | 95%+ | Critical systems |

---

## 🚦 When to Add Human Review

**Always Review:**
- 🔴 Security-critical code
- 🔴 Public APIs
- 🔴 Payment processing
- 🔴 Authentication/authorization

**Consider Review:**
- 🟡 Complex business logic
- 🟡 Performance-critical code
- 🟡 Breaking changes

**Optional Review:**
- 🟢 Simple features
- 🟢 Bug fixes
- 🟢 Internal tools

---

## ⚡ Common Commands

```bash
# Run tests with coverage
pytest -v --cov=src --cov-report=html

# Run linter
pylint src/

# Run security scan
bandit -r src/

# Create branch
git checkout -b feature/my-feature

# Create PR (with gh CLI)
gh pr create --fill
```

---

## 🎯 Success Metrics

Your workflow is working when you see:
- ✅ Requirements documented before coding
- ✅ Architecture designed for complex features
- ✅ Tests written before implementation
- ✅ 100% test pass rate
- ✅ Coverage targets met
- ✅ Clean commit history
- ✅ Comprehensive PR descriptions
- ✅ Less rework needed

---

## 🐛 Troubleshooting

**Q: Agent not being invoked?**
```
A: Use explicit invocation:
"Use the requirements-analyst agent to analyze this feature"
```

**Q: Should I use architecture designer every time?**
```
A: No, only for complex features. Skip for simple CRUD, bug fixes, UI changes.
```

**Q: QA keeps failing, what do I do?**
```
A: Review QA feedback → Fix issues → Re-run QA → Repeat until pass
```

**Q: Can I skip documentation specialist?**
```
A: Yes, for internal features. Always use for user-facing features and APIs.
```

**Q: Git coordinator won't commit?**
```
A: Ensure QA passed first. Git coordinator requires QA approval.
```

---

## 📚 Agent Files

All agents are in separate `.md` files for Claude Code:

1. `requirements-analyst.md` - Requirements analysis
2. `architecture-designer.md` - System architecture design
3. `implementation-engineer.md` - TDD implementation
4. `qa-engineer.md` - Quality verification
5. `documentation-specialist.md` - User documentation
6. `git-coordinator.md` - Git operations & PR creation

---

## 🎓 Workflow Maturity Levels

### Level 1: Starting
- ✅ Use 3 core agents (Requirements, Implementation, QA)
- ✅ Achieve 80% coverage
- Skip Architecture & Documentation for now

### Level 2: Intermediate
- ✅ Add Architecture for complex features
- ✅ Add Documentation for user features
- ✅ Achieve 90% coverage
- ✅ Use Git Coordinator consistently

### Level 3: Advanced
- ✅ All 6 agents used systematically
- ✅ 95%+ coverage
- ✅ Human review for critical features
- ✅ Optional: Add DevOps/Performance agents

---

## 🏁 Golden Rules

1. **Requirements BEFORE coding** - Always start with requirements-analyst
2. **Architecture for COMPLEX features** - Use architecture-designer when needed
3. **Tests BEFORE implementation** - TDD is mandatory
4. **QA BEFORE committing** - Must pass all quality gates
5. **Commit AFTER approval** - Git coordinator only runs after QA pass
6. **Documentation for USERS** - Document user-facing features

---

## 🎯 Complete Workflow Summary

```
Everything starts with clear requirements.
Complex features get architecture design.
Implementation always uses TDD.
QA must pass before proceeding.
User features get documentation.
Git coordinator creates clean commits and PRs.
Human review for critical features.
Merge after approval.
```

**Result**: Production-ready, well-tested, documented code with clean git history.

---

**Status**: ✅ Production Ready  
**Version**: Enhanced Workflow with Git Operations  
**Agents**: 6  
**Last Updated**: 2025-11-04
