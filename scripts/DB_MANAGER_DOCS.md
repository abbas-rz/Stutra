# Stutra Database Manager Documentation

## Overview

The Stutra Database Manager is a comprehensive command-line tool for managing the Firebase Realtime Database used by the Stutra attendance system. It provides functionality to manage students, teachers, sections, create backups, and perform data operations with full support for multi-section students and teacher access control.

## Features

### ✅ Multi-Section Support
- Students can belong to multiple sections simultaneously
- Synchronized data updates across all sections
- Backward compatibility with single-section data

### ✅ Teacher Access Control
- Teachers are restricted to students from their assigned sections
- Section-based filtering for enhanced security
- Role-based data access management

### ✅ Data Migration
- Seamless migration from single-section to multi-section format
- Pre-migration backups for data safety
- Data integrity validation post-migration

### ✅ Comprehensive Management
- Complete CRUD operations for students, teachers, and sections
- CSV import/export functionality
- Database backup and restore capabilities
- Detailed statistics and reporting

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- Required packages: `requests`, `python-dotenv`

### Environment Configuration
Create a `.env.local` file in the project root with your Firebase configuration:

```env
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
```

### Installation
```bash
cd scripts
pip install requests python-dotenv
```

## Command Reference

### Database Operations

#### Backup Database
```bash
# Create automatic backup with timestamp
python db_manager.py backup

# Create backup with custom filename
python db_manager.py backup --file my_backup.json
```

#### Restore Database
```bash
# Restore from backup (with confirmation prompt)
python db_manager.py restore backup_20250127.json

# Restore without confirmation prompt
python db_manager.py restore backup_20250127.json --confirm
```

#### Database Statistics
```bash
# Show comprehensive database statistics
python db_manager.py stats
```

### Migration Commands (One-time Setup)

#### Migrate to Multi-Section Format
```bash
# Convert existing single-section data to multi-section format
python db_manager.py migrate-to-multisection
```

#### Validate Data Integrity
```bash
# Verify data consistency after migration
python db_manager.py validate-data
```

### Section Management

#### Create Section
```bash
# Create a new section
python db_manager.py create-section --name "Physics Advanced"
python db_manager.py create-section --name "Mathematics XI-A"
```

#### List Sections
```bash
# Display all sections with teacher and student counts
python db_manager.py list-sections
```

### Student Management

#### Add Student (Multi-Section Support)
```bash
# Add student to single section
python db_manager.py add-student --name "John Doe" --admission "2024001" --sections "XI Raman"

# Add student to multiple sections
python db_manager.py add-student --name "Jane Smith" --admission "2024002" --sections "XI Raman,Math Advanced,Physics Lab"

# Add student with photo URL
python db_manager.py add-student --name "Mike Johnson" --admission "2024003" --sections "XI Raman" --photo "https://example.com/photo.jpg"
```

#### List Students
```bash
# List all students
python db_manager.py list-students

# List students from specific section
python db_manager.py list-students --section "XI Raman"
```

#### Remove Student
```bash
# Remove student by ID
python db_manager.py remove-student student123
```

### Teacher Management

#### Add Teacher
```bash
# Add teacher with section assignments
python db_manager.py add-teacher --email "teacher@school.com" --name "Dr. Smith" --sections "XI Raman,Math Advanced"

# Add teacher without initial section assignments
python db_manager.py add-teacher --email "newteacher@school.com" --name "Prof. Johnson"
```

#### List Teachers
```bash
# Display all teachers
python db_manager.py list-teachers
```

#### List Students for Teacher (Access Control)
```bash
# Show only students from teacher's assigned sections
python db_manager.py list-teacher-students --teacher teacherId123
```

#### Remove Teacher
```bash
# Remove teacher by ID
python db_manager.py remove-teacher teacher456
```

### Data Import/Export

#### Import Students from CSV
```bash
# Import students from CSV file
python db_manager.py import-students students.csv
```

**CSV Format:**
```csv
name,admission_number,section,photo_url
John Doe,2024001,XI Raman,https://example.com/john.jpg
Jane Smith,2024002,Math Advanced,https://example.com/jane.jpg
```

#### Export Students to CSV
```bash
# Export all students
python db_manager.py export-students all_students.csv

# Export students from specific section
python db_manager.py export-students section_students.csv --section "XI Raman"
```

## Data Structure

### Multi-Section Student Format
```json
{
  "students": {
    "studentId123": {
      "name": "John Doe",
      "admissionNumber": "2024001",
      "sections": ["XI Raman", "Math Advanced"],
      "photoUrl": "",
      "createdAt": "2025-07-27T10:00:00.000Z",
      "updatedAt": "2025-07-27T10:00:00.000Z"
    }
  }
}
```

### Section Structure
```json
{
  "sections": {
    "sectionId456": {
      "name": "XI Raman",
      "teachers": ["teacherId789"],
      "students": ["studentId123", "studentId124"],
      "createdAt": "2025-07-27T10:00:00.000Z",
      "updatedAt": "2025-07-27T10:00:00.000Z"
    }
  }
}
```

### Teacher Structure
```json
{
  "teachers": {
    "teacherId789": {
      "name": "Dr. Smith",
      "email": "smith@school.com",
      "assignedSections": ["sectionId456", "sectionId457"],
      "createdAt": "2025-07-27T10:00:00.000Z",
      "updatedAt": "2025-07-27T10:00:00.000Z"
    }
  }
}
```

