# Add Reading Convenience Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve user convenience by auto-selecting matched meters and streamlining the flow between meter registration and reading entry.

**Architecture:** 
1. **Auto-Selection**: Update `processScanResult` to automatically switch to an existing detected meter, removing the manual "Switch" requirement for known assets.
2. **Dynamic Redirection**: Update `AddMeter` to support a `redirect` query parameter. If set, redirect to the reading entry form for the newly created meter.
3. **Linkage**: Update `AddReading` to pass the redirect context when navigating to the registration page.

**Tech Stack:** Solid.js, `@solidjs/router`.

---

### Task 1: Auto-Select Matched Meter

**Files:**
- Modify: `src/pages/AddReading.tsx`

**Step 1: Update `processScanResult`**

Remove the mismatch warning if `result.meterId` exists (meaning it matches an existing meter in the database).

```typescript
// src/pages/AddReading.tsx
  const processScanResult = (result: ScanResult) => {
    const currentId = selectedMeterId();
    setShowForm(true);
    
    // AUTO-SELECT: If we found an existing meter, just use it.
    // Only show mismatch resolution if the result does NOT have a meterId (rare) 
    // or if we want to be absolutely strict. 
    // User requested: "if the scan returns an available meter, just select it instead of warning"
    if (result.meterId) {
      setSelectedMeterId(result.meterId);
      refetch();
      setValue(result.value.toString());
      const typeLabel = result.type === 'power' ? '⚡ Power' : '🔥 Gas';
      toast.showToast(`Matched to ${typeLabel} meter: ${result.meterName}`, 'info');
      toast.showToast('Reading detected!', 'success');
      return;
    }

    // Fallback for cases where no meterId is returned (shouldn't happen with current backend)
    setValue(result.value.toString());
    toast.showToast('Reading detected!', 'success');
  };
```

**Step 2: Commit**

```bash
git add src/pages/AddReading.tsx
git commit -m "feat: auto-select existing meter on scan without mismatch warning"
```

---

### Task 2: Add Meter Redirection

**Files:**
- Modify: `src/pages/AddMeter.tsx`
- Modify: `src/pages/AddReading.tsx`

**Step 1: Update AddMeter.tsx to handle redirect parameter**

```typescript
// src/pages/AddMeter.tsx
// Use useSearchParams
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';

const [searchParams] = useSearchParams();

// Inside handleSubmit successful response:
const data = await res.json();
if (res.ok) {
  toast.showToast(`Meter ${isEdit() ? 'updated' : 'saved'} successfully`, 'success');
  if (searchParams.redirect === 'add-reading') {
    navigate(`/meters/${data._id}/add-reading`);
  } else {
    navigate('/meters');
  }
}
```

**Step 2: Update AddReading.tsx to pass the redirect param**

```tsx
// src/pages/AddReading.tsx
// Update both navigations to /meters/add
navigate('/meters/add?redirect=add-reading');
```

**Step 3: Commit**

```bash
git add src/pages/AddMeter.tsx src/pages/AddReading.tsx
git commit -m "feat: redirect back to reading entry after registering new meter"
```

---

### Task 3: Verify and Release

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
