# Quick Reference Card - Enhanced Workflow

## 🚀 Quick Start

```bash
# 1. Install agents
mkdir -p .claude/agents
cp *.md .claude/agents/

# 2. Create feature directory
mkdir -p feature-dev

# 3. Start using
claude code
"Analyze requirements for [your feature]"
```

---

## 📋 Workflow At A Glance

```
User Input
    ↓
[Requirements Analyst] → Always
    ↓
[Architecture Designer] → If Complex
    ↓
[Implementation Engineer] → Always
    ↓
[QA Engineer] → Always
    ↓
[Documentation Specialist] → Always (for user features)
    ↓
[Human Review] → Optional (critical features)
    ↓
DONE
```

---

## 🎯 Agent Quick Reference

| Agent | Color | Use When | Output |
|-------|-------|----------|--------|
| **Requirements Analyst** | 🔵 Blue | Every feature | requirements.md, test-scenarios.md |
| **Architecture Designer** | 🟣 Purple | Complex only | architecture.md |
| **Implementation Engineer** | 🟢 Green | Every feature | Code + tests, implementation-notes.md |
| **QA Engineer** | 🔴 Red | Every feature | QA report, pass/fail |
| **Documentation Specialist** | 🔷 Cyan | User features | user-guide.md, api-documentation.md |

---

## 🤔 Decision Tree: Need Architecture?

**USE Architecture Designer if:**
- ✅ New microservice
- ✅ Public API
- ✅ Multiple system integrations
- ✅ Complex state management
- ✅ Unclear technical approach
- ✅ Scalability requirements

**SKIP Architecture Designer if:**
- ❌ Simple CRUD
- ❌ Bug fix
- ❌ UI-only change
- ❌ Following existing patterns
- ❌ Configuration change

---

## 📁 Feature-dev/ Structure

```
feature-dev/[feature-name]/
├── requirements.md          # Requirements Analyst
├── test-scenarios.md        # Req Analyst → Impl Engineer
├── architecture.md          # Architecture Designer (optional)
├── implementation-notes.md  # Implementation Engineer
├── user-guide.md            # Documentation Specialist
└── api-documentation.md     # Documentation Specialist (APIs)
```

---

## 💬 Example Invocations

### Start Feature
```
"Analyze requirements for user authentication API"
→ Invokes Requirements Analyst
```

### Complex Feature (with Architecture)
```
"This is complex. Use architecture-designer to design the system"
→ Invokes Architecture Designer
```

### Implementation
```
"Use implementation-engineer to build this following TDD"
→ Invokes Implementation Engineer
```

### Quality Check
```
"Use qa-engineer to verify this implementation"
→ Invokes QA Engineer
```

### Documentation
```
"Use documentation-specialist to create user docs"
→ Invokes Documentation Specialist
```

---

## ✅ Quality Gates

### Requirements Phase
- ✅ Clear, testable requirements
- ✅ Acceptance criteria defined
- ✅ Test scenarios documented
- ✅ Dependencies identified

### Architecture Phase (if used)
- ✅ High-level design complete
- ✅ Component boundaries clear
- ✅ Integration points identified
- ✅ Architecture decisions documented (ADRs)
- ✅ Scalability considered

### Implementation Phase
- ✅ Tests written FIRST
- ✅ All tests passing
- ✅ SOLID principles applied
- ✅ Clean code practices
- ✅ Implementation notes documented

### QA Phase
- ✅ 100% test pass
- ✅ Coverage requirements met
- ✅ No critical lint issues
- ✅ No security vulnerabilities
- ✅ Documentation complete

### Documentation Phase
- ✅ User guide created
- ✅ API docs complete (if API)
- ✅ Examples provided
- ✅ README updated

---

## 🔄 Iteration Loop

```
Implementation → QA → FAIL?
                ↓ NO (PASS)
        Implementation fixes issues
                ↓
        Re-submit to QA
                ↓
        Repeat until PASS
```

---

## 📊 Success Metrics

**Your workflow is working when:**
- ✅ Requirements are clear before coding
- ✅ Architecture is documented (complex features)
- ✅ Tests are written first
- ✅ 100% test pass rate
- ✅ Coverage targets met
- ✅ No critical security issues
- ✅ Documentation is complete
- ✅ Less rework needed

---

## 🎨 SOLID Principles Quick Reference

| Principle | Means | Example |
|-----------|-------|---------|
| **S**ingle Responsibility | One class, one job | UserValidator, UserRepository (not UserManager) |
| **O**pen/Closed | Extend, don't modify | Use interfaces, polymorphism |
| **L**iskov Substitution | Subtypes work like base | Derived classes don't break contracts |
| **I**nterface Segregation | Small, focused interfaces | No "fat" interfaces with unused methods |
| **D**ependency Inversion | Depend on abstractions | Inject dependencies, use interfaces |