## Migration Guide

### From Single-Section to Multi-Section

1. **Backup Current Data**
   ```bash
   python db_manager.py backup --file pre_migration_backup.json
   ```

2. **Run Migration**
   ```bash
   python db_manager.py migrate-to-multisection
   ```

3. **Validate Migration**
   ```bash
   python db_manager.py validate-data
   ```

4. **Verify Results**
   ```bash
   python db_manager.py stats
   ```

### Migration Process Details

The migration automatically:
- Creates pre-migration backup
- Converts single `section` field to `sections` array
- Creates section records for all existing sections
- Updates student records with new format
- Maintains backward compatibility
- Validates data integrity

## Usage Examples

### Complete Setup Workflow

```bash
# 1. Check current database state
python db_manager.py stats

# 2. Create backup before any changes
python db_manager.py backup

# 3. Migrate to multi-section format (one-time)
python db_manager.py migrate-to-multisection

# 4. Validate migration success
python db_manager.py validate-data

# 5. Create additional sections
python db_manager.py create-section --name "Physics Lab"
python db_manager.py create-section --name "Chemistry Lab"

# 6. Add teachers with section assignments
python db_manager.py add-teacher --email "physics@school.com" --name "Dr. Physics" --sections "Physics Lab,XI Raman"
python db_manager.py add-teacher --email "chemistry@school.com" --name "Dr. Chemistry" --sections "Chemistry Lab"

# 7. Add multi-section students
python db_manager.py add-student --name "Science Student" --admission "2024100" --sections "XI Raman,Physics Lab,Chemistry Lab"

# 8. Verify setup
python db_manager.py list-sections
python db_manager.py stats
```

### Teacher Access Control Example

```bash
# Teacher can only see students from their assigned sections
python db_manager.py list-teacher-students --teacher physicsteacher123

# This will only show students who are in sections assigned to this teacher
```

### Multi-Section Student Management

```bash
# Student in multiple sections - data is synchronized across all sections
python db_manager.py add-student --name "Multi Student" --admission "2024200" --sections "XI Raman,Math Advanced,Physics Lab"

# When student data is updated, changes appear in all sections automatically
# No data duplication - student record is linked, not copied
```

## Error Handling

### Common Issues and Solutions

#### 1. Environment Variables Not Found
```
❌ VITE_FIREBASE_DATABASE_URL environment variable not found!
```
**Solution:** Create `.env.local` file with correct Firebase URL

#### 2. Migration Already Completed
If migration was already run, the tool will skip already migrated students:
```
✅ Migration completed!
   - Migrated 0 students (already in new format)
   - Created 0 sections (already exist)
```

#### 3. Data Validation Issues
```
❌ Found 3 data integrity issues:
   - Student abc123 missing 'sections' field
```
**Solution:** Run migration again or manually fix data structure

#### 4. Network Connectivity Issues
```
❌ Database request failed: Connection timeout
```
**Solution:** Check internet connection and Firebase URL

## Best Practices

### 1. Always Backup Before Major Changes
```bash
python db_manager.py backup --file before_major_change.json
```

### 2. Validate After Migration
```bash
python db_manager.py migrate-to-multisection
python db_manager.py validate-data
```

### 3. Use Descriptive Section Names
```bash
# Good
python db_manager.py create-section --name "Mathematics XI-A"
python db_manager.py create-section --name "Physics Advanced Lab"

# Avoid
python db_manager.py create-section --name "Sec1"
```

### 4. Regular Statistics Monitoring
```bash
# Monitor database growth and section distribution
python db_manager.py stats
```

### 5. Teacher Access Testing
```bash
# Test teacher access control regularly
python db_manager.py list-teacher-students --teacher teacherId123
```

## API Integration

### Frontend Integration Points

The database manager creates a structure that supports:

1. **Multi-Section Display**: Frontend can show students in multiple sections
2. **Teacher Dashboards**: Teachers see only their assigned students
3. **Section Management**: Dynamic section creation and assignment
4. **Real-time Updates**: Changes sync across all sections automatically

### Expected Frontend Adaptations

1. **Student Cards**: Update to display multiple sections
2. **Teacher Views**: Filter by assigned sections only
3. **Section Selectors**: Allow multi-section selection
4. **Admin Panels**: Full section management capabilities

## Troubleshooting

### Debug Mode
For debugging, you can create a simple test script:

```python
from db_manager import StutraDB

db = StutraDB()
# Check data structure
students = db._make_request('GET', 'students')
sections = db._make_request('GET', 'sections')
print(f"Students type: {type(students)}")
print(f"Sections type: {type(sections)}")
```

### Log Analysis
The tool provides detailed logging:
- ✅ Success operations
- ❌ Error messages
- 📊 Statistics and counts
- 🔄 Migration progress
- 📦 Backup confirmations

## Version History

### v1.0.0 (Current)
- ✅ Multi-section student support
- ✅ Teacher access control
- ✅ Data migration from single-section format
- ✅ Complete CRUD operations
- ✅ CSV import/export
- ✅ Database backup/restore
- ✅ Data integrity validation
- ✅ Comprehensive CLI interface

## Support

For issues or questions:
1. Check error messages and logs
2. Verify environment configuration
3. Run validation commands
4. Check database statistics
5. Review this documentation

## License

Part of the Stutra Attendance System project.
