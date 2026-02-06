# Import/Export Feature Documentation

## Overview

The Import/Export feature provides users with the ability to backup, share, and restore their energy consumption data in JSON format. This feature includes:

- **Export capabilities** for full backups, all readings, and individual meters
- **Import capabilities** with unified modal interface and format validation
- **Preview functionality** before importing data
- **Multi-format support** for both nested and flat JSON structures
- **Full multi-tenancy support** ensuring data isolation per user

The feature is designed to be user-friendly while maintaining strict security boundaries across all operations.

## Export Features

### Full Backup Export

**Location in UI:** Dashboard → Export menu → "Full Backup"

**Description:** Exports the complete account data including all meters, readings, and configuration settings.

**Contents:**
- All meter definitions (name, location, serial number, readings, pricing model)
- All consumption readings with timestamps
- User preferences and settings

**File naming:** `meters_backup_YYYY-MM-DD.json`

**API Endpoint:** `POST /api/export/full-backup`

**Response:** 
- Status: 200 OK
- Body: JSON file with complete account data

### All Readings Export

**Location in UI:** Dashboard → Export menu → "Export All Readings"

**Description:** Exports all consumption readings across all meters without meter definitions.

**Contents:**
- All readings with timestamps
- Associated meter IDs
- Consumption values and units

**File naming:** `readings_export_YYYY-MM-DD.json`

**API Endpoint:** `POST /api/export/all-readings`

**Response:**
- Status: 200 OK
- Body: JSON array of reading objects

### Single Meter Export

**Location in UI:** Meter detail view → Export button

**Description:** Exports a single meter's definition and its associated readings.

**Contents:**
- Meter definition (name, location, serial number, pricing model)
- All readings for that specific meter

**File naming:** `{meter-name}_YYYY-MM-DD.json`

**API Endpoint:** `POST /api/export/meter/:meterId`

**Parameters:**
- `meterId`: The ID of the meter to export

**Response:**
- Status: 200 OK
- Body: JSON object containing meter and its readings

## Import Features

### Unified Import Modal

**Location in UI:** Dashboard → Import button

**Description:** Single entry point for importing all types of JSON data (full backups, readings, or meter definitions).

**Features:**
- File upload with drag-and-drop support
- Automatic format detection
- Preview of data before import
- Validation with detailed error messages
- Options to merge with existing data or replace

### Format Support

The import feature supports multiple JSON formats:

#### Nested Format (Full Backup)
```json
{
  "meters": [
    {
      "id": "meter-001",
      "name": "Kitchen Meter",
      "location": "Kitchen",
      "serialNumber": "SN12345",
      "pricingModel": "tiered",
      "readings": [
        {
          "timestamp": "2024-01-15T10:30:00Z",
          "value": 15.5,
          "unit": "kWh"
        }
      ]
    }
  ]
}
```

#### Flat Format (Readings Only)
```json
{
  "readings": [
    {
      "meterId": "meter-001",
      "timestamp": "2024-01-15T10:30:00Z",
      "value": 15.5,
      "unit": "kWh"
    }
  ]
}
```

#### Meter Definition Format
```json
{
  "meters": [
    {
      "name": "Living Room Meter",
      "location": "Living Room",
      "serialNumber": "SN67890",
      "pricingModel": "flat",
      "costPerUnit": 0.15
    }
  ]
}
```

### Import Preview

**Features:**
- Display of data to be imported (count of meters, readings, etc.)
- Validation results
- Warnings for potential conflicts (e.g., duplicate serial numbers)
- Option to proceed or cancel

**Validation Checks:**
- Valid JSON format
- Required fields present
- Data type validation
- Timestamp format validation
- Meter ID/serial number uniqueness checks

## API Endpoints

### Export Endpoints

