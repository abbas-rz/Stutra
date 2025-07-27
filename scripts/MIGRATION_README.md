# Section Migration Script

This script migrates student data from CSV files in the `csv_output` directory to the Firebase Realtime Database.

## Features

- ✅ Migrates all Grade XI sections from CSV files
- ✅ Skips Raman section (already in database)
- ✅ Handles duplicate students and conflicts
- ✅ Consistent section naming (XI Amartya, XI Curie, etc.)
- ✅ Batch processing for better performance
- ✅ Comprehensive error handling and logging

## Prerequisites

1. **Python 3.7+** installed
2. **Firebase Database URL** configured
3. **CSV files** in the `csv_output` directory

## Setup

1. **Environment Configuration**
   Create a `.env` file in the project root with:
   ```
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
   ```

2. **Install Dependencies**
   ```bash
   pip install requests python-dotenv
   ```

## Usage

### Option 1: Using Batch Script (Windows)
```bash
migrate_sections.bat
```

### Option 2: Using Python Directly
```bash
python scripts/migrate_sections_enhanced.py
```

### Option 3: Basic Migration Script
```bash
python scripts/migrate_sections.py
```

## CSV File Format

The script expects CSV files with the following format:
```csv
S.NO,A.NO.,Name
1,6821,AADIKK RAJ GHAI
2,5892,AARAV ARORA
...
```

## Section Mapping

CSV files are mapped to sections as follows:
- `Amartya 32.csv` → `XI Amartya`
- `Curie 30.csv` → `XI Curie`
- `Hawking 31.csv` → `XI Hawking`
- etc.

## What Gets Migrated

For each student:
- **ID**: Admission number as unique identifier
- **Name**: Student name (properly formatted)
- **Admission Number**: Original admission number
- **Section**: Grade XI + section name
- **Status**: Default to 'absent'
- **Other fields**: Empty/default values

## Conflict Handling

The script checks for existing students by:
- Student ID (admission number)
- Admission number

If conflicts are found, you can choose to:
- Continue with non-conflicting students only
- Cancel the migration

## Database Structure

Students are stored at:
```
/students/{student_id}
```

Sections metadata is stored at:
```
/sections/{section_key}
```

## Safety Features

- ✅ Dry-run capability (checks conflicts before uploading)
- ✅ Batch processing to avoid overwhelming the database
- ✅ Detailed logging of all operations
- ✅ Rollback-friendly (students can be manually removed if needed)

## Troubleshooting

### Common Issues

1. **"Firebase URL is required"**
   - Ensure `.env` file exists with correct `VITE_FIREBASE_DATABASE_URL`

2. **"No CSV files found"**
   - Check that CSV files are in the `csv_output` directory
   - Ensure files have `.csv` extension

3. **Network errors**
   - Check internet connection
   - Verify Firebase database URL is correct and accessible

4. **Permission errors**
   - Ensure Firebase database has write permissions
   - Check if authentication is required

### Logs and Debugging

The script provides detailed output including:
- Files being processed
- Number of students found
- Conflicts detected
- Upload progress
- Final summary

## Post-Migration

After successful migration:
1. Verify data in Firebase console
2. Test the application with new sections
3. Update any hardcoded section lists in the frontend
4. Consider backing up the database

## Reverting Changes

If you need to revert:
1. Use Firebase console to delete uploaded students
2. Or use the database backup created before migration
3. Remove section metadata from `/sections/`
