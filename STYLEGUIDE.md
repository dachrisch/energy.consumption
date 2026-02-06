# Energy Consumption Monitor - Style Guide

This document outlines the coding patterns, conventions, and architectural decisions used throughout the Energy Consumption Monitor codebase.

## Table of Contents

1. [Frontend Patterns](#frontend-patterns)
2. [Backend Patterns](#backend-patterns)
3. [Data Flow](#data-flow)
4. [Testing Patterns](#testing-patterns)
5. [Security Patterns](#security-patterns)
6. [Error Handling](#error-handling)
7. [State Management](#state-management)

---

## Frontend Patterns

### Component Structure (SolidJS)

All frontend components follow a consistent structure using SolidJS best practices.

#### Basic Component Pattern

```typescript
import { Component, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent: Component<MyComponentProps> = (props) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      // Action logic
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="space-y-4">
      <h1 class="text-2xl font-black">{props.title}</h1>
      <Show when={!isLoading()} fallback={<div class="loading loading-spinner"></div>}>
        <button onClick={handleAction}>Action</button>
      </Show>
    </div>
  );
};

export default MyComponent;
```

**Key Patterns:**
- Use `Component<Props>` type annotation
- Props are read-only (accessed via `props.propName`)
- Use `createSignal` for local state
- Use `Show` for conditional rendering
- Use `createResource` for async data fetching
- Avoid destructuring props (breaks reactivity)
- Always include proper TypeScript types

### Page Components

Page components are top-level route components that:
- Live in `src/pages/`
- Use `default export`
- Integrate with context providers (Auth, Toast)
- Handle loading states
- Fetch data on mount

```typescript
const Dashboard: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const toast = useToast();

  const handleRefresh = async () => {
    await refetch();
    toast.showToast('Data refreshed', 'success');
  };

  return (
    <div class="p-6">
      <Show when={data()} fallback={<LoadingSpinner />}>
        {/* Content */}
      </Show>
    </div>
  );
};
```

### Modal Components

Modals use `Portal` from `solid-js/web` and follow this pattern:

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const MyModal: Component<ModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await props.onSave(/* data */);
      props.onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="modal modal-open">
          <div class="modal-box">
            {/* Content */}
            <button onClick={props.onClose}>Cancel</button>
            <button onClick={handleSave} disabled={loading()}>Save</button>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
```

### Form Handling

Forms follow this pattern:

```typescript
const MyForm: Component = () => {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name(), email: email() })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      // Success handling
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <Show when={error()}>
        <div class="alert alert-error">{error()}</div>
      </Show>
      {/* Form fields */}
    </form>
  );
};
```

### Styling Conventions

- **Tailwind CSS 4** for all utilities
- **DaisyUI 5** for component themes
- Use semantic class names (not color values)
- Mobile-first responsive design

```typescript
// ✅ Good: Semantic and mobile-first
<div class="p-4 md:p-8 lg:p-12">
  <h1 class="text-2xl md:text-4xl font-black">Title</h1>
</div>

// ❌ Bad: Color-specific and not responsive
<div style="padding: 20px; color: red;">
  <h1 style="font-size: 32px;">Title</h1>
</div>
```

---

## Backend Patterns

### API Route Structure

All API routes follow this pattern in `src/api/router.ts`:

```typescript
router.post('/api/endpoint', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate input
    const { field1, field2 } = req.body;
    if (!field1 || !field2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process request
    const result = await Model.findByIdAndUpdate(
      id,
      { field1, field2 },
      { new: true }
    ).setOptions({ userId });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Key Patterns:**
- Always check authentication first
- Always validate input before processing
- Use `.setOptions({ userId })` for multi-tenancy
- Return consistent error format: `{ error: "message" }`
- Use appropriate HTTP status codes
- Log errors but don't expose internals

### Controller Pattern

Controllers in `src/api/controllers/` encapsulate business logic:

```typescript
export async function fetchUserData(userId: string) {
  const meters = await Meter.find({}).setOptions({ userId });
  const readings = await Reading.find({}).setOptions({ userId });
  
  return {
    meters: meters.map(m => ({
      id: m._id.toString(),
      name: m.name,
      type: m.type
    })),
    readings: readings.map(r => ({
      meterId: r.meterId.toString(),
      value: r.value,
      date: r.date.toISOString()
    }))
  };
}
```

**Benefits:**
- Separates business logic from HTTP handling
- Reusable across routes
- Easier to test
- Cleaner route definitions

### Mongoose Schema Pattern

All schemas use consistent patterns:

```typescript
import { Schema, model, Document } from 'mongoose';
import { applyPreFilter } from './sessionFilter';

interface IReading extends Document {
  meterId: Schema.Types.ObjectId;
  value: number;
  date: Date;
  userId: Schema.Types.ObjectId;
  createdAt?: Date;
}

const readingSchema = new Schema<IReading>(
  {
    meterId: { type: Schema.Types.ObjectId, ref: 'Meter', required: true },
    value: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Multi-tenancy isolation
readingSchema.index({ meterId: 1, date: 1, userId: 1 }, { unique: true });
applyPreFilter(readingSchema);

export default model<IReading>('Reading', readingSchema);
```

**Key Patterns:**
- Document interfaces extend `Document`
- All models have `userId` field
- Use `applyPreFilter` middleware for multi-tenancy
- Meaningful indexes for query performance
- Timestamps for audit trail

### Input Validation Pattern

Use Zod for schema validation:

```typescript
import { z } from 'zod';

export const readingSchema = z.object({
  meterId: z.string().min(1, 'Meter ID is required'),
  value: z.number().nonnegative('Value must be non-negative'),
  date: z.string().datetime('Invalid date format')
});

export const bulkReadingSchema = z.array(readingSchema);

// In route handler
try {
  const validated = readingSchema.parse(req.body);
  // Process validated data
} catch (err) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: err.errors[0].message });
  }
}
```

---

## Data Flow

### Frontend to Backend

```
User Action
    ↓
Component Event Handler
    ↓
API Fetch (POST/GET/PATCH/DELETE)
    ↓
Route Handler (Authentication)
    ↓
Input Validation (Zod)
    ↓
Business Logic (Controller)
    ↓
Database Query (Mongoose)
    ↓
Response (JSON)
    ↓
Component State Update
    ↓
UI Re-render
```

### Example: Import Workflow

```
User clicks "Import"
    ↓
UnifiedImportModal opens
    ↓
User selects/pastes file
    ↓
Component detects format (JSON/CSV)
    ↓
Parser validates structure
    ↓
Preview shown to user
    ↓
User confirms import
    ↓
POST /api/readings/bulk
    ↓
Server validates readings
    ↓
Readings stored in database
    ↓
Response with success count
    ↓
Toast notification shown
    ↓
Modal closes
```

---

## Testing Patterns

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something when input is valid', () => {
    const result = myFunction({ valid: true });
    expect(result).toBe(expectedValue);
  });

  it('should throw error when input is invalid', () => {
    expect(() => myFunction({ invalid: true })).toThrow();
  });
});
```

### Integration Tests (Database)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('User Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await disconnect();
    await mongoServer.stop();
  });

  it('should create and retrieve a user', async () => {
    const user = await User.create({ email: 'test@example.com', ... });
    expect(user._id).toBeDefined();

    const found = await User.findById(user._id);
    expect(found?.email).toBe('test@example.com');
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render title', () => {
    render(() => <MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onClick handler', async () => {
    const handler = vi.fn();
    render(() => <MyComponent onClick={handler} />);
    
    const button = screen.getByRole('button');
    await button.click();
    
    expect(handler).toHaveBeenCalled();
  });
});
```

### Test Organization

- Filename: `*.test.ts` or `*.test.tsx`
- Location: Adjacent to source file or in `__tests__/` directory
- One `describe` per unit/component
- Clear test names describing behavior
- Use AAA pattern: Arrange, Act, Assert

---

## Security Patterns

### Multi-Tenancy Isolation

Every database query must be isolated by `userId`:

```typescript
// ✅ Correct: User isolation applied
const readings = await Reading.find({ meterId }).setOptions({ userId });

// ❌ Wrong: Missing user isolation
const readings = await Reading.find({ meterId });

// ✅ Correct: Using middleware to enforce isolation
applyPreFilter(schema);
```

### Authentication Check

Every protected route must verify user:

```typescript
router.get('/api/protected', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Proceed with userId
});
```

### Input Sanitization

Use Zod for validation:

```typescript
const userInput = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  amount: z.number().positive()
});

const validated = userInput.parse(req.body);
```

---

## Error Handling

### Frontend Error Handling

```typescript
try {
  const res = await fetch('/api/endpoint', { method: 'POST', ... });
  const data = await res.json();

  if (!res.ok) {
    toast.showToast(data.error || 'Operation failed', 'error');
    return;
  }

  toast.showToast('Success!', 'success');
} catch (err) {
  console.error(err);
  toast.showToast('Network error', 'error');
}
```

### Backend Error Handling

```typescript
router.post('/api/endpoint', async (req, res) => {
  try {
    // Validation
    if (!req.body.field) {
      return res.status(400).json({ error: 'Field is required' });
    }

    // Authentication
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Business logic
    const result = await Model.create(/* ... */);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Consistent Error Format

All errors return this format:

```json
{ "error": "Human-readable error message" }
```

Never expose:
- Stack traces
- Database details
- Internal implementation details
- File paths

---

## State Management

### Local Component State

Use `createSignal` for component-level state:

```typescript
const [formData, setFormData] = createSignal({ name: '', email: '' });

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Context Providers

Use context for app-wide state:

```typescript
// AuthContext
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Usage in component
const auth = useAuth();
const user = auth.user();
```

### Resource Pattern

Use `createResource` for async data:

```typescript
const [data, { refetch, mutate }] = createResource(
  () => params(),
  fetchData
);

return (
  <Show when={data()} fallback={<Loading />}>
    {(data) => <Content data={data()} />}
  </Show>
);
```

---

## Naming Conventions

### Files

- **Components**: `PascalCase` (e.g., `UserProfile.tsx`)
- **Pages**: `PascalCase` (e.g., `Dashboard.tsx`)
- **Utilities**: `camelCase` (e.g., `numberUtils.ts`)
- **Models**: `PascalCase` (e.g., `User.ts`)
- **Tests**: `*.test.ts` or `*.test.tsx`

### Variables & Functions

- **Variables**: `camelCase` (e.g., `userData`, `isLoading`)
- **Functions**: `camelCase` (e.g., `fetchData()`, `handleClick()`)
- **Constants**: `CONSTANT_CASE` (e.g., `API_TIMEOUT`)
- **Event handlers**: `handle*` (e.g., `handleClick`, `handleSubmit`)
- **Async operations**: `fetch*` or `get*` (e.g., `fetchMeters()`)

### Types & Interfaces

- **Interfaces**: `PascalCase` (e.g., `User`, `Meter`)
- **Type aliases**: `PascalCase` (e.g., `FileFormat`)
- **Generic types**: `T`, `U` (e.g., `<T extends Model>`)

---

## Code Organization

### Directory Structure

```
src/
├── api/
│   ├── controllers/        # Business logic
│   ├── __tests__/          # API tests
│   ├── handler.ts          # Main API entry
│   ├── router.ts           # Route definitions
│   ├── validation.ts       # Zod schemas
│   └── utils.ts            # API utilities
├── components/             # Reusable components
├── context/                # Context providers
├── lib/                    # Utility functions
├── models/                 # Mongoose schemas
├── pages/                  # Route components
├── types/                  # Global types
└── index.tsx              # App entry point
```

### Import Ordering

```typescript
// 1. Standard library / framework
import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';

// 2. Third-party packages
import { z } from 'zod';

// 3. Internal: Context & Hooks
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// 4. Internal: Components
import MyComponent from '../components/MyComponent';

// 5. Internal: Utilities & Types
import { calculateTotal } from '../lib/calculations';
import type { User } from '../types/models';
```

---

## Summary

This style guide ensures:
- **Consistency** across the codebase
- **Readability** for new developers
- **Maintainability** long-term
- **Security** through proven patterns
- **Performance** via best practices

When in doubt, follow the existing code patterns in the codebase.
