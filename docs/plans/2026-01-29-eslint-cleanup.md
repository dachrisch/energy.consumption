# ESLint Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ignore tests in ESLint and resolve remaining warnings (complexity, function length, and `any` types).

**Architecture:** 
1. **Config Hardening**: Use `.eslintignore` to skip tests and generated files.
2. **Type Hardening**: Replace `any` with centralized interfaces from `src/types/models.ts`.
3. **Refactoring**: Break down oversized functions in components and pages into smaller, cohesive units.

**Tech Stack:** ESLint, TypeScript, Solid.js.

---

### Task 1: Resolve Type Warnings in Libs

**Files:**
- Modify: `src/lib/aggregates.ts`
- Modify: `src/lib/gapDetection.ts`
- Modify: `src/lib/mongodb.ts`
- Modify: `src/lib/projectionUtils.ts`
- Modify: `src/lib/readingService.ts`

**Step 1: Update `src/lib/aggregates.ts` to use interfaces**

```typescript
import { IMeter, IReading, IContract } from '../types/models';
// Replace any[] with IMeter[], IReading[], IContract[]
```

**Step 2: Update `src/lib/gapDetection.ts`**

```typescript
import { IContract } from '../types/models';
// Replace any with IContract
```

**Step 3: Update `src/lib/mongodb.ts`**

```typescript
// Replace global any with Mongoose connection types if possible, or leave as is if trivial.
```

**Step 4: Update `src/lib/projectionUtils.ts`**

```typescript
import { IContract, IReading } from '../types/models';
```

**Step 5: Update `src/lib/readingService.ts`**

```typescript
import { IReading, IMeter } from '../types/models';
```

**Step 6: Commit**

```bash
git add src/lib/
git commit -m "chore: resolve no-explicit-any warnings in library files"
```

---

### Task 2: Resolve Function Length in Components

**Files:**
- Modify: `src/components/ConsumptionChart.tsx`
- Modify: `src/components/CsvImportModal.tsx`
- Modify: `src/context/ToastContext.tsx`

**Step 1: Refactor `ConsumptionChart.tsx`**
Split data transformation logic from the main component.

**Step 2: Refactor `CsvImportModal.tsx`**
Extract sub-renderers for each step (upload, mapping, preview).

**Step 3: Refactor `ToastContext.tsx`**
Split the toast manager logic from the provider.

**Step 4: Commit**

```bash
git add src/components/ src/context/
git commit -m "refactor: reduce function length in components and context"
```

---

### Task 3: Resolve Function Length in Pages

**Files:**
- Modify: `src/pages/AddReading.tsx`
- Modify: `src/pages/Meters.tsx`
- Modify: `src/pages/MeterDetail.tsx`
- Modify: `src/pages/Contracts.tsx`
- Modify: `src/pages/Profile.tsx`

**Step 1: Refactor `AddReading.tsx`**
Extract scanning logic and conflict resolution UI into helper components/functions.

**Step 2: Refactor `Meters.tsx`**
Extract meter grid and individual meter card into separate components.

**Step 3: Refactor `MeterDetail.tsx`**
Extract chart configuration and reading list into sub-components.

**Step 4: Refactor `Contracts.tsx` and `Profile.tsx`**
Break down large JSX blocks.

**Step 5: Commit**

```bash
git add src/pages/
git commit -m "refactor: resolve function length warnings in pages"
```

---

### Task 4: Final Verification

**Step 1: Run Lint**

```bash
npm run lint
```
Expected: 0 errors, minimal warnings (ideally 0).

**Step 2: Run Tests**

```bash
npm run test
```

**Step 3: Release**

```bash
npm run release:patch
```
```
