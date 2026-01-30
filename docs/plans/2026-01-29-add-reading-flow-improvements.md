# Unified Quick Add Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the "Quick Add" flow (Scan-first choice screen) is the primary entry point for all meter registration and reading entry tasks, especially for new users.

**Architecture:** 
1. **Unify Entry Points**: Redirect Dashboard and Meters page empty states to `/add-reading` instead of `/meters/add`.
2. **Refactor UI**: Extract the choice screen into a reusable component (or just keep it clean in `AddReading.tsx`) to ensure consistency.
3. **Streamline Flow**: Confirm that scanning a new meter automatically creates it and proceeds to the reading form.

**Tech Stack:** Solid.js, Tailwind CSS, DaisyUI.

---

### Task 1: Redirect Dashboard Empty State

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Update "Getting Started" card link**

```tsx
// src/pages/Dashboard.tsx
// Old: <A href="/meters/add" class="btn btn-primary btn-wide rounded-2xl shadow-xl shadow-primary/20">Add Meter</A>
// New:
<A href="/add-reading" class="btn btn-primary btn-wide rounded-2xl shadow-xl shadow-primary/20 font-black">
  Get Started
</A>
```

**Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: redirect dashboard empty state to unified quick add flow"
```

---

### Task 2: Redirect Meters Page Empty State

**Files:**
- Modify: `src/pages/Meters.tsx`

**Step 1: Update "No meters found" fallback link**

```tsx
// src/pages/Meters.tsx
// Old: <A href="/meters/add" class="btn btn-primary btn-wide rounded-2xl shadow-xl shadow-primary/20">Add Meter</A>
// New:
<A href="/add-reading" class="btn btn-primary btn-wide rounded-2xl shadow-xl shadow-primary/20 font-black">
  Add Your First Meter
</A>
```

**Step 2: Commit**

```bash
git add src/pages/Meters.tsx
git commit -m "feat: redirect meters list empty state to unified quick add flow"
```

---

### Task 3: Refine Choice Screen UI

**Files:**
- Modify: `src/pages/AddReading.tsx`

**Step 1: Update Choice Screen icon and labels**

Ensure the choice screen looks like a welcoming "New Data" screen rather than just a "Add Reading" screen.

```tsx
// src/pages/AddReading.tsx
// Change the icon from a plus to something more general or scan-oriented
<div class="bg-primary/10 p-6 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto text-primary">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
</div>
```

**Step 2: Commit**

```bash
git add src/pages/AddReading.tsx
git commit -m "style: refine choice screen icon for better UX context"
```

---

### Task 4: Verify and Release

**Step 1: Run Lint**

```bash
npm run lint
```

**Step 2: Run Tests**

```bash
npm run test
```

**Step 3: Release**

```bash
npm run release:patch
```