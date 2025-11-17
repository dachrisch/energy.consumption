# Architecture Design: Phase 2 Frontend Adapter Layer

## Executive Summary

This document outlines the design for Phase 2 of the backend-first migration: creating a **Frontend Adapter Layer** that enables gradual, risk-free migration of frontend components from the old backend (direct Mongoose models) to the new backend (Services + Repositories + Events).

**Key Design Principles:**
1. **Zero Breaking Changes** - Components work with both old and new backends
2. **Feature Flag Control** - Per-component flags enable/disable new backend
3. **Instant Rollback** - Toggle flag to revert without code deployment
4. **Gradual Migration** - Migrate one component at a time, validate, then proceed
5. **Backward Compatibility** - New backend returns data in exact same format as old

**Timeline:** 2-3 weeks
**Risk:** Very Low
**User Impact:** Minimal (transparent transition)

---

## 1. Architecture Overview

### Current State (Phase 1 Complete)

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND COMPONENTS                        │
│  Dashboard, Charts, Timeline, CSV Import, Forms              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 CURRENT DATA FLOW (OLD)                      │
│                                                               │
│  useEnergyData() → GET /api/energy → Energy.find()          │
│  addEnergyAction() → Energy.create() → MongoDB               │
│  importCSVAction() → Energy.create() (loop) → MongoDB        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│           NEW BACKEND (BUILT BUT NOT CONNECTED)               │
│                                                               │
│  Services → Repositories → SourceEnergyReading + Display     │
│  Events → Handlers → Automatic cache invalidation            │
│  731 tests, 98-100% coverage, READY TO USE                   │
└──────────────────────────────────────────────────────────────┘
```

### Target State (Phase 2 Complete)

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND COMPONENTS                        │
│  Dashboard, Charts, Timeline, CSV Import, Forms              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              ADAPTER LAYER (NEW IN PHASE 2)                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Feature Flag Router (per-component decision)        │   │
│  │  - Checks global flag: NEW_BACKEND_ENABLED           │   │
│  │  - Checks component flag: <COMPONENT>_NEW_BACKEND    │   │
│  │  - Checks rollout percentage (0-100%)                │   │
│  └────────────┬─────────────────────────┬─────────────────┘  │
└───────────────┼─────────────────────────┼────────────────────┘
                │ (if flag OFF)           │ (if flag ON)
                │                         │
    ┌───────────▼──────────┐   ┌──────────▼──────────┐
    │   OLD BACKEND        │   │   NEW BACKEND       │
    │                      │   │                     │
    │ Server Actions       │   │ Services Layer      │
    │ Direct Mongoose      │   │ Repositories        │
    │ Energy.find()        │   │ Event Bus           │
    │ On-demand calc       │   │ Display Collection  │
    └──────────┬───────────┘   └──────────┬──────────┘
               │                          │
    ┌──────────▼──────────────────────────▼──────────┐
    │        MongoDB (SAME DATABASE)                  │
    │  Energy Collection  +  SourceEnergyReading      │
    │                        +  DisplayEnergyData     │
    └─────────────────────────────────────────────────┘
```

**Key Insight:** Both backends write to the **same MongoDB database**, just through different code paths. This enables seamless transition without data migration.

---

## 2. Adapter Layer Design

### 2.1 Core Adapter Hooks

#### Hook 1: `useEnergyService` (Replaces `useEnergyData`)

**Purpose:** Unified hook that routes to old or new backend based on feature flags.

**Location:** `src/app/hooks/useEnergyService.ts`

**Interface (Backward Compatible):**
```typescript
interface UseEnergyServiceOptions {
  component?: string;        // Component name for flag check
  forceOld?: boolean;        // Override flag (testing)
  forceNew?: boolean;        // Override flag (testing)
}

interface UseEnergyServiceResult {
  data: EnergyType[];        // Same as old useEnergyData
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEnergyService(
  options?: UseEnergyServiceOptions
): UseEnergyServiceResult;
```

**Implementation Strategy:**
```typescript
// src/app/hooks/useEnergyService.ts

import { useState, useCallback, useEffect } from 'react';
import { useEnergyData as useEnergyDataOld } from './useEnergyData';
import { useDisplayData } from './useDisplayData';
import { checkBackendFlag } from '@/lib/featureFlags';
import { EnergyType } from '@/app/types';

export function useEnergyService(
  options: UseEnergyServiceOptions = {}
): UseEnergyServiceResult {
  const { component, forceOld = false, forceNew = false } = options;
  const [useNewBackend, setUseNewBackend] = useState(false);
  const [flagChecked, setFlagChecked] = useState(false);

  // Check feature flags on mount
  useEffect(() => {
    async function checkFlags() {
      // Force flags for testing
      if (forceOld) {
        setUseNewBackend(false);
        setFlagChecked(true);
        return;
      }
      if (forceNew) {
        setUseNewBackend(true);
        setFlagChecked(true);
        return;
      }

      // Check real feature flags
      const shouldUseNew = await checkBackendFlag(component);
      setUseNewBackend(shouldUseNew);
      setFlagChecked(true);
    }

    checkFlags();
  }, [component, forceOld, forceNew]);

  // Use old hook (existing implementation)
  const oldHook = useEnergyDataOld();

  // Use new hook (display data cache)
  const newHook = useDisplayData({ enabled: useNewBackend && flagChecked });

  // Return appropriate hook result
  // During flag check, return loading state
  if (!flagChecked) {
    return {
      data: [],
      isLoading: true,
      error: null,
      refetch: async () => {},
    };
  }

  return useNewBackend ? newHook : oldHook;
}
```

**Usage in Components:**
```typescript
// BEFORE (old)
import { useEnergyData } from '@/app/hooks/useEnergyData';

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useEnergyData();
  // ... rest of component
}

// AFTER (with adapter)
import { useEnergyService } from '@/app/hooks/useEnergyService';

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useEnergyService({
    component: 'dashboard'
  });
  // ... rest of component UNCHANGED
}
```

---

#### Hook 2: `useDisplayData` (NEW - Display Data Cache Access)

**Purpose:** Fetch pre-calculated display data from DisplayEnergyData collection.

**Location:** `src/app/hooks/useDisplayData.ts`

**Interface:**
```typescript
interface UseDisplayDataOptions {
  enabled?: boolean;         // Enable/disable hook (for flag control)
  type?: 'power' | 'gas';   // Filter by energy type (optional)
}

interface UseDisplayDataResult {
  data: EnergyType[];        // Transformed to match old format
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDisplayData(
  options?: UseDisplayDataOptions
): UseDisplayDataResult;
```

**Implementation:**
```typescript
// src/app/hooks/useDisplayData.ts

import { useState, useCallback, useEffect } from 'react';
import { EnergyType } from '@/app/types';

export function useDisplayData(
  options: UseDisplayDataOptions = {}
): UseDisplayDataResult {
  const { enabled = true, type } = options;
  const [data, setData] = useState<EnergyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call new API route that uses display data cache
      const params = new URLSearchParams();
      if (type) params.set('type', type);

      const response = await fetch(`/api/v2/display/table?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch display data');
      }

      const jsonData = await response.json();

      // Transform display data to EnergyType[] format
      const parsedData = jsonData.map((item: any) => ({
        ...item,
        date: new Date(item.date),
      }));

      setData(parsedData);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to load display data';
      setError(errorMessage);
      console.error('Error fetching display data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
```

---

#### Hook 3: `useMonthlyDisplayData` (NEW - Monthly Chart Data)

**Purpose:** Fetch pre-calculated monthly chart data (for MonthlyMeterReadingsChart).

**Location:** `src/app/hooks/useMonthlyDisplayData.ts`

**Interface:**
```typescript
interface UseMonthlyDisplayDataOptions {
  type: 'power' | 'gas';
  year: number;
  enabled?: boolean;
}

interface UseMonthlyDisplayDataResult {
  data: MonthlyChartData | null;  // Pre-calculated monthly data
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Implementation:**
```typescript
// src/app/hooks/useMonthlyDisplayData.ts

import { useState, useCallback, useEffect } from 'react';
import { MonthlyChartData } from '@/app/types';

export function useMonthlyDisplayData(
  options: UseMonthlyDisplayDataOptions
): UseMonthlyDisplayDataResult {
  const { type, year, enabled = true } = options;
  const [data, setData] = useState<MonthlyChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v2/display/monthly?type=${type}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch monthly chart data');
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to load monthly data';
      setError(errorMessage);
      console.error('Error fetching monthly data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, type, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
```

---

### 2.2 Adapter Functions (Data Format Converters)

**Purpose:** Ensure new backend returns data in exact same format as old backend.

**Location:** `src/app/adapters/DisplayDataAdapter.ts`

```typescript
// src/app/adapters/DisplayDataAdapter.ts

import { EnergyType, MonthlyChartData } from '@/app/types';
import { IDisplayEnergyData } from '@/models/DisplayEnergyData';

export class DisplayDataAdapter {
  /**
   * Transform DisplayEnergyData (new format) to EnergyType[] (old format)
   * Ensures frontend components see identical data structure
   */
  static toEnergyTypeArray(
    displayData: IDisplayEnergyData,
    userId: string
  ): EnergyType[] {
    if (displayData.dataType !== 'table-data') {
      throw new Error('Expected table-data display type');
    }

    // DisplayEnergyData stores pre-calculated table data
    // Transform to flat array of readings
    return displayData.data.readings.map((reading: any) => ({
      _id: reading._id,
      userId,
      type: reading.type,
      date: new Date(reading.date),
      amount: reading.amount,
      createdAt: new Date(reading.createdAt),
      updatedAt: new Date(reading.updatedAt),
    }));
  }

  /**
   * Transform monthly display data to MonthlyChartData format
   */
  static toMonthlyChartData(
    displayData: IDisplayEnergyData
  ): MonthlyChartData {
    if (displayData.dataType !== 'monthly-chart-power' &&
        displayData.dataType !== 'monthly-chart-gas') {
      throw new Error('Expected monthly-chart display type');
    }

    return displayData.data as MonthlyChartData;
  }

  /**
   * Validate data structure matches expected format
   */
  static validateEnergyTypeArray(data: any[]): data is EnergyType[] {
    if (!Array.isArray(data)) return false;

    return data.every(item =>
      typeof item._id === 'string' &&
      typeof item.userId === 'string' &&
      (item.type === 'power' || item.type === 'gas') &&
      item.date instanceof Date &&
      typeof item.amount === 'number' &&
      item.createdAt instanceof Date &&
      item.updatedAt instanceof Date
    );
  }
}
```

---

## 3. Feature Flag System

### 3.1 Enhanced Feature Flag Model

**Current Model** (existing in codebase):
```typescript
// src/models/FeatureFlag.ts (CURRENT - SIMPLE)
export type FeatureFlagDocument = {
  _id: string;
  name: string;
  enabled: boolean;      // Simple on/off
  createdAt: Date;
  updatedAt: Date;
};
```

**Enhanced Model** (needed for Phase 2):
```typescript
// src/models/FeatureFlag.ts (ENHANCED)

import mongoose, { Schema, model } from 'mongoose';

export type FeatureFlagDocument = {
  _id: string;
  name: string;
  enabled: boolean;                 // Global enable/disable
  rolloutPercent: number;           // 0-100 (percentage of users)
  componentScope?: string;          // Component name (e.g., 'dashboard')
  userWhitelist?: string[];         // Specific user IDs to enable
  userBlacklist?: string[];         // Specific user IDs to disable
  metadata?: {
    description?: string;           // What this flag controls
    owner?: string;                 // Who owns this flag
    expiresAt?: Date;              // Auto-disable after date
  };
  createdAt: Date;
  updatedAt: Date;
};

const FeatureFlagSchema = new Schema<FeatureFlagDocument>(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Feature flag name is required'],
    },
    enabled: {
      type: Boolean,
      default: false,               // Default OFF for safety
      required: true,
    },
    rolloutPercent: {
      type: Number,
      default: 0,                   // Default 0% rollout
      min: 0,
      max: 100,
    },
    componentScope: {
      type: String,
      index: true,
    },
    userWhitelist: {
      type: [String],
      default: [],
    },
    userBlacklist: {
      type: [String],
      default: [],
    },
    metadata: {
      description: String,
      owner: String,
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient flag lookups
FeatureFlagSchema.index({ name: 1, enabled: 1 });
FeatureFlagSchema.index({ componentScope: 1 });

const FeatureFlag = mongoose.models?.FeatureFlag ||
  model<FeatureFlagDocument>('FeatureFlag', FeatureFlagSchema);

export default FeatureFlag;
```

---

### 3.2 Feature Flag Configuration

**Flag Naming Convention:**
```typescript
// src/lib/featureFlags.ts

export const FEATURE_FLAGS = {
  // Global master switch
  NEW_BACKEND_ENABLED: 'new_backend_enabled',

  // Per-component flags
  DASHBOARD_NEW_BACKEND: 'dashboard_new_backend',
  ENERGY_TABLE_NEW_BACKEND: 'energy_table_new_backend',
  TIMELINE_SLIDER_NEW_BACKEND: 'timeline_slider_new_backend',
  MONTHLY_CHARTS_NEW_BACKEND: 'monthly_charts_new_backend',
  CSV_IMPORT_NEW_BACKEND: 'csv_import_new_backend',
  ENERGY_FORMS_NEW_BACKEND: 'energy_forms_new_backend',
} as const;

export type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
```

**Initial Flag Setup (MongoDB):**
```json
[
  {
    "name": "new_backend_enabled",
    "enabled": false,
    "rolloutPercent": 0,
    "metadata": {
      "description": "Global master switch for new backend (repository + services + events)",
      "owner": "architecture-team"
    }
  },
  {
    "name": "dashboard_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "dashboard",
    "metadata": {
      "description": "Enable new backend for Dashboard component (summary cards)"
    }
  },
  {
    "name": "energy_table_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "energy_table",
    "metadata": {
      "description": "Enable new backend for Energy Table component"
    }
  },
  {
    "name": "timeline_slider_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "timeline_slider",
    "metadata": {
      "description": "Enable new backend for Timeline Slider histogram"
    }
  },
  {
    "name": "monthly_charts_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "monthly_charts",
    "metadata": {
      "description": "Enable new backend for Monthly Charts component"
    }
  },
  {
    "name": "csv_import_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "csv_import",
    "metadata": {
      "description": "Enable new backend for CSV import (bulk operations)"
    }
  },
  {
    "name": "energy_forms_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "energy_forms",
    "metadata": {
      "description": "Enable new backend for Add/Edit energy forms"
    }
  }
]
```

---

### 3.3 Feature Flag Evaluation Logic

**Enhanced Flag Checking Function:**

```typescript
// src/lib/featureFlags.ts (ENHANCED)

'use server';

import { connectDB } from './mongodb';
import FeatureFlag from '@/models/FeatureFlag';
import { getServerSession } from 'next-auth';
import { createHash } from 'crypto';

export interface FeatureFlagContext {
  userId?: string;
  component?: string;
}

/**
 * Check if new backend should be used for given context
 *
 * Decision flow:
 * 1. Check global master switch (new_backend_enabled)
 * 2. Check component-specific flag (if component provided)
 * 3. Check user whitelist/blacklist
 * 4. Check percentage rollout (deterministic based on userId hash)
 */
export async function checkBackendFlag(
  component?: string,
  userId?: string
): Promise<boolean> {
  await connectDB();

  // Get userId from session if not provided
  if (!userId) {
    const session = await getServerSession();
    userId = session?.user?.id;
  }

  // 1. Check global master switch
  const globalFlag = await FeatureFlag.findOne({
    name: FEATURE_FLAGS.NEW_BACKEND_ENABLED
  });

  if (!globalFlag || !globalFlag.enabled) {
    return false; // Global switch OFF - use old backend
  }

  // 2. Check component-specific flag (if component provided)
  if (component) {
    const componentFlagName = `${component}_new_backend`;
    const componentFlag = await FeatureFlag.findOne({
      name: componentFlagName
    });

    if (!componentFlag || !componentFlag.enabled) {
      return false; // Component flag OFF - use old backend
    }

    // 3. Check user whitelist (always enable)
    if (userId && componentFlag.userWhitelist?.includes(userId)) {
      return true; // User in whitelist - use new backend
    }

    // 4. Check user blacklist (always disable)
    if (userId && componentFlag.userBlacklist?.includes(userId)) {
      return false; // User in blacklist - use old backend
    }

    // 5. Check percentage rollout (deterministic)
    if (userId && componentFlag.rolloutPercent < 100) {
      const userPercentile = getUserPercentile(userId);
      return userPercentile < componentFlag.rolloutPercent;
    }

    // 6. Full rollout (100%)
    return componentFlag.rolloutPercent === 100;
  }

  // No component specified - use global flag only
  return globalFlag.enabled;
}

/**
 * Calculate deterministic percentile (0-99) for user
 * Same user always gets same percentile
 */
function getUserPercentile(userId: string): number {
  const hash = createHash('sha256').update(userId).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 100;
}

/**
 * Update feature flag (for admin operations)
 */
export async function updateFeatureFlag(
  name: string,
  updates: Partial<FeatureFlagDocument>
): Promise<void> {
  await connectDB();
  await FeatureFlag.updateOne({ name }, { $set: updates });
}

/**
 * Get all feature flags (for admin dashboard)
 */
export async function getAllFeatureFlags(): Promise<FeatureFlagDocument[]> {
  await connectDB();
  return FeatureFlag.find({}).sort({ name: 1 }).lean();
}
```

**Usage Example:**
```typescript
// In adapter hook
const shouldUseNew = await checkBackendFlag('dashboard', userId);

// In server action
const useNewBackend = await checkBackendFlag('csv_import');
```

---

### 3.4 Gradual Rollout Strategy

**Week 1: Internal Testing (Whitelist)**
```json
{
  "name": "dashboard_new_backend",
  "enabled": true,
  "rolloutPercent": 0,
  "userWhitelist": ["admin-user-id", "test-user-id"]
}
```

**Week 2: 10% Rollout**
```json
{
  "name": "dashboard_new_backend",
  "enabled": true,
  "rolloutPercent": 10,
  "userWhitelist": []
}
```

**Week 3: 50% Rollout**
```json
{
  "name": "dashboard_new_backend",
  "enabled": true,
  "rolloutPercent": 50
}
```

**Week 4: 100% Rollout**
```json
{
  "name": "dashboard_new_backend",
  "enabled": true,
  "rolloutPercent": 100
}
```

---

## 4. Data Flow Scenarios

### 4.1 Scenario 1: Fetch Energy Data (Dashboard)

**OLD BACKEND (Flag OFF):**
```
Component: Dashboard
  └─> useEnergyService({ component: 'dashboard' })
      └─> checkBackendFlag('dashboard') → FALSE
          └─> useEnergyDataOld() (existing hook)
              └─> GET /api/energy
                  └─> Energy.find({ userId })
                      └─> Return raw readings from Energy collection
                          └─> Component renders (on-demand calculation)
```

**NEW BACKEND (Flag ON):**
```
Component: Dashboard
  └─> useEnergyService({ component: 'dashboard' })
      └─> checkBackendFlag('dashboard') → TRUE
          └─> useDisplayData({ enabled: true })
              └─> GET /api/v2/display/table?type=power
                  └─> DisplayDataCalculationService.getTableData()
                      ├─> Check cache (DisplayEnergyData collection)
                      │   └─> HIT: Return cached data (fast!)
                      │
                      └─> MISS: Calculate → Cache → Return
                          └─> Component renders (pre-calculated data)
```

---

### 4.2 Scenario 2: Create Energy Reading (Add Form)

**OLD BACKEND (Flag OFF):**
```
Component: AddEnergyForm
  └─> handleSubmit()
      └─> checkBackendFlag('energy_forms') → FALSE
          └─> addEnergyAction(data) (existing)
              └─> Energy.create(data)
                  └─> MongoDB: Energy collection
                      └─> Success
                          └─> Component: refetch data
```

**NEW BACKEND (Flag ON):**
```
Component: AddEnergyForm
  └─> handleSubmit()
      └─> checkBackendFlag('energy_forms') → TRUE
          └─> addEnergyActionV2(data) (new)
              └─> EnergyCrudService.create(data)
                  ├─> MongoEnergyRepository.create()
                  │   └─> SourceEnergyReading.create()
                  │       └─> MongoDB: SourceEnergyReading collection
                  │
                  └─> EventBus.emit(ENERGY_READING_CREATED)
                      └─> DisplayDataEventHandler
                          └─> DisplayDataRepository.invalidate()
                              └─> DELETE cached display data
                                  └─> Next request: recalculate fresh
```

---

### 4.3 Scenario 3: Bulk CSV Import

**OLD BACKEND (Flag OFF):**
```
Component: CSVFileUpload
  └─> handleImport(csvData)
      └─> checkBackendFlag('csv_import') → FALSE
          └─> importCSVAction(csvData) (existing)
              └─> Loop: for each row
                  └─> addEnergyAction(row)
                      └─> Energy.create(row)
                          └─> MongoDB (N individual writes)
                              └─> Success: { success: N, skipped: 0, error: 0 }
```

**NEW BACKEND (Flag ON):**
```
Component: CSVFileUpload
  └─> handleImport(csvData)
      └─> checkBackendFlag('csv_import') → TRUE
          └─> importCSVActionV2(csvData) (new)
              └─> EnergyCrudService.createMany(csvData)
                  ├─> MongoEnergyRepository.bulkCreate()
                  │   └─> SourceEnergyReading.insertMany()
                  │       └─> MongoDB (single bulk write - FAST!)
                  │
                  └─> EventBus.emit(ENERGY_READINGS_BULK_IMPORTED)
                      └─> BulkImportHandler (optimized)
                          └─> Batch invalidation by year
                              └─> Efficient cache cleanup
```

---

### 4.4 Scenario 4: Monthly Chart Data

**OLD BACKEND (Flag OFF):**
```
Component: MonthlyMeterReadingsChart
  └─> useMonthlyChartData(type, year)
      └─> checkBackendFlag('monthly_charts') → FALSE
          └─> useEnergyDataOld()
              └─> GET /api/energy
                  └─> Energy.find({ userId, type })
                      └─> Return ALL readings
                          └─> Component: useMemo(() =>
                              MonthlyDataAggregationService.calculate(readings, year)
                              ) ← CALCULATION ON EVERY RENDER
```

**NEW BACKEND (Flag ON):**
```
Component: MonthlyMeterReadingsChart
  └─> useMonthlyDisplayData({ type, year })
      └─> checkBackendFlag('monthly_charts') → TRUE
          └─> GET /api/v2/display/monthly?type=power&year=2024
              └─> DisplayDataCalculationService.getMonthlyChartData()
                  ├─> Check cache
                  │   └─> HIT: Return pre-calculated data (< 5ms!)
                  │
                  └─> MISS: Calculate once → Store → Return
                      └─> Component: render immediately (NO useMemo needed)
```

---

## 5. Component Migration Order

### Phase 2A: Low Risk Components (Week 1)

#### Component 1: Dashboard Summary Cards

**Risk:** Low
**Complexity:** Low
**User Impact:** Low
**Duration:** 4-6 hours

**Current Implementation:**
```typescript
// src/app/dashboard/page.tsx

import { useEnergyData } from '@/app/hooks/useEnergyData';

export default function Dashboard() {
  const { data, isLoading } = useEnergyData();
  // Calculate totals on-demand
}
```

**Migrated Implementation:**
```typescript
// src/app/dashboard/page.tsx

import { useEnergyService } from '@/app/hooks/useEnergyService';

export default function Dashboard() {
  const { data, isLoading } = useEnergyService({
    component: 'dashboard'
  });
  // Same calculation, but data might be cached
}
```

**Migration Steps:**
1. ✅ Replace `useEnergyData` with `useEnergyService`
2. ✅ Deploy with flag OFF
3. ✅ Test manually (should work identically)
4. ✅ Enable flag in dev (test with new backend)
5. ✅ Gradual rollout: 0% → 10% → 50% → 100%
6. ✅ Monitor for 1 week at 100%
7. ✅ Remove flag code (make permanent)

**Rollback:** Toggle `dashboard_new_backend` to `false`

---

#### Component 2: Energy Table

**Risk:** Medium
**Complexity:** Medium
**User Impact:** High (most-used feature)
**Duration:** 6-8 hours

**Current Implementation:**
```typescript
// src/app/components/energy/EnergyTable.tsx

import { useEnergyData } from '@/app/hooks/useEnergyData';

export default function EnergyTable() {
  const { data, isLoading } = useEnergyData();
  // Client-side filtering, sorting, pagination
}
```

**Migrated Implementation:**
```typescript
// src/app/components/energy/EnergyTable.tsx

import { useEnergyService } from '@/app/hooks/useEnergyService';

export default function EnergyTable() {
  const { data, isLoading } = useEnergyService({
    component: 'energy_table'
  });
  // Same filtering, sorting, pagination
  // But data fetching might be from cache
}
```

**Expected Performance Improvement:**
- Initial load: 200ms → 50ms (4x faster)
- Large datasets (1000+ readings): 500ms → 50ms (10x faster)

**Migration Steps:**
1. ✅ Replace `useEnergyData` with `useEnergyService`
2. ✅ Test all table features (sort, filter, pagination, edit, delete)
3. ✅ Deploy with flag OFF
4. ✅ Enable flag for internal users (whitelist)
5. ✅ Gradual rollout: 10% → 50% → 100%
6. ✅ Monitor metrics (load time, error rate)
7. ✅ Remove flag after 1 week stability

**Rollback:** Toggle `energy_table_new_backend` to `false`

---

### Phase 2B: Medium Risk Components (Week 2)

#### Component 3: Timeline Slider Histogram

**Risk:** Medium
**Complexity:** Medium
**User Impact:** Medium
**Duration:** 6-8 hours

**Current Implementation:**
```typescript
// src/app/components/energy/RangeSlider/SliderVisualization.tsx

import { useHistogramData } from './hooks/useHistogramData';

export default function SliderVisualization({ data }) {
  // Calculate histogram buckets on-demand (useMemo)
  const buckets = useHistogramData(data, dateRange, 100);
}
```

**Migrated Implementation:**
```typescript
// src/app/components/energy/RangeSlider/SliderVisualization.tsx

import { useHistogramDisplayData } from '@/app/hooks/useHistogramDisplayData';

export default function SliderVisualization({ data }) {
  // Check feature flag
  const useNew = checkBackendFlag('timeline_slider');

  // OLD: Calculate on-demand
  const oldBuckets = useHistogramData(data, dateRange, 100);

  // NEW: Fetch pre-calculated
  const { data: newBuckets } = useHistogramDisplayData({
    type: 'power',
    enabled: useNew
  });

  const buckets = useNew ? newBuckets : oldBuckets;
}
```

**Expected Performance Improvement:**
- Histogram calculation: 20-30ms → <5ms (5x faster)
- Smoother drag interactions (less lag)

**Migration Steps:**
1. ✅ Create `useHistogramDisplayData` hook
2. ✅ Update component to use conditional hook
3. ✅ Test histogram accuracy (compare old vs new)
4. ✅ Deploy with flag OFF
5. ✅ Gradual rollout: 10% → 50% → 100%
6. ✅ Simplify code (remove old path after 100%)

**Rollback:** Toggle `timeline_slider_new_backend` to `false`

---

#### Component 4: Monthly Charts

**Risk:** High
**Complexity:** High
**User Impact:** Medium
**Duration:** 8-10 hours

**Current Implementation:**
```typescript
// src/app/components/energy/MonthlyMeterReadingsChart.tsx

export default function MonthlyMeterReadingsChart({
  energyData,
  selectedYear
}) {
  // Calculate monthly data on component mount (expensive!)
  const monthlyData = useMemo(() =>
    MonthlyDataAggregationService.calculateMonthlyReadings(
      energyData,
      selectedYear,
      type
    ),
    [energyData, selectedYear, type]
  );

  // Render chart
}
```

**Migrated Implementation:**
```typescript
// src/app/components/energy/MonthlyMeterReadingsChart.tsx

import { useMonthlyDisplayData } from '@/app/hooks/useMonthlyDisplayData';

export default function MonthlyMeterReadingsChart({
  selectedYear
}) {
  // Fetch pre-calculated monthly data
  const { data: monthlyData, isLoading } = useMonthlyDisplayData({
    type: 'power',
    year: selectedYear,
    component: 'monthly_charts'
  });

  if (isLoading) return <Skeleton />;

  // Render chart (data is ready, no calculation needed!)
}
```

**Expected Performance Improvement:**
- Chart load: 100-150ms → <10ms (10x faster)
- Year change: 100ms → <10ms (instant!)
- No UI freeze during calculation

**Migration Steps:**
1. ✅ Create `useMonthlyDisplayData` hook
2. ✅ Update component to fetch pre-calculated data
3. ✅ Verify interpolation/extrapolation logic identical
4. ✅ Test edge cases (no data, gaps, year boundaries)
5. ✅ Deploy with flag OFF
6. ✅ Gradual rollout: 10% → 50% → 100%
7. ✅ Remove old calculation code

**Rollback:** Toggle `monthly_charts_new_backend` to `false`

---

### Phase 2C: High Risk Components (Week 3)

#### Component 5: CSV Import

**Risk:** High
**Complexity:** High
**User Impact:** Medium
**Duration:** 8-10 hours

**Current Implementation:**
```typescript
// src/app/components/add/CSVFileUpload.tsx

async function handleImport(data: EnergyBase[]) {
  const result = await importCSVAction(data, existingData);
  showToast(`Imported ${result.success} readings`);
}
```

**Migrated Implementation:**
```typescript
// src/app/components/add/CSVFileUpload.tsx

async function handleImport(data: EnergyBase[]) {
  // Check feature flag
  const useNew = await checkBackendFlag('csv_import');

  let result;
  if (useNew) {
    result = await importCSVActionV2(data); // New service layer
  } else {
    result = await importCSVAction(data, existingData); // Old direct Mongoose
  }

  showToast(`Imported ${result.success} readings`);
}
```

**New Server Action (V2):**
```typescript
// src/actions/energy.ts

'use server';

import { getEnergyCrudService } from '@/services';
import { checkBackendFlag } from '@/lib/featureFlags';

export async function importCSVActionV2(
  data: EnergyBase[]
) {
  const useNew = await checkBackendFlag('csv_import');

  if (useNew) {
    // NEW: Use service layer with bulk operation
    const service = getEnergyCrudService();
    const readings = await service.createMany(data);

    return {
      success: readings.length,
      skipped: 0,
      error: data.length - readings.length,
    };
  } else {
    // OLD: Fallback to existing implementation
    return importCSVAction(data, existingData);
  }
}
```

**Expected Performance Improvement:**
- 100 readings: 5-10 seconds → 1-2 seconds (5x faster)
- 1000 readings: 50-100 seconds → 10-15 seconds (5x faster)
- Automatic display data invalidation (no manual refresh)

**Migration Steps:**
1. ✅ Create `importCSVActionV2` server action
2. ✅ Optimize bulk event handling in service layer
3. ✅ Test with various CSV sizes (10, 100, 1000 rows)
4. ✅ Test duplicate detection
5. ✅ Monitor event processing time
6. ✅ Deploy with flag OFF
7. ✅ Gradual rollout: 10% → 50% → 100%

**Rollback:** Toggle `csv_import_new_backend` to `false`

---

#### Component 6: Add/Edit Forms

**Risk:** Medium
**Complexity:** Medium
**User Impact:** High
**Duration:** 4-6 hours

**Current Implementation:**
```typescript
// src/app/components/add/EnergyForm.tsx

async function handleSubmit(data: EnergyBase) {
  const result = await addEnergyAction(data);
  if (result.success) {
    showToast('Reading added successfully');
  }
}
```

**Migrated Implementation:**
```typescript
// src/app/components/add/EnergyForm.tsx

async function handleSubmit(data: EnergyBase) {
  const useNew = await checkBackendFlag('energy_forms');

  let result;
  if (useNew) {
    result = await addEnergyActionV2(data);
  } else {
    result = await addEnergyAction(data);
  }

  if (result.success) {
    showToast('Reading added successfully');
  }
}
```

**New Server Actions (V2):**
```typescript
// src/actions/energy.ts

'use server';

import { getEnergyCrudService } from '@/services';
import { checkBackendFlag } from '@/lib/featureFlags';

export async function addEnergyActionV2(
  energyData: EnergyBase
): Promise<ApiResult> {
  const useNew = await checkBackendFlag('energy_forms');

  if (useNew) {
    const service = getEnergyCrudService();
    const reading = await service.create(energyData);
    return { success: !!reading._id };
  } else {
    return addEnergyAction(energyData);
  }
}

export async function updateEnergyActionV2(
  id: string,
  data: Partial<EnergyBase>
): Promise<ApiResult> {
  const useNew = await checkBackendFlag('energy_forms');

  if (useNew) {
    const session = await getServerSession();
    const service = getEnergyCrudService();
    const updated = await service.update(id, session.user.id, data);
    return { success: !!updated };
  } else {
    // Old update logic (not shown)
    return updateEnergyAction(id, data);
  }
}
```

**Migration Steps:**
1. ✅ Create `addEnergyActionV2` and `updateEnergyActionV2`
2. ✅ Update form components to use V2 actions
3. ✅ Test validation logic
4. ✅ Test error handling
5. ✅ Deploy with flag OFF
6. ✅ Gradual rollout: 10% → 50% → 100%

**Rollback:** Toggle `energy_forms_new_backend` to `false`

---

## 6. Server Actions Migration Strategy

### 6.1 Dual-Path Approach (RECOMMENDED)

**Pattern:** Same server action, branches internally based on feature flag.

**Advantages:**
- Single function name (no "V2" proliferation)
- Feature flag controls behavior transparently
- Easy to remove old path later
- Less code duplication

**Example:**
```typescript
// src/actions/energy.ts

'use server';

import { getEnergyCrudService } from '@/services';
import { checkBackendFlag } from '@/lib/featureFlags';
import Energy from '@/models/Energy';

export async function addEnergyAction(
  energyData: EnergyBase
): Promise<ApiResult> {
  // Check feature flag
  const useNew = await checkBackendFlag('energy_forms');

  if (useNew) {
    // NEW PATH: Use service layer
    const service = getEnergyCrudService();
    const reading = await service.create(energyData);
    return { success: !!reading._id };
  } else {
    // OLD PATH: Direct Mongoose (existing logic)
    await connectDB();
    const result = await new Energy(energyData).save();
    return { success: "_id" in result };
  }
}
```

**Cleanup (Phase 4):**
```typescript
// After all components at 100%, remove old path

export async function addEnergyAction(
  energyData: EnergyBase
): Promise<ApiResult> {
  // Only new path remains
  const service = getEnergyCrudService();
  const reading = await service.create(energyData);
  return { success: !!reading._id };
}
```

---

### 6.2 API Route Versioning

**New API Routes (for display data):**

**Route 1: Table Data**
```typescript
// src/app/api/v2/display/table/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDisplayDataService } from '@/services';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') as 'power' | 'gas';

  const service = getDisplayDataService();

  // Try to get cached table data
  const tableData = await service.getTableData(session.user.id, type);

  return NextResponse.json(tableData);
}
```

**Route 2: Monthly Chart Data**
```typescript
// src/app/api/v2/display/monthly/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDisplayDataService } from '@/services';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') as 'power' | 'gas';
  const year = parseInt(request.nextUrl.searchParams.get('year') || '2024');

  const service = getDisplayDataService();

  // Get cached monthly chart data
  const monthlyData = await service.calculateMonthlyChartData(
    session.user.id,
    type,
    year
  );

  return NextResponse.json(monthlyData);
}
```

**Route 3: Histogram Data**
```typescript
// src/app/api/v2/display/histogram/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDisplayDataService } from '@/services';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') as 'power' | 'gas';
  const bucketCount = parseInt(
    request.nextUrl.searchParams.get('buckets') || '100'
  );

  const service = getDisplayDataService();

  // Get cached histogram data
  const histogramData = await service.calculateHistogramData(
    session.user.id,
    type,
    bucketCount
  );

  return NextResponse.json(histogramData);
}
```

---

## 7. Data Synchronization Strategy

### 7.1 Problem Statement

**Challenge:** New backend writes to `SourceEnergyReading`, old backend writes to `Energy` collection. How to keep them in sync during migration?

**Constraints:**
- Both backends must coexist during Phase 2-3
- No data loss acceptable
- Performance overhead must be minimal
- Easy rollback required

---

### 7.2 Solution: Shared Collection (RECOMMENDED)

**Approach:** Rename/alias `Energy` collection to match `SourceEnergyReading`.

**Implementation:**
```typescript
// src/models/SourceEnergyReading.ts

const SourceEnergyReadingSchema = new Schema<ISourceEnergyReading>(
  {
    // ... schema definition
  },
  {
    timestamps: true,
    collection: 'energies', // ← Use SAME collection as old Energy model
  }
);
```

**Advantages:**
- ✅ No data duplication
- ✅ No sync job needed
- ✅ Instant consistency
- ✅ Zero performance overhead
- ✅ Easiest migration path

**Disadvantages:**
- ⚠️ Models must have compatible schemas
- ⚠️ Need to ensure field names match

**Validation:**
```bash
# MongoDB collection name
db.getCollectionNames()
# Should show: ["energies", "displayenergydata", "users", ...]

# Both models query same collection
Energy.find({})               # Old model
SourceEnergyReading.find({})  # New model
# ← Same results
```

---

### 7.3 Alternative: Dual-Write (If Shared Collection Not Feasible)

**Approach:** When using new backend, write to BOTH collections.

**Implementation:**
```typescript
// src/services/energy/EnergyCrudService.ts

export class EnergyCrudService {
  async create(reading: Omit<SourceEnergyReading, '_id' | ...>) {
    // 1. Write to new collection (SourceEnergyReading)
    const newReading = await this.repository.create(reading);

    // 2. ALSO write to old collection (Energy) for backward compatibility
    await this.syncToOldCollection(newReading);

    // 3. Emit event (triggers display data invalidation)
    this.eventBus.emit(
      EnergyEventFactory.createCreatedEvent(newReading)
    );

    return newReading;
  }

  private async syncToOldCollection(reading: SourceEnergyReading) {
    // Write to old Energy collection
    await Energy.create({
      userId: reading.userId,
      type: reading.type,
      date: reading.date,
      amount: reading.amount,
    });
  }
}
```

**Advantages:**
- ✅ Safe - both collections always in sync
- ✅ Old backend continues working
- ✅ Can compare data for validation

**Disadvantages:**
- ⚠️ Slight performance overhead (2x writes)
- ⚠️ More complex code
- ⚠️ Need to handle write failures

---

### 7.4 Recommendation

**Use Shared Collection approach:**
- Simpler implementation
- Zero overhead
- Instant consistency
- Easier to reason about

**Only use Dual-Write if:**
- Schema incompatibility prevents shared collection
- Need to validate data side-by-side
- Paranoid about data safety

---

## 8. Testing Strategy

### 8.1 Adapter Layer Tests

**Test File:** `src/app/hooks/__tests__/useEnergyService.test.tsx`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useEnergyService } from '../useEnergyService';
import { checkBackendFlag } from '@/lib/featureFlags';

jest.mock('@/lib/featureFlags');

describe('useEnergyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use old backend when flag is OFF', async () => {
    (checkBackendFlag as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() =>
      useEnergyService({ component: 'dashboard' })
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Verify old hook was used
    expect(checkBackendFlag).toHaveBeenCalledWith('dashboard');
  });

  it('should use new backend when flag is ON', async () => {
    (checkBackendFlag as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() =>
      useEnergyService({ component: 'dashboard' })
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Verify new hook was used
    expect(checkBackendFlag).toHaveBeenCalledWith('dashboard');
  });

  it('should handle flag check failure gracefully', async () => {
    (checkBackendFlag as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const { result } = renderHook(() =>
      useEnergyService({ component: 'dashboard' })
    );

    await waitFor(() => {
      // Should fallback to old backend
      expect(result.current.error).toBeNull();
    });
  });

  it('should respect forceOld override', async () => {
    const { result } = renderHook(() =>
      useEnergyService({ component: 'dashboard', forceOld: true })
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Should NOT call checkBackendFlag
    expect(checkBackendFlag).not.toHaveBeenCalled();
  });

  it('should respect forceNew override', async () => {
    const { result } = renderHook(() =>
      useEnergyService({ component: 'dashboard', forceNew: true })
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Should NOT call checkBackendFlag
    expect(checkBackendFlag).not.toHaveBeenCalled();
  });
});
```

---

### 8.2 Feature Flag Tests

**Test File:** `src/lib/__tests__/featureFlags.test.ts`

```typescript
import { checkBackendFlag, updateFeatureFlag } from '../featureFlags';
import FeatureFlag from '@/models/FeatureFlag';

describe('Feature Flags', () => {
  beforeEach(async () => {
    await FeatureFlag.deleteMany({});
  });

  describe('checkBackendFlag', () => {
    it('should return false when global flag is OFF', async () => {
      await FeatureFlag.create({
        name: 'new_backend_enabled',
        enabled: false,
      });

      const result = await checkBackendFlag('dashboard');
      expect(result).toBe(false);
    });

    it('should return false when component flag is OFF', async () => {
      await FeatureFlag.create({
        name: 'new_backend_enabled',
        enabled: true,
      });
      await FeatureFlag.create({
        name: 'dashboard_new_backend',
        enabled: false,
      });

      const result = await checkBackendFlag('dashboard');
      expect(result).toBe(false);
    });

    it('should return true when both flags are ON at 100%', async () => {
      await FeatureFlag.create({
        name: 'new_backend_enabled',
        enabled: true,
      });
      await FeatureFlag.create({
        name: 'dashboard_new_backend',
        enabled: true,
        rolloutPercent: 100,
      });

      const result = await checkBackendFlag('dashboard', 'user123');
      expect(result).toBe(true);
    });

    it('should honor user whitelist', async () => {
      await FeatureFlag.create({
        name: 'new_backend_enabled',
        enabled: true,
      });
      await FeatureFlag.create({
        name: 'dashboard_new_backend',
        enabled: true,
        rolloutPercent: 0,
        userWhitelist: ['user123'],
      });

      const result = await checkBackendFlag('dashboard', 'user123');
      expect(result).toBe(true);
    });

    it('should honor user blacklist', async () => {
      await FeatureFlag.create({
        name: 'new_backend_enabled',
        enabled: true,
      });
      await FeatureFlag.create({
        name: 'dashboard_new_backend',
        enabled: true,
        rolloutPercent: 100,
        userBlacklist: ['user456'],
      });

      const result = await checkBackendFlag('dashboard', 'user456');
      expect(result).toBe(false);
    });

    it('should use deterministic percentage rollout', async () => {
      await FeatureFlag.create({
        name: 'new_backend_enabled',
        enabled: true,
      });
      await FeatureFlag.create({
        name: 'dashboard_new_backend',
        enabled: true,
        rolloutPercent: 50,
      });

      // Same user should always get same result
      const result1 = await checkBackendFlag('dashboard', 'user123');
      const result2 = await checkBackendFlag('dashboard', 'user123');
      expect(result1).toBe(result2);
    });
  });
});
```

---

### 8.3 Integration Tests

**Test File:** `src/app/__tests__/integration/backend-migration.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useEnergyService } from '@/app/hooks/useEnergyService';
import { addEnergyAction } from '@/actions/energy';
import { checkBackendFlag } from '@/lib/featureFlags';
import FeatureFlag from '@/models/FeatureFlag';

describe('Backend Migration Integration', () => {
  beforeEach(async () => {
    await FeatureFlag.deleteMany({});
  });

  it('should fetch same data from old and new backends', async () => {
    // Seed test data
    await addEnergyAction({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-01-01'),
      amount: 10000,
    });

    // Fetch with OLD backend
    await FeatureFlag.create({
      name: 'new_backend_enabled',
      enabled: false,
    });

    const { result: oldResult } = renderHook(() =>
      useEnergyService({ component: 'test' })
    );

    await waitFor(() => {
      expect(oldResult.current.data).toHaveLength(1);
    });

    const oldData = oldResult.current.data;

    // Fetch with NEW backend
    await FeatureFlag.updateOne(
      { name: 'new_backend_enabled' },
      { enabled: true, rolloutPercent: 100 }
    );
    await FeatureFlag.create({
      name: 'test_new_backend',
      enabled: true,
      rolloutPercent: 100,
    });

    const { result: newResult } = renderHook(() =>
      useEnergyService({ component: 'test', forceNew: true })
    );

    await waitFor(() => {
      expect(newResult.current.data).toHaveLength(1);
    });

    const newData = newResult.current.data;

    // Data should be identical
    expect(newData[0].amount).toBe(oldData[0].amount);
    expect(newData[0].type).toBe(oldData[0].type);
    expect(newData[0].date.getTime()).toBe(oldData[0].date.getTime());
  });

  it('should invalidate cache when new reading created', async () => {
    await FeatureFlag.create({
      name: 'new_backend_enabled',
      enabled: true,
    });
    await FeatureFlag.create({
      name: 'energy_forms_new_backend',
      enabled: true,
      rolloutPercent: 100,
    });

    // Create reading (should emit event → invalidate cache)
    await addEnergyAction({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-06-15'),
      amount: 12000,
    });

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch display data (should be recalculated)
    const { result } = renderHook(() =>
      useEnergyService({
        component: 'dashboard',
        forceNew: true
      })
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
  });
});
```

---

### 8.4 Performance Tests

**Test File:** `src/app/__tests__/performance/backend-comparison.test.ts`

```typescript
describe('Backend Performance Comparison', () => {
  it('should load display data faster than on-demand calculation', async () => {
    // Seed 1000 readings
    const readings = Array.from({ length: 1000 }, (_, i) => ({
      userId: 'test-user',
      type: 'power' as const,
      date: new Date(2024, 0, i + 1),
      amount: 10000 + i,
    }));

    for (const reading of readings) {
      await addEnergyAction(reading);
    }

    // Measure OLD backend (on-demand calculation)
    const oldStart = Date.now();
    const { result: oldResult } = renderHook(() =>
      useEnergyService({ component: 'test', forceOld: true })
    );
    await waitFor(() => {
      expect(oldResult.current.data).toHaveLength(1000);
    });
    const oldDuration = Date.now() - oldStart;

    // Measure NEW backend (cached display data)
    const newStart = Date.now();
    const { result: newResult } = renderHook(() =>
      useEnergyService({ component: 'test', forceNew: true })
    );
    await waitFor(() => {
      expect(newResult.current.data).toHaveLength(1000);
    });
    const newDuration = Date.now() - newStart;

    console.log(`Performance: OLD=${oldDuration}ms, NEW=${newDuration}ms`);

    // New should be at least 2x faster
    expect(newDuration).toBeLessThan(oldDuration / 2);
  });
});
```

---

## 9. Rollback Plan

### 9.1 Instant Rollback (No Code Deploy)

**Scenario:** New backend has critical bug in production.

**Action:**
```typescript
// Option 1: Disable global flag (affects all components)
await updateFeatureFlag('new_backend_enabled', { enabled: false });

// Option 2: Disable specific component
await updateFeatureFlag('dashboard_new_backend', { enabled: false });

// Option 3: Reduce rollout percentage
await updateFeatureFlag('dashboard_new_backend', { rolloutPercent: 0 });
```

**Result:**
- ✅ All users immediately revert to old backend
- ✅ No code deployment needed
- ✅ No data loss
- ✅ Takes effect on next request (~1 second)

**Timeline:** < 1 minute

---

### 9.2 Partial Rollback (Selective Users)

**Scenario:** New backend works for most users but breaks for specific edge case.

**Action:**
```typescript
// Add problematic users to blacklist
await updateFeatureFlag('dashboard_new_backend', {
  userBlacklist: ['user-with-issue-1', 'user-with-issue-2']
});
```

**Result:**
- ✅ Blacklisted users use old backend
- ✅ Other users continue with new backend
- ✅ Time to investigate issue

**Timeline:** < 5 minutes

---

### 9.3 Full Rollback (Code Revert)

**Scenario:** Fundamental architectural issue, need to remove adapter layer.

**Action:**
```bash
# 1. Revert PR that added adapter hooks
git revert <commit-hash>

# 2. Deploy reverted code
npm run build
npm run deploy

# 3. Disable all flags (safety)
db.featureflags.updateMany({}, { $set: { enabled: false } })
```

**Result:**
- ✅ Codebase back to pre-Phase 2 state
- ✅ All components use old backend
- ✅ New backend remains intact for debugging

**Timeline:** 10-30 minutes (depending on deploy process)

---

### 9.4 Rollback Testing

**Test rollback scenarios during development:**

```typescript
// Test instant rollback
it('should revert to old backend when flag disabled mid-session', async () => {
  // Enable flag
  await updateFeatureFlag('dashboard_new_backend', {
    enabled: true,
    rolloutPercent: 100
  });

  // Component uses new backend
  const { result, rerender } = renderHook(() =>
    useEnergyService({ component: 'dashboard' })
  );

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });

  // Disable flag (simulate rollback)
  await updateFeatureFlag('dashboard_new_backend', { enabled: false });

  // Refetch data
  rerender();
  await result.current.refetch();

  await waitFor(() => {
    // Should now use old backend
    expect(result.current.data).toBeDefined();
  });
});
```

---

## 10. Monitoring & Observability

### 10.1 Metrics to Track

**Backend Usage Metrics:**
```typescript
// src/lib/monitoring/BackendUsageTracker.ts

export class BackendUsageTracker {
  static async logBackendUsage(event: {
    component: string;
    backend: 'old' | 'new';
    userId: string;
    duration: number;
    success: boolean;
    error?: string;
  }) {
    // Log to console (development)
    console.log('[BackendUsage]', event);

    // Store in database (production)
    await BackendUsageLog.create({
      ...event,
      timestamp: new Date(),
    });
  }
}
```

**Usage in Adapter Hook:**
```typescript
// src/app/hooks/useEnergyService.ts

export function useEnergyService(options = {}) {
  const startTime = Date.now();
  const [useNewBackend, setUseNewBackend] = useState(false);

  // ... flag checking logic

  useEffect(() => {
    // Track which backend was used
    BackendUsageTracker.logBackendUsage({
      component: options.component || 'unknown',
      backend: useNewBackend ? 'new' : 'old',
      userId: session?.user?.id || 'anonymous',
      duration: Date.now() - startTime,
      success: !error,
      error: error || undefined,
    });
  }, [data, error]);

  // ... rest of hook
}
```

**Metrics Dashboard (Example):**
```
Backend Usage (Last 24 Hours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Component          Old Backend    New Backend    Adoption %
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard          120 (48%)      130 (52%)      52%
Energy Table       300 (30%)      700 (70%)      70%
Timeline Slider    50 (100%)      0 (0%)         0%
Monthly Charts     80 (20%)       320 (80%)      80%
CSV Import         10 (50%)       10 (50%)       50%
Energy Forms       200 (40%)      300 (60%)      60%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Performance Comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metric             Old Backend    New Backend    Improvement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avg Load Time      245ms          52ms           4.7x
p95 Load Time      580ms          95ms           6.1x
Error Rate         0.5%           0.3%           40% better
Cache Hit Rate     N/A            87%            -
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 10.2 Logging Strategy

**Structured Logging:**
```typescript
// src/lib/logger.ts

export const logger = {
  info(message: string, meta?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...meta,
      timestamp: new Date().toISOString(),
    }));
  },

  error(message: string, error?: Error, meta?: any) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date().toISOString(),
    }));
  },
};
```

**Log Feature Flag Decisions:**
```typescript
// src/lib/featureFlags.ts

export async function checkBackendFlag(
  component?: string,
  userId?: string
): Promise<boolean> {
  const decision = await evaluateFlags(component, userId);

  logger.info('Feature flag decision', {
    component,
    userId,
    decision,
    globalFlag: decision.globalEnabled,
    componentFlag: decision.componentEnabled,
    rolloutPercent: decision.rolloutPercent,
    userInRollout: decision.userInRollout,
  });

  return decision.useNewBackend;
}
```

**Log Adapter Hook Usage:**
```typescript
// src/app/hooks/useEnergyService.ts

useEffect(() => {
  logger.info('Adapter hook initialized', {
    component: options.component,
    useNewBackend,
    forceOld: options.forceOld,
    forceNew: options.forceNew,
  });
}, [useNewBackend]);
```

---

### 10.3 Alerts

**Critical Alerts (PagerDuty/Slack):**
```typescript
// Alert 1: New backend error rate spike
if (newBackendErrorRate > oldBackendErrorRate * 1.5) {
  alert('CRITICAL: New backend error rate 50% higher than old backend');
}

// Alert 2: Performance regression
if (newBackendLoadTime > oldBackendLoadTime) {
  alert('WARNING: New backend slower than old backend');
}

// Alert 3: Cache hit rate too low
if (cacheHitRate < 50) {
  alert('WARNING: Display data cache hit rate below 50%');
}

// Alert 4: Feature flag check failure
if (flagCheckFailureRate > 5) {
  alert('CRITICAL: Feature flag checks failing');
}
```

---

## 11. Implementation Phases

### Week 1: Adapter Infrastructure (Days 1-5)

**Day 1-2: Feature Flag System**
- ✅ Enhance FeatureFlag model (rolloutPercent, whitelist, etc.)
- ✅ Implement `checkBackendFlag()` function
- ✅ Write feature flag tests
- ✅ Seed initial flags in database (all OFF)

**Day 3-4: Adapter Hooks**
- ✅ Create `useEnergyService` hook
- ✅ Create `useDisplayData` hook
- ✅ Create `useMonthlyDisplayData` hook
- ✅ Write adapter hook tests

**Day 5: API Routes**
- ✅ Create `/api/v2/display/table` route
- ✅ Create `/api/v2/display/monthly` route
- ✅ Create `/api/v2/display/histogram` route
- ✅ Write API route tests

---

### Week 2: Component Migration - Low Risk (Days 6-10)

**Day 6-7: Dashboard Component**
- ✅ Migrate to `useEnergyService`
- ✅ Deploy with flag OFF
- ✅ Enable flag in dev environment
- ✅ Internal testing (whitelist)
- ✅ Gradual rollout: 10% → 50% → 100%

**Day 8-9: Energy Table Component**
- ✅ Migrate to `useEnergyService`
- ✅ Test filtering, sorting, pagination
- ✅ Deploy with flag OFF
- ✅ Internal testing
- ✅ Gradual rollout: 10% → 50% → 100%

**Day 10: Monitor and Fix Issues**
- ✅ Review metrics dashboard
- ✅ Fix any bugs discovered
- ✅ Adjust rollout based on performance

---

### Week 3: Component Migration - Medium/High Risk (Days 11-15)

**Day 11-12: Timeline Slider and Monthly Charts**
- ✅ Migrate Timeline Slider to histogram display data
- ✅ Migrate Monthly Charts to `useMonthlyDisplayData`
- ✅ Test calculation accuracy (compare old vs new)
- ✅ Deploy with flags OFF
- ✅ Gradual rollout: 10% → 50% → 100%

**Day 13-14: CSV Import and Forms**
- ✅ Create `importCSVActionV2` with bulk operations
- ✅ Create `addEnergyActionV2` and `updateEnergyActionV2`
- ✅ Optimize bulk event handling
- ✅ Test with large CSV files
- ✅ Gradual rollout: 10% → 50% → 100%

**Day 15: Finalize and Monitor**
- ✅ All components at 100% rollout
- ✅ Monitor for 1 week
- ✅ Verify no regressions
- ✅ Collect performance metrics

---

### Week 4: Cleanup (Days 16-20)

**Day 16-17: Remove Feature Flags**
- ✅ Remove flag checks from adapter hooks
- ✅ Simplify hooks (only new backend path)
- ✅ Remove old code paths from server actions
- ✅ Update tests

**Day 18: Deprecate Old Code**
- ✅ Mark old server actions as deprecated
- ✅ Remove old API routes
- ✅ Remove old calculation code paths
- ✅ Update imports

**Day 19-20: Documentation and Polish**
- ✅ Update CLAUDE.md with new architecture
- ✅ Update README with new data flow
- ✅ Create runbook for operational issues
- ✅ Final code review

---

## 12. Success Criteria

### Phase 2 Complete When:

**Technical Criteria:**
- ✅ All 6 components migrated to new backend
- ✅ All feature flags at 100% rollout for 1 week
- ✅ Cache hit rate >80% for display data
- ✅ Query performance equal or better than old backend
- ✅ Error rate unchanged or lower
- ✅ 100% test pass rate maintained
- ✅ No data consistency issues detected

**Performance Criteria:**
- ✅ Dashboard load: <50ms (currently ~200ms)
- ✅ Energy table load: <100ms (currently ~200ms)
- ✅ Monthly chart load: <10ms (currently ~100ms)
- ✅ CSV import (100 rows): <2s (currently ~5-10s)

**User Experience Criteria:**
- ✅ Zero user-reported regressions
- ✅ Faster page loads (measured)
- ✅ Positive or neutral user feedback
- ✅ No increase in support tickets

**Process Criteria:**
- ✅ All migrations documented
- ✅ Rollback tested and validated
- ✅ Monitoring dashboard operational
- ✅ Team trained on new architecture

---

## 13. Risks and Mitigation

### Risk 1: Data Inconsistency

**Description:** Old and new backends return different data.

**Probability:** Medium
**Impact:** High

**Mitigation:**
- Use shared MongoDB collection (same data source)
- Write integration tests comparing old vs new output
- Run A/B comparison tests in production
- Monitor data mismatches with alerts

**Contingency:**
- Instant rollback via feature flag
- Fix data inconsistency in service layer
- Re-test before re-enabling

---

### Risk 2: Cache Staleness

**Description:** Display data out of sync with source data.

**Probability:** Medium
**Impact:** Medium

**Mitigation:**
- Event-driven cache invalidation (automatic)
- Hash-based cache validation
- Monitor cache hit rate (should be >80%)
- Alert if cache staleness detected

**Contingency:**
- Manual cache invalidation endpoint
- Reduce cache TTL temporarily
- Fix event handler if broken

---

### Risk 3: Performance Regression

**Description:** New backend slower than old backend.

**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Performance benchmarks before 100% rollout
- Compare load times (old vs new)
- Optimize queries and indexes
- Monitor p95 latency

**Contingency:**
- Rollback to old backend
- Identify bottleneck (profiling)
- Optimize service layer
- Re-enable after fix

---

### Risk 4: Feature Flag Complexity

**Description:** Too many flags, hard to manage.

**Probability:** Low
**Impact:** Low

**Mitigation:**
- Clear flag naming convention
- Admin dashboard to view all flags
- Automatic flag expiration (metadata.expiresAt)
- Remove flags after migration complete

**Contingency:**
- Consolidate flags (global only)
- Simplify rollout strategy
- Better documentation

---

### Risk 5: Event Handler Failure

**Description:** Events not processed, cache never invalidated.

**Probability:** Low
**Impact:** High

**Mitigation:**
- Comprehensive event handler tests (100% coverage)
- Error handling in event handlers
- Retry logic for failed events
- Monitor event processing time

**Contingency:**
- Manual cache invalidation
- Fix event handler code
- Re-process events from event log

---

## 14. Code Examples

### Example 1: `useEnergyService` Full Implementation

```typescript
// src/app/hooks/useEnergyService.ts

import { useState, useCallback, useEffect } from 'react';
import { useEnergyData as useEnergyDataOld } from './useEnergyData';
import { useDisplayData } from './useDisplayData';
import { checkBackendFlag } from '@/lib/featureFlags';
import { EnergyType } from '@/app/types';

export interface UseEnergyServiceOptions {
  component?: string;
  forceOld?: boolean;
  forceNew?: boolean;
}

export interface UseEnergyServiceResult {
  data: EnergyType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Unified hook that routes to old or new backend based on feature flags
 *
 * During migration:
 * - Checks feature flags to decide which backend to use
 * - Returns same data structure regardless of backend
 * - Allows gradual component-by-component migration
 *
 * @param options.component - Component name for flag check (e.g., 'dashboard')
 * @param options.forceOld - Force old backend (testing only)
 * @param options.forceNew - Force new backend (testing only)
 */
export function useEnergyService(
  options: UseEnergyServiceOptions = {}
): UseEnergyServiceResult {
  const { component, forceOld = false, forceNew = false } = options;
  const [useNewBackend, setUseNewBackend] = useState(false);
  const [flagChecked, setFlagChecked] = useState(false);

  // Check feature flags on mount
  useEffect(() => {
    async function checkFlags() {
      try {
        // Force flags for testing
        if (forceOld) {
          setUseNewBackend(false);
          setFlagChecked(true);
          return;
        }
        if (forceNew) {
          setUseNewBackend(true);
          setFlagChecked(true);
          return;
        }

        // Check real feature flags
        const shouldUseNew = await checkBackendFlag(component);
        setUseNewBackend(shouldUseNew);
        setFlagChecked(true);
      } catch (error) {
        // On flag check failure, default to old backend (safe)
        console.error('Feature flag check failed, using old backend:', error);
        setUseNewBackend(false);
        setFlagChecked(true);
      }
    }

    checkFlags();
  }, [component, forceOld, forceNew]);

  // Use old hook (existing implementation)
  const oldHook = useEnergyDataOld();

  // Use new hook (display data cache)
  const newHook = useDisplayData({ enabled: useNewBackend && flagChecked });

  // Return appropriate hook result
  // During flag check, return loading state
  if (!flagChecked) {
    return {
      data: [],
      isLoading: true,
      error: null,
      refetch: async () => {},
    };
  }

  return useNewBackend ? newHook : oldHook;
}
```

---

### Example 2: Feature Flag Checking Function

```typescript
// src/lib/featureFlags.ts

'use server';

import { connectDB } from './mongodb';
import FeatureFlag from '@/models/FeatureFlag';
import { getServerSession } from 'next-auth';
import { createHash } from 'crypto';

export const FEATURE_FLAGS = {
  NEW_BACKEND_ENABLED: 'new_backend_enabled',
  DASHBOARD_NEW_BACKEND: 'dashboard_new_backend',
  ENERGY_TABLE_NEW_BACKEND: 'energy_table_new_backend',
  TIMELINE_SLIDER_NEW_BACKEND: 'timeline_slider_new_backend',
  MONTHLY_CHARTS_NEW_BACKEND: 'monthly_charts_new_backend',
  CSV_IMPORT_NEW_BACKEND: 'csv_import_new_backend',
  ENERGY_FORMS_NEW_BACKEND: 'energy_forms_new_backend',
} as const;

/**
 * Check if new backend should be used for given component
 *
 * Decision flow:
 * 1. Check global master switch (new_backend_enabled)
 * 2. Check component-specific flag (if component provided)
 * 3. Check user whitelist/blacklist
 * 4. Check percentage rollout (deterministic based on userId hash)
 *
 * @param component - Component name (e.g., 'dashboard')
 * @param userId - User ID (optional, fetched from session if not provided)
 * @returns true if new backend should be used, false otherwise
 */
export async function checkBackendFlag(
  component?: string,
  userId?: string
): Promise<boolean> {
  await connectDB();

  // Get userId from session if not provided
  if (!userId) {
    const session = await getServerSession();
    userId = session?.user?.id;
  }

  // 1. Check global master switch
  const globalFlag = await FeatureFlag.findOne({
    name: FEATURE_FLAGS.NEW_BACKEND_ENABLED
  });

  if (!globalFlag || !globalFlag.enabled) {
    return false; // Global switch OFF - use old backend
  }

  // 2. Check component-specific flag (if component provided)
  if (component) {
    const componentFlagName = `${component}_new_backend`;
    const componentFlag = await FeatureFlag.findOne({
      name: componentFlagName
    });

    if (!componentFlag || !componentFlag.enabled) {
      return false; // Component flag OFF - use old backend
    }

    // 3. Check user whitelist (always enable)
    if (userId && componentFlag.userWhitelist?.includes(userId)) {
      return true; // User in whitelist - use new backend
    }

    // 4. Check user blacklist (always disable)
    if (userId && componentFlag.userBlacklist?.includes(userId)) {
      return false; // User in blacklist - use old backend
    }

    // 5. Check percentage rollout (deterministic)
    if (userId && componentFlag.rolloutPercent < 100) {
      const userPercentile = getUserPercentile(userId);
      return userPercentile < componentFlag.rolloutPercent;
    }

    // 6. Full rollout (100%)
    return componentFlag.rolloutPercent === 100;
  }

  // No component specified - use global flag only
  return globalFlag.enabled;
}

/**
 * Calculate deterministic percentile (0-99) for user
 * Same user always gets same percentile (consistent A/B assignment)
 */
function getUserPercentile(userId: string): number {
  const hash = createHash('sha256').update(userId).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 100;
}
```

---

### Example 3: Server Action with Dual-Path Logic

```typescript
// src/actions/energy.ts

'use server';

import { connectDB } from '@/lib/mongodb';
import Energy from '@/models/Energy';
import { getEnergyCrudService } from '@/services';
import { checkBackendFlag } from '@/lib/featureFlags';
import { ApiResult, EnergyBase } from '../app/types';

/**
 * Add energy reading (dual-path implementation)
 *
 * Routes to old or new backend based on feature flag
 */
export async function addEnergyAction(
  energyData: EnergyBase
): Promise<ApiResult> {
  // Check feature flag
  const useNew = await checkBackendFlag('energy_forms');

  if (useNew) {
    // NEW PATH: Use service layer
    try {
      const service = getEnergyCrudService();
      const reading = await service.create(energyData);

      // Service returns SourceEnergyReading, extract success
      return { success: !!reading._id };
    } catch (error) {
      console.error('New backend error:', error);
      throw error;
    }
  } else {
    // OLD PATH: Direct Mongoose (existing logic)
    return connectDB().then(() =>
      new Energy(energyData).save().then((createResult) => ({
        success: "_id" in createResult,
      }))
    );
  }
}

/**
 * Delete energy reading (dual-path implementation)
 */
export async function deleteEnergyAction(id: string): Promise<ApiResult> {
  const useNew = await checkBackendFlag('energy_forms');

  if (useNew) {
    // NEW PATH: Use service layer
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const service = getEnergyCrudService();
    const deleted = await service.delete(id, session.user.id);

    return { success: deleted };
  } else {
    // OLD PATH: Direct Mongoose
    return connectDB().then(() =>
      Energy.deleteOne({ _id: id }).then((deleteResult) => ({
        success: deleteResult != undefined,
      }))
    );
  }
}

/**
 * Import CSV (dual-path implementation with bulk optimization)
 */
export async function importCSVAction(
  data: EnergyBase[],
  existingData: EnergyType[]
) {
  const useNew = await checkBackendFlag('csv_import');

  if (useNew) {
    // NEW PATH: Use service layer with bulk operation
    try {
      const service = getEnergyCrudService();

      // Filter out duplicates
      const uniqueData = data.filter(entry =>
        !existingData.some(existing =>
          existing.date.getTime() === entry.date.getTime() &&
          existing.type === entry.type
        )
      );

      // Bulk create (emits single event, not N events)
      const created = await service.createMany(uniqueData);

      return {
        success: created.length,
        skipped: data.length - uniqueData.length,
        error: uniqueData.length - created.length,
      };
    } catch (error) {
      console.error('CSV import error:', error);
      throw new Error('Failed to import CSV data');
    }
  } else {
    // OLD PATH: Loop with individual creates (existing logic)
    try {
      const sortedData = [...data].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const result = {
        success: 0,
        skipped: 0,
        error: 0,
      };

      for (const entry of sortedData) {
        try {
          const exists = existingData.some(
            (existing) =>
              existing.date.getTime() == entry.date.getTime() &&
              existing.type == entry.type
          );

          if (exists) {
            result.skipped++;
            continue;
          }

          const addedResult = await addEnergyAction(entry);
          if ("success" in addedResult) {
            result.success++;
          } else {
            result.error++;
          }
        } catch (error) {
          console.error("Error importing entry:", error);
          result.error++;
        }
      }

      return result;
    } catch (error) {
      console.error("Error importing CSV data:", error);
      throw new Error("Failed to import CSV data");
    }
  }
}
```

---

### Example 4: Component Using Adapter Hook

```typescript
// src/app/dashboard/page.tsx

'use client';

import { useEnergyService } from '@/app/hooks/useEnergyService';
import { ENERGY_TYPE_CONFIG } from '@/app/constants/energyTypes';

export default function Dashboard() {
  // Use adapter hook (automatically routes to old or new backend)
  const { data, isLoading, error, refetch } = useEnergyService({
    component: 'dashboard'
  });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Calculate totals (same logic as before)
  const powerReadings = data.filter(r => r.type === 'power');
  const gasReadings = data.filter(r => r.type === 'gas');

  const latestPower = powerReadings[powerReadings.length - 1]?.amount || 0;
  const latestGas = gasReadings[gasReadings.length - 1]?.amount || 0;

  return (
    <div className="dashboard">
      <h1>Energy Dashboard</h1>

      <div className="summary-cards">
        <div className="card">
          <h2>Power</h2>
          <p className="amount">{latestPower.toLocaleString()} kWh</p>
          <p className="count">{powerReadings.length} readings</p>
        </div>

        <div className="card">
          <h2>Gas</h2>
          <p className="amount">{latestGas.toLocaleString()} m³</p>
          <p className="count">{gasReadings.length} readings</p>
        </div>
      </div>

      <button onClick={refetch}>Refresh Data</button>
    </div>
  );
}

// Component code UNCHANGED - only hook import changed!
```

---

### Example 5: Integration Test for Adapter Layer

```typescript
// src/app/hooks/__tests__/integration/useEnergyService.integration.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { useEnergyService } from '../../useEnergyService';
import { addEnergyAction } from '@/actions/energy';
import FeatureFlag from '@/models/FeatureFlag';
import { connectDB } from '@/lib/mongodb';
import { initializeEventHandlers } from '@/services';

describe('useEnergyService Integration', () => {
  beforeAll(async () => {
    await connectDB();
    initializeEventHandlers(); // Register event handlers
  });

  beforeEach(async () => {
    await FeatureFlag.deleteMany({});
  });

  it('should fetch same data from old and new backends', async () => {
    // Seed test data
    await addEnergyAction({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-01-01'),
      amount: 10000,
    });

    // Test OLD backend
    await FeatureFlag.create({
      name: 'new_backend_enabled',
      enabled: false,
    });

    const { result: oldResult } = renderHook(() =>
      useEnergyService({ component: 'test', forceOld: true })
    );

    await waitFor(() => {
      expect(oldResult.current.data).toHaveLength(1);
    });

    const oldData = oldResult.current.data[0];

    // Test NEW backend
    await FeatureFlag.updateOne(
      { name: 'new_backend_enabled' },
      { enabled: true, rolloutPercent: 100 }
    );
    await FeatureFlag.create({
      name: 'test_new_backend',
      enabled: true,
      rolloutPercent: 100,
    });

    const { result: newResult } = renderHook(() =>
      useEnergyService({ component: 'test', forceNew: true })
    );

    await waitFor(() => {
      expect(newResult.current.data).toHaveLength(1);
    });

    const newData = newResult.current.data[0];

    // Verify data is identical
    expect(newData.type).toBe(oldData.type);
    expect(newData.amount).toBe(oldData.amount);
    expect(newData.date.getTime()).toBe(oldData.date.getTime());
    expect(newData.userId).toBe(oldData.userId);
  });

  it('should invalidate cache when new reading created via new backend', async () => {
    // Enable new backend
    await FeatureFlag.create({
      name: 'new_backend_enabled',
      enabled: true,
    });
    await FeatureFlag.create({
      name: 'energy_forms_new_backend',
      enabled: true,
      rolloutPercent: 100,
    });

    // Initial fetch
    const { result, rerender } = renderHook(() =>
      useEnergyService({ component: 'test', forceNew: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.data.length;

    // Create new reading (should emit event → invalidate cache)
    await addEnergyAction({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-06-15'),
      amount: 12000,
    });

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Refetch (should get fresh data)
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toHaveLength(initialCount + 1);
    });
  });

  it('should handle rollback gracefully (flag toggled mid-session)', async () => {
    // Start with new backend enabled
    await FeatureFlag.create({
      name: 'new_backend_enabled',
      enabled: true,
    });
    await FeatureFlag.create({
      name: 'test_new_backend',
      enabled: true,
      rolloutPercent: 100,
    });

    const { result, rerender } = renderHook(() =>
      useEnergyService({ component: 'test' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const dataBeforeRollback = result.current.data;

    // Simulate rollback (disable flag)
    await FeatureFlag.updateOne(
      { name: 'test_new_backend' },
      { enabled: false }
    );

    // Refetch (should now use old backend)
    rerender();
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const dataAfterRollback = result.current.data;

    // Data should still be identical (both backends query same DB)
    expect(dataAfterRollback).toHaveLength(dataBeforeRollback.length);
  });

  it('should respect percentage rollout (deterministic user assignment)', async () => {
    await FeatureFlag.create({
      name: 'new_backend_enabled',
      enabled: true,
    });
    await FeatureFlag.create({
      name: 'test_new_backend',
      enabled: true,
      rolloutPercent: 50, // 50% rollout
    });

    // Same user should consistently get same backend
    const userId = 'consistent-user-123';

    const result1 = await checkBackendFlag('test', userId);
    const result2 = await checkBackendFlag('test', userId);
    const result3 = await checkBackendFlag('test', userId);

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });
});
```

---

## Summary

### Key Architectural Decisions

1. **Adapter Pattern** - Use adapter hooks (useEnergyService) to route between backends transparently
2. **Feature Flags** - Per-component flags with percentage rollout for gradual migration
3. **Dual-Path Server Actions** - Same action, branches internally based on flag
4. **Shared Collection** - Both backends use same MongoDB collection (simplest sync strategy)
5. **Backward Compatibility** - New backend returns data in exact same format as old

### Recommended Migration Order

**Week 1:** Dashboard → Energy Table
**Week 2:** Timeline Slider → Monthly Charts
**Week 3:** CSV Import → Forms

### Estimated Timeline

- **Week 1:** Adapter infrastructure (5 days)
- **Week 2:** Low-risk components (5 days)
- **Week 3:** Medium/high-risk components (5 days)
- **Week 4:** Cleanup and documentation (5 days)
- **TOTAL:** 4 weeks (20 working days)

### Main Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Data inconsistency | Shared collection, integration tests |
| Cache staleness | Event-driven invalidation, hash validation |
| Performance regression | Benchmarks before 100% rollout |
| Feature flag complexity | Clear naming, admin dashboard, auto-expiration |
| Rollback during high traffic | Schedule rollbacks, canary deployments |

### Next Steps for Implementation

1. ✅ Review this design document with team
2. ✅ Create initial feature flags in MongoDB (all OFF)
3. ✅ Implement adapter hooks (`useEnergyService`, `useDisplayData`)
4. ✅ Create new API routes (`/api/v2/display/*`)
5. ✅ Migrate Dashboard component (first low-risk component)
6. ✅ Test with 10% rollout → 50% → 100%
7. ✅ Repeat for other components
8. ✅ Remove feature flags after 1 week stability
9. ✅ Update documentation

---

**Document Version:** 1.0
**Created:** 2025-11-17
**Author:** Claude Code (Architecture Designer Agent)
**Status:** Ready for Review
**Next Review:** After implementation start

---

**References:**
- Phase 1 Design: `docs/architecture/event-based-repository-design.md`
- Migration Strategy: `docs/architecture/backend-first-migration-strategy.md`
- Service Layer: `src/services/README.md`
- Repository Layer: `src/repositories/README.md`
- Event System: `src/events/README.md`
