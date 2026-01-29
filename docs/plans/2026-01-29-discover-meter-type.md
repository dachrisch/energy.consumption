# Discover Meter Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the OCR scanning process to reliably discover and display the meter type (power or gas) from the scanned image.

**Architecture:** 
1. **Robust Prompting**: Update the Gemini OCR prompt to provide clearer instructions for type identification.
2. **Type-Aware Response**: Include the discovered meter type in the API response.
3. **UI Feedback**: Show the discovered type in the "Meter Matched" toast notification on the frontend.
4. **Enhanced Auto-Creation**: Ensure newly created meters from OCR scans have the correct type and matching default unit.

**Tech Stack:** Solid.js, Node.js, Gemini API.

---

### Task 1: Enhance Gemini OCR Prompt

**Files:**
- Modify: `src/lib/geminiOcrv2.ts`

**Step 1: Update the prompt for better accuracy**

```typescript
// src/lib/geminiOcrv2.ts
// Update the prompt text to be more explicit about visual cues
const prompt = "Read the exact numeric value on the meter display AND the meter serial number. " +
               "Identify if it is a power meter (usually has 'kWh', 'CL', or digital LCD) or a gas meter (usually has 'm³', 'cubic feet', or analog dials). " +
               "Return your response in JSON format: { "value": number, "meter_number": "string", "type": "power"|"gas", "unit": "kWh"|"m³" }";
```

**Step 2: Commit**

```bash
git add src/lib/geminiOcrv2.ts
git commit -m "feat: enhance Gemini prompt for better meter type discovery"
```

---

### Task 2: Surface Discovered Type in API

**Files:**
- Modify: `src/api/handler.ts`

**Step 1: Include type in the scan response**

```typescript
// src/api/handler.ts in handleOcrScan
res.end(JSON.stringify({
  value: result.value,
  meterId: meter._id,
  meterName: meter.name,
  unit: meter.unit,
  type: meter.type // Add this
}));
```

**Step 2: Commit**

```bash
git add src/api/handler.ts
git commit -m "feat: include discovered meter type in OCR scan API response"
```

---

### Task 3: Display Discovered Type in Frontend

**Files:**
- Modify: `src/pages/AddReading.tsx`

**Step 1: Update toast notification to include type**

```typescript
// src/pages/AddReading.tsx in handleScan
const result = await res.json();
// ...
const typeLabel = result.type === 'power' ? '⚡ Power' : '🔥 Gas';
toast.showToast(`Matched to ${typeLabel} meter: ${result.meterName}`, 'info');
```

**Step 2: Commit**

```bash
git add src/pages/AddReading.tsx
git commit -m "feat: display discovered meter type in scan results"
```

---

### Task 4: Verify and Release

**Step 1: Run tests**

```bash
npm run test
```

**Step 2: Trigger Release**

```bash
npm run release:patch
```
