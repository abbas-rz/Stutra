# Database Management Requirements

The `db_manager.py` script requires the following Python packages:

## Installation

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install requests python-dotenv
```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your Firebase database URL:
   ```
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
   ```

## Environment Variables

Create a `.env` file in the scripts directory or set these environment variables:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## Usage Examples

```bash
# Show help
python db_manager.py --help

# Create database backup
python db_manager.py backup
python db_manager.py backup --file custom_backup.json

# Restore from backup
python db_manager.py restore backup_20250127_143022.json

# Add teacher
python db_manager.py add-teacher --email teacher@school.com --name "John Smith" --role teacher

# Add student
python db_manager.py add-student --name "Alice Johnson" --admission "2024001" --section "A"

# List all students
python db_manager.py list-students

# List all teachers  
python db_manager.py list-teachers

# Import students from CSV
python db_manager.py import-students students.csv

# Export students to CSV
python db_manager.py export-students all_students.csv
python db_manager.py export-students section_a.csv --section A

# Remove student
python db_manager.py remove-student 123

# Show database statistics
python db_manager.py stats
```

## CSV Format for Student Import

The CSV file should have these columns:
- `name` (required)
- `admission_number` (required)  
- `section` (required)
- `photo_url` (optional)

Example CSV:
```csv
name,admission_number,section,photo_url
John Doe,2024001,A,https://example.com/john.jpg
Mary Smith,2024002,A,
Bob Johnson,2024003,B,https://example.com/bob.jpg
```
