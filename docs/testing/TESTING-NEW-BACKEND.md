# Testing the New Backend (Phase 2)

## Quick Start

The new backend is **disabled by default**. To test it, you need to enable feature flags.

### **Enable All Flags** (Recommended for Testing)

```bash
npm run flags:enable-all
```

This enables:
- ✅ Form submissions → SourceEnergyReading collection
- ✅ CSV imports → Bulk operations (10-100x faster)
- ✅ Display data → Cached in DisplayEnergyData collection
- ✅ Automatic cache invalidation via events

### **Check Current Status**

```bash
npm run flags:status
```

Example output:
```
📋 Current feature flag status:

Flag Name                          Status    Rollout
────────────────────────────────────────────────────────────
NEW_BACKEND_ENABLED                ✅ ON     100%
DASHBOARD_NEW_BACKEND              ✅ ON     100%
CHARTS_NEW_BACKEND                 ✅ ON     100%
TIMELINE_NEW_BACKEND               ✅ ON     100%
CSV_IMPORT_NEW_BACKEND             ✅ ON     100%
FORM_NEW_BACKEND                   ✅ ON     100%
```

### **Disable All Flags** (Rollback)

```bash
npm run flags:disable-all
```

---

## Testing Workflow

### 1. Enable Flags

```bash
npm run flags:enable-all
```

### 2. Restart Dev Server

**Important**: Restart your Next.js dev server after changing flags.

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Add Data

Use any of these methods:
- **Form**: Go to `/add` and submit a new reading
- **CSV Import**: Upload a CSV file with multiple readings
- **API**: POST to `/api/v2/energy`

### 4. Verify Data in MongoDB

Check these collections:

**Source Data** (New):
```javascript
db.sourceenergyreadings.find().pretty()
```

**Display Cache** (New):
```javascript
db.displayenergydata.find().pretty()
```

**Old Data** (Legacy):
```javascript
db.energies.find().pretty()  // Should be empty when flags ON
```

---

## Testing Scenarios

### Scenario 1: Form Submission

```bash
# Enable form flag only
npm run flags:enable-forms

# Restart server
npm run dev

# Go to /add, submit a reading
# Check: SourceEnergyReading collection has the data
```

### Scenario 2: CSV Import Performance

```bash
# Enable CSV flag
npm run flags:enable-csv

# Import 100+ readings via CSV
# Observe: 10-100x faster than old backend
# Check: All data in SourceEnergyReading collection
```

### Scenario 3: Automatic Cache Invalidation

```bash
# Enable all flags
npm run flags:enable-all

# 1. Add initial reading
# 2. View dashboard (cache created in DisplayEnergyData)
# 3. Add another reading
# 4. Check: DisplayEnergyData cache invalidated
# 5. View dashboard again (cache recreated with new data)
```

### Scenario 4: Rollback Test

```bash
# 1. Enable flags, add data to SourceEnergyReading
npm run flags:enable-all
# Add some data...

# 2. Disable flags (instant rollback)
npm run flags:disable-all

# 3. Add more data
# Check: New data goes to old Energy collection
# Check: Old data in SourceEnergyReading still intact
```

---

## MongoDB Collection Comparison

| Collection | Used When | Purpose | Performance |
|------------|-----------|---------|-------------|
| **energies** | Flags OFF | Legacy source data | Baseline |
| **sourceenergyreadings** | Flags ON | New source data | 10-100x faster bulk |
| **displayenergydata** | Flags ON | Pre-calculated cache | 5-10x faster reads |

---

## Command Reference

### NPM Scripts

```bash
# Enable specific component
npm run flags:enable-forms      # Forms only
npm run flags:enable-csv        # CSV import only

# Enable all
npm run flags:enable-all

# Disable all (rollback)
npm run flags:disable-all

# Check status
npm run flags:status
```

### Direct Script Usage

```bash
# All options
node scripts/enable-new-backend.js --all
node scripts/enable-new-backend.js --forms
node scripts/enable-new-backend.js --csv
node scripts/enable-new-backend.js --dashboard
node scripts/enable-new-backend.js --charts
node scripts/enable-new-backend.js --disable-all
node scripts/enable-new-backend.js --status
node scripts/enable-new-backend.js --help
```

---

## Expected Behavior

### With Flags OFF (Default)

✅ **Current Behavior** (Backward Compatible):
- Data goes to `energies` collection
- No events emitted
- No display data cache
- Standard performance

### With Flags ON

✅ **New Behavior** (Phase 2):
- Data goes to `sourceenergyreadings` collection
- Events emitted (CREATED, UPDATED, DELETED, BULK_IMPORTED)
- Display data cached in `displayenergydata` collection
- Automatic cache invalidation on data changes
- 10-100x performance improvement for bulk operations
- 5-10x performance improvement for display data

---

## Troubleshooting

### "No data in SourceEnergyReading collection"

**Cause**: Feature flags are OFF (default behavior)

**Solution**:
```bash
npm run flags:status        # Check current state
npm run flags:enable-all    # Enable flags
# Restart dev server
npm run dev
```

### "Cache not invalidating"

**Cause**: Event handlers not initialized

**Solution**:
```bash
# Check server logs for:
# [ServerInit] ✅ Event handlers registered

# If not present, restart server
npm run dev
```

### "Flag changes not taking effect"

**Cause**: Server not restarted after flag change

**Solution**:
```bash
# Always restart after changing flags
npm run dev
```

---

## Performance Benchmarks

Based on integration tests:

| Operation | Old Backend | New Backend | Speedup |
|-----------|-------------|-------------|---------|
| CSV Import (100 records) | 8-15 seconds | 0.5-1 seconds | **10-30x** |
| CSV Import (1000 records) | 80-150 seconds | 1-2 seconds | **50-100x** |
| Display Data (cache hit) | 500-1500ms | 10-50ms | **10-50x** |
| Display Data (cache miss) | 500-1500ms | 500-1500ms | Same (initial) |

---

## Data Integrity

Both backends can coexist safely:

- Old data in `energies` collection remains intact
- New data in `sourceenergyreadings` when flags ON
- No data loss during migration
- Instant rollback capability
- Both collections readable simultaneously

---

## Next Steps After Testing

1. **Internal Testing**: Enable flags, test all features
2. **Validation**: Verify data integrity, performance improvements
3. **Gradual Rollout**: Enable for 10% → 50% → 100% of users
4. **Monitoring**: Track performance metrics, error rates
5. **Full Migration**: Once validated, keep flags ON permanently

---

## Related Documentation

- [Phase 2 Implementation Summary](../architecture/PHASE2-IMPLEMENTATION-SUMMARY.md)
- [Phase 2 Integration Tests](./PHASE2-INTEGRATION-TESTS.md)
- [Collection Routing Tests](../../src/__tests__/integration/collection-routing.test.ts)
- [Backend-First Migration Strategy](../architecture/backend-first-migration-strategy.md)

---

**Last Updated**: 2025-11-19
**Phase**: Phase 2 - Frontend Adapter Layer
**Status**: Ready for Testing