#### POST /api/export/full-backup
Exports complete account backup including all meters and readings.

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Response:**
```json
{
  "meters": [
    {
      "id": "meter-001",
      "name": "Kitchen Meter",
      "location": "Kitchen",
      "serialNumber": "SN12345",
      "pricingModel": "tiered",
      "readings": [...]
    }
  ]
}
```

#### POST /api/export/all-readings
Exports all readings across all meters.

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Response:**
```json
{
  "readings": [
    {
      "meterId": "meter-001",
      "timestamp": "2024-01-15T10:30:00Z",
      "value": 15.5,
      "unit": "kWh"
    }
  ]
}
```

#### POST /api/export/meter/:meterId
Exports a single meter with its readings.

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**URL Parameters:**
- `meterId`: String - The ID of the meter to export

**Response:**
```json
{
  "meter": {
    "id": "meter-001",
    "name": "Kitchen Meter",
    "location": "Kitchen",
    "serialNumber": "SN12345",
    "pricingModel": "tiered",
    "readings": [...]
  }
}
```

### Import Endpoints

#### POST /api/import
Imports data from uploaded JSON file.

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body:**
- `file`: File - JSON file to import

**Query Parameters:**
- `merge`: Boolean (optional, default: true) - If true, merge with existing data; if false, replace existing data
- `preview`: Boolean (optional, default: false) - If true, return preview without actually importing

**Response (Preview Mode):**
```json
{
  "preview": true,
  "summary": {
    "metersToCreate": 2,
    "metersToUpdate": 1,
    "readingsToCreate": 150,
    "conflicts": [
      {
        "type": "duplicate_serial_number",
        "serialNumber": "SN12345",
        "existingMeter": "meter-001"
      }
    ]
  }
}
```

**Response (Import Mode):**
```json
{
  "success": true,
  "summary": {
    "metersCreated": 2,
    "metersUpdated": 1,
    "readingsCreated": 150,
    "errors": []
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid JSON format",
  "details": [
    "Field 'timestamp' is required in reading at index 0"
  ]
}
```

## Security

### Multi-Tenancy Isolation

All import and export operations are strictly isolated by user ID:

1. **Export Operations:**
   - All queries use `.setOptions({ userId })` to ensure only the authenticated user's data is exported
   - User authentication is verified via JWT token in Authorization header
   - Data cannot be accessed by other users even with direct API calls

2. **Import Operations:**
   - All imported data is automatically associated with the authenticated user's ID
   - Meters and readings are tagged with the importing user's ID in the database
   - Users can only import data into their own account

3. **Database Security:**
   - Mongoose pre-filters ensure userId isolation on all queries
   - The `applyPreFilter` middleware from `src/models/sessionFilter.ts` is applied to all models
   - Direct database access without proper user context is prevented

### Data Validation

- **Input Sanitization:** All JSON input is validated against schema before processing
- **Type Checking:** TypeScript strict mode prevents type-related security issues
- **NoSQL Injection Prevention:** Input sanitization prevents injection attacks
- **File Upload Security:** File size limits and format validation prevent abuse

### Best Practices for Users

- **Backup Security:** Store exported JSON files securely (encrypted storage, secure cloud)
- **Sensitive Data:** Exported files contain energy consumption data - treat as sensitive
- **File Sharing:** Do not share exported JSON files with untrusted parties
- **Import Source:** Only import JSON files from trusted sources
- **Verification:** Always preview imported data before confirming the import

## Examples

### Example 1: Export and Backup Workflow

1. User navigates to Dashboard
2. Clicks "Export" menu
3. Selects "Full Backup"
4. File `meters_backup_2024-01-15.json` is downloaded
5. User stores file in secure location for disaster recovery

### Example 2: Import Readings from Another Account

1. User exports readings from their other account
2. Downloads `readings_export_2024-01-15.json`
3. Navigates to new account
4. Clicks "Import" button
5. Selects the JSON file
6. Reviews preview of 150 readings to be imported
7. Confirms import
8. Readings are merged into the new account

### Example 3: Transfer Meter Between Accounts

