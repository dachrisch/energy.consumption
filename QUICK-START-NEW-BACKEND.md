# Quick Start: Testing New Backend

## TL;DR - Enable New Backend Now

```bash
# 1. Enable all feature flags
npm run flags:enable-all

# 2. Restart your dev server
npm run dev

# 3. Add data (forms or CSV)
# ✅ Now goes to SourceEnergyReading collection
# ✅ Display data cached in DisplayEnergyData collection
# ✅ Events emitted automatically
```

---

## Why No Data in New Collections?

**Answer**: Feature flags are OFF by default (zero user impact until explicitly enabled)

Check current status:
```bash
npm run flags:status
```

If you see `❌ OFF`, that's why no data in new collections!

---

## Commands

### Feature Flags
```bash
npm run flags:enable-all        # Enable all flags
npm run flags:enable-forms      # Forms only
npm run flags:enable-csv        # CSV import only
npm run flags:status            # Check current status
npm run flags:disable-all       # Rollback to old backend
```

### Database Inspection
```bash
npm run db:dump                 # Summary + flag status
npm run db:dump:source          # SourceEnergyReading collection
npm run db:dump:display         # DisplayEnergyData collection
npm run db:dump:old             # Energy collection (old)
npm run db:dump:all             # All collections (detailed)
```

---

## Verify It's Working

### 1. Enable Flags
```bash
npm run flags:enable-all
```

Expected output:
```
🚀 Enabling ALL new backend flags...
✅ All flags enabled (100% rollout)

📝 Next steps:
   1. Restart your Next.js dev server
   2. Add new energy data via forms or CSV import
   3. Check MongoDB collections:
      - SourceEnergyReading (new source data)
      - DisplayEnergyData (cached display data)
```

### 2. Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Add Data
- Go to http://localhost:3100/add
- Submit a new reading
- Or import CSV

### 4. Check MongoDB Collections

**Quick Summary** (recommended):
```bash
npm run db:dump
```

Shows collection counts and feature flag status.

**Dump Specific Collections**:
```bash
npm run db:dump:source    # SourceEnergyReading (new backend)
npm run db:dump:display   # DisplayEnergyData (cache)
npm run db:dump:old       # Energy (old backend)
npm run db:dump:all       # All collections
```

**With MongoDB Shell**:
```bash
mongosh mongodb://localhost:27017/energy_consumption

# Should have data (new backend)
db.sourceenergyreadings.find().pretty()
db.displayenergydata.find().pretty()

# Should be empty for new data (old backend not used)
db.energies.find().pretty()
```

**With MongoDB Compass**:
- Connect to `mongodb://localhost:27017`
- Database: `energy_consumption`
- Collections to check:
  - ✅ `sourceenergyreadings` (should have new data)
  - ✅ `displayenergydata` (should have cached data)
  - ⚠️  `energies` (empty for new data when flags ON)

---

## Rollback Instantly

If anything goes wrong:

```bash
npm run flags:disable-all
npm run dev  # Restart server
```

Now all data goes back to old `energies` collection.

---

## Performance Comparison

| Operation | Old Backend | New Backend | Speedup |
|-----------|-------------|-------------|---------|
| CSV Import (100 records) | 8-15s | 0.5-1s | **10-30x** |
| Display Data (cached) | 500-1500ms | 10-50ms | **10-50x** |

---

## Troubleshooting

### "Still no data in new collections"

**Check 1**: Are flags ON?
```bash
npm run flags:status
```

**Check 2**: Did you restart server?
```bash
# Must restart after enabling flags!
npm run dev
```

**Check 3**: MongoDB running?
```bash
# Check if MongoDB is accessible
mongosh --eval "db.version()"
```

### "Script errors"

**Error**: `MongoNotConnectedError`
**Fix**: Make sure MongoDB is running on `localhost:27017`

**Error**: `Cannot find module 'mongoose'`
**Fix**: `npm install` (dependencies missing)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         FEATURE FLAGS (OFF by default)      │
├─────────────────────────────────────────────┤
│  FORM_NEW_BACKEND           = OFF (0%)      │
│  CSV_IMPORT_NEW_BACKEND     = OFF (0%)      │
│  DASHBOARD_NEW_BACKEND      = OFF (0%)      │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Flags OFF              Flags ON
        │                       │
        ▼                       ▼
 ┌─────────────┐       ┌──────────────────┐
 │   energies  │       │ sourceenergy     │
 │ collection  │       │ readings         │
 │  (old)      │       │ collection (new) │
 └─────────────┘       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ displayenergy    │
                       │ data collection  │
                       │ (cache)          │
                       └──────────────────┘
```

---

## What Happens When Flags ON

1. **Form Submit** → `SourceEnergyReading` collection
2. **Event Emitted** → `ENERGY_READING_CREATED`
3. **Event Handler** → Invalidates cache in `DisplayEnergyData`
4. **Dashboard Load** → Recalculates and caches data
5. **Result** → 10-50x faster subsequent loads

---

## Next Steps

1. ✅ Enable flags: `npm run flags:enable-all`
2. ✅ Restart server: `npm run dev`
3. ✅ Add test data
4. ✅ Verify collections in MongoDB
5. ✅ Test performance (CSV import, dashboard load)
6. ✅ Document any issues
7. ✅ Gradual rollout when validated

---

## Full Documentation

- **Testing Guide**: `docs/testing/TESTING-NEW-BACKEND.md`
- **Phase 2 Summary**: `docs/architecture/PHASE2-IMPLEMENTATION-SUMMARY.md`
- **Integration Tests**: `docs/testing/PHASE2-INTEGRATION-TESTS.md`

---

**Questions?** Check the full testing guide or Phase 2 documentation.
