# Claude Code Agents - Complete Development Workflow

**6 specialized agents** that work together to deliver production-ready, **mobile-first** code from requirements to pull request.

## 🎯 Mobile-First Development

**Primary Target**: Mobile (iOS/Android)  
**Secondary Target**: Desktop/Web (fully functional)

- Touch-optimized interactions
- Responsive design (mobile → tablet → desktop)
- Mobile network considerations
- Desktop as secondary but fully functional

## 🔧 Chrome Integration

**Requirements Analyst** and **QA Engineer** have Chrome MCP access to:
- Inspect current application state
- Test mobile viewports (iPhone, Android sizes)
- Test desktop viewports
- Verify responsive behavior
- Test actual user flows in browser
- Capture screenshots

---

## 📦 What's Included

### Agent Files (6)
1. `requirements-analyst.md` - Analyzes requirements
2. `architecture-designer.md` - Designs system architecture  
3. `implementation-engineer.md` - Implements with TDD
4. `qa-engineer.md` - Verifies quality
5. `documentation-specialist.md` - Creates user docs
6. `git-coordinator.md` - Commits & creates PRs

### Documentation (1)
- `WORKFLOW.md` - **Complete workflow guide** (read this first!)

## 🚀 Installation

```bash
# Copy agents to your project
mkdir -p .claude/agents
cp *.md .claude/agents/

# Create feature docs directory
mkdir -p feature-dev

# Start using
claude code
```

## 📋 The Workflow

```
Requirements → [Architecture] → Implementation → QA → [Docs] → Commit/PR
```

**Required agents**: Requirements, Implementation, QA, Git Coordinator  
**Optional agents**: Architecture (complex features), Documentation (user features)

## 📖 Full Documentation

See **[WORKFLOW.md](computer:///mnt/user-data/outputs/WORKFLOW.md)** for:
- Complete workflow explanation
- When to use each agent
- Quality gates
- Examples
- Troubleshooting
- Best practices

## ✨ Key Features

✅ **Mobile-First Development** - Primary focus on mobile, desktop secondary  
✅ **Chrome Integration** - Test actual app behavior in browser  
✅ Test-Driven Development (TDD)  
✅ SOLID Principles & Clean Code  
✅ Architecture design for complex features  
✅ Comprehensive QA verification (code + browser)  
✅ User documentation generation  
✅ Conventional commits & PR automation  
✅ 100% test pass requirement  
✅ Security & lint checking  
✅ **Responsive testing** across all breakpoints  

## 🎯 Quick Example

```
You: "Build a mobile-first user profile page with avatar upload"

Claude automatically uses:
1. Requirements Analyst 
   → Inspects current app in Chrome (mobile + desktop)
   → Creates requirements.md with mobile-first design
   
2. Architecture Designer (if complex)
   → Creates architecture.md
   
3. Implementation Engineer 
   → Writes tests + code
   → Implements responsive design
   
4. QA Engineer
   → Verifies quality (100% tests pass)
   → Tests in Chrome mobile viewports (375px, 414px)
   → Tests in Chrome desktop viewports (1920px)
   → Verifies touch interactions work
   → Tests responsive breakpoints
   
5. Documentation Specialist 
   → Creates user guide (mobile + desktop)
   → Creates API docs
   
6. Git Coordinator 
   → Commits & creates PR

Result: Mobile-first, production-ready feature with browser verification
```

## 🆘 Support

**Read first**: WORKFLOW.md has complete documentation

**Common issues**:
- Agent not invoked? Try: `"Use the [agent-name] agent to..."`
- QA failing? Fix issues → re-run QA → repeat until pass
- Skip architecture? Yes, for simple features
- Skip documentation? Yes, for internal features

## 📊 Project Types

| Type | Use All Agents? | Coverage Target |
|------|----------------|-----------------|
| Internal Tools | Optional arch/docs | 70-80% |
| SaaS Product | Recommended | 85-90% |
| Public API | Yes | 90-95% |
| Critical Systems | Yes + human review | 95%+ |

## 🎓 Getting Started

1. **Install agents** (see above)
2. **Read WORKFLOW.md** (complete guide)
3. **Try simple feature** (skip architecture/docs)
4. **Try complex feature** (use all agents)
5. **Configure project** (create CLAUDE.md)

## 📄 Files Summary

| File | Size | Purpose |
|------|------|---------|
| WORKFLOW.md | 13KB | **Complete guide - start here** |
| requirements-analyst.md | 7.4KB | Requirements analysis |
| architecture-designer.md | 17KB | System design |
| implementation-engineer.md | 14KB | TDD implementation |
| qa-engineer.md | 15KB | Quality verification |
| documentation-specialist.md | 13KB | User documentation |
| git-coordinator.md | 17KB | Git operations |

**Total**: 95KB of production-ready agents

---

**Status**: ✅ Production Ready  
**License**: Use freely in your projects  
**Version**: Complete Workflow v1.0