1. User in Account A exports a single meter: `Kitchen_Meter_2024-01-15.json`
2. User in Account B uploads the file using Import modal
3. Preview shows 1 new meter and 50 readings
4. User confirms import
5. Meter and readings are now in Account B, associated with their user ID

### Example 4: Data Migration After System Reset

1. User previously exported full backup: `meters_backup_2024-01-10.json`
2. After system reset, user restores by:
   - Clicking "Import"
   - Uploading the backup file
   - Selecting "Replace" mode (to overwrite empty database)
   - Confirming the import
3. All meters and readings are restored

## JSON Format Examples

### Complete Full Backup Format

```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00Z",
    "version": "1.0",
    "format": "full-backup"
  },
  "meters": [
    {
      "id": "meter-001",
      "name": "Kitchen Meter",
      "location": "Kitchen",
      "serialNumber": "SN12345",
      "pricingModel": "tiered",
      "costPerUnit": 0.12,
      "createdAt": "2023-12-01T00:00:00Z",
      "readings": [
        {
          "timestamp": "2024-01-01T10:30:00Z",
          "value": 12.5,
          "unit": "kWh"
        },
        {
          "timestamp": "2024-01-02T10:30:00Z",
          "value": 14.2,
          "unit": "kWh"
        }
      ]
    },
    {
      "id": "meter-002",
      "name": "Living Room Meter",
      "location": "Living Room",
      "serialNumber": "SN67890",
      "pricingModel": "flat",
      "costPerUnit": 0.15,
      "createdAt": "2023-12-15T00:00:00Z",
      "readings": [
        {
          "timestamp": "2024-01-01T10:30:00Z",
          "value": 8.3,
          "unit": "kWh"
        }
      ]
    }
  ]
}
```

### Readings-Only Export Format

```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00Z",
    "version": "1.0",
    "format": "readings-only"
  },
  "readings": [
    {
      "meterId": "meter-001",
      "timestamp": "2024-01-01T10:30:00Z",
      "value": 12.5,
      "unit": "kWh"
    },
    {
      "meterId": "meter-001",
      "timestamp": "2024-01-02T10:30:00Z",
      "value": 14.2,
      "unit": "kWh"
    },
    {
      "meterId": "meter-002",
      "timestamp": "2024-01-01T10:30:00Z",
      "value": 8.3,
      "unit": "kWh"
    }
  ]
}
```

## Backwards Compatibility

### Version 1.0 (Current)

The current implementation supports importing and exporting JSON files in the formats specified in this document.

### Future Compatibility Notes

- All exported JSON files include a `version` field in metadata
- The import endpoint will use this version field to handle older formats
- Breaking changes to the JSON schema will increment the major version number
- Minor updates (additional optional fields) will increment the minor version
- The system will maintain compatibility with at least the previous major version

## Troubleshooting

### Import Fails with "Invalid JSON Format"

**Cause:** The file is not valid JSON.

**Solution:**
1. Open the JSON file in a text editor
2. Check for syntax errors (missing quotes, trailing commas, etc.)
3. Use an online JSON validator (jsonlint.com) to identify issues
4. Correct the file and try importing again

### Import Shows Conflicts with Existing Meters

**Cause:** Meters with the same serial numbers already exist in the account.

**Solution:**
1. Review the preview to identify the conflicting serial numbers
2. Either:
   - Update the serial numbers in the JSON file to be unique
   - Delete the existing meters before importing
   - Choose to update/merge existing meters with the imported data

### Export Returns "Unauthorized"

**Cause:** Authentication token is invalid or expired.

**Solution:**
1. Log out and log in again
2. Refresh the page and try exporting again
3. Check that your session has not expired

### File Is Too Large

**Cause:** The JSON file contains too much data and exceeds size limits.

**Solution:**
1. Export readings in smaller time ranges
2. Export individual meters instead of full backup
3. Archive older readings before exporting