---

## 🧪 TDD Cycle

```
RED → GREEN → REFACTOR
 ↑                ↓
 └────────────────┘
 
1. RED: Write failing test
2. GREEN: Write minimal code to pass
3. REFACTOR: Improve code, tests still pass
4. Repeat
```

---

## 📝 Documentation Types

| Type | File | When | Who |
|------|------|------|-----|
| Requirements | requirements.md | Always | Requirements Analyst |
| Architecture | architecture.md | Complex | Architecture Designer |
| Implementation | implementation-notes.md | Always | Implementation Engineer |
| Test Scenarios | test-scenarios.md | Always | Req → Impl Engineer |
| User Guide | user-guide.md | User features | Documentation Specialist |
| API Docs | api-documentation.md | APIs | Documentation Specialist |

---

## 🚦 When to Use Human Review

**Always Review:**
- 🔴 Security-critical code
- 🔴 Public APIs
- 🔴 Payment processing
- 🔴 Authentication/authorization

**Consider Review:**
- 🟡 Complex business logic
- 🟡 Performance-critical code
- 🟡 Major refactoring
- 🟡 Breaking changes

**Skip Review:**
- 🟢 Simple features
- 🟢 Bug fixes
- 🟢 Internal tools
- 🟢 Well-tested code

---

## 🛠️ Project Configuration (CLAUDE.md)

```markdown
# Testing Standards
- Framework: pytest
- Coverage: 85%
- Location: tests/

# Code Quality
- Linter: pylint + flake8
- Formatter: black
- Type Check: mypy

# Security
- Scanner: bandit + safety

# Architecture
- Follow SOLID principles
- Use dependency injection
- Repository pattern for data
```

---

## ⚡ Common Commands

```bash
# Run tests
pytest -v --cov=src --cov-report=html

# Check coverage
pytest --cov=src --cov-fail-under=85

# Run linter
pylint src/

# Run security check
bandit -r src/

# Run all quality checks
pytest && pylint src/ && bandit -r src/
```

---

## 🎯 Coverage Targets by Project Type

| Project Type | Target | Rationale |
|--------------|--------|-----------|
| Internal Tools | 70-80% | Balance speed/quality |
| SaaS Product | 85-90% | Production quality |
| Public API | 90-95% | High reliability needed |
| Financial/Health | 95%+ | Critical systems |

---

## 📞 Quick Help

**Problem**: Agent not being invoked?
**Solution**: Use explicit: `"Use the [agent-name] agent to..."`

**Problem**: QA keeps failing?
**Solution**: Fix issues, re-submit to QA, iterate

**Problem**: Should I use architecture for every feature?
**Solution**: No, only for complex features

**Problem**: Too much documentation?
**Solution**: Skip optional docs (user-guide, api-docs) for internal features

---

## 🎓 Learning Resources

**In This Package:**
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete overview
- `AGENT_WORKFLOW_SETUP.md` - Detailed setup guide
- `WORKFLOW_PLAUSIBILITY_ANALYSIS.md` - When to enhance
- Individual agent `.md` files - Detailed agent specs

**Key Concepts:**
- TDD (Test-Driven Development)
- SOLID Principles
- Clean Code
- Architecture Patterns
- Documentation Best Practices

---

## 📈 Maturity Roadmap

### Level 1: Starting Out
- ✅ Use core 3 agents (Requirements, Implementation, QA)
- ✅ Create feature-dev/ structure
- ✅ Achieve 80% coverage

### Level 2: Intermediate
- ✅ Add Architecture Designer for complex features
- ✅ Add Documentation Specialist
- ✅ Achieve 90% coverage
- ✅ Human review for critical code

### Level 3: Advanced
- ✅ All 5 agents used systematically
- ✅ 95%+ coverage
- ✅ Performance testing
- ✅ DevOps agent (optional)
- ✅ Compliance documentation (if needed)

---

## 🏁 Remember

**Golden Rules:**
1. Requirements BEFORE coding
2. Architecture for COMPLEX features
3. Tests BEFORE implementation
4. QA BEFORE merging
5. Documentation for USER features

**Success Formula:**
```
Clear Requirements + Good Architecture + TDD + 
Quality Gates + Documentation = Production-Ready Code
```

---

**Status**: ✅ Production Ready
**Version**: Enhanced Workflow (Option 1)
**Last Updated**: 2025-11-04
