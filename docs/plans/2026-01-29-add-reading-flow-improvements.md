# Add Reading Flow Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Streamline meter management and handle OCR scanning conflicts gracefully in the "Add Reading" page.

**Architecture:** 
1. **Dropdown Extension**: Add a special sentinel value to the meter select dropdown that triggers navigation to the "Add Meter" page.
2. **Conflict State Management**: Introduce a `pendingScan` signal to hold OCR results when a mismatch is detected between the selected meter and the photo.
3. **Interactive Resolution UI**: Display a clear choice area (within the form) when a mismatch occurs, offering the user explicit actions.

**Tech Stack:** Solid.js, DaisyUI.

---

### Task 1: Add "Register New Meter" to Dropdown

**Files:**
- Modify: `src/pages/AddReading.tsx`

**Step 1: Update the select element**

```tsx
// src/pages/AddReading.tsx
// Update the <select> onChange and options
<select
  class="..."
  value={selectedMeterId()}
  onChange={(e) => {
    if (e.currentTarget.value === 'NEW_METER') {
      navigate('/meters/add');
    } else {
      setSelectedMeterId(e.currentTarget.value);
    }
  }}
  required
>
  <option value="" disabled>Choose a meter...</option>
  <For each={meters()}>
    {(meter) => (
      <option value={meter._id}>
        {meter.name} ({meter.meterNumber})
      </option>
    )}
  </For>
  <option value="NEW_METER" class="text-primary font-bold">+ Register New Meter...</option>
</select>
```

**Step 2: Commit**

```bash
git add src/pages/AddReading.tsx
git commit -m "feat: add 'Register New Meter' option to reading selection dropdown"
```

---

### Task 2: Implement OCR Mismatch Flow

**Files:**
- Modify: `src/pages/AddReading.tsx`

**Step 1: Add state and update handleScan**

```tsx
const [pendingScan, setPendingScan] = createSignal<null | { value: number, meterId: string, meterName: string, type: string }>(null);

// Inside handleScan, after receiving result:
const result = await res.json();
const currentId = selectedMeterId();

if (currentId && result.meterId && result.meterId !== currentId) {
  // Mismatch detected - ask user
  setPendingScan(result);
  toast.showToast('Photo matches a different meter', 'warning');
} else {
  // Normal flow: auto-apply
  setValue(result.value.toString());
  if (result.meterId) {
    setSelectedMeterId(result.meterId);
    refetch();
  }
  toast.showToast('Reading detected!', 'success');
}
```

**Step 2: Create resolution component/JSX**

Display a warning box if `pendingScan()` is truthy, with two buttons:
- "Switch to Detected Meter" (sets `selectedMeterId(pendingScan().meterId)`, applies value, clears pending)
- "Use Value for Current Meter" (applies value only, clears pending)

**Step 3: Commit**

```bash
git add src/pages/AddReading.tsx
git commit -m "feat: implement OCR mismatch resolution flow"
```

---

### Task 3: Verify and Release

**Step 1: Run tests**

```bash
npm run test
```

**Step 2: Trigger Release**

```bash
npm run release:patch
```
