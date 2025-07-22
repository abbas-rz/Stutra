# Setup Instructions for Python Student Management Script

## Prerequisites

1. **Python 3.7+** installed on your system
2. **Firebase Project** with Realtime Database enabled
3. **Firebase Service Account Key** downloaded

## Step 1: Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

## Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing project
3. Enable **Realtime Database**
4. Go to **Project Settings** > **Service Accounts**
5. Click **Generate new private key**
6. Save the JSON file as `serviceAccountKey.json` in the `scripts` folder

## Step 3: Configure the Script

1. Open `add_students.py`
2. Update the following variables:

```python
FIREBASE_CONFIG = {
    "databaseURL": "https://your-project-default-rtdb.firebaseio.com/"
}

SERVICE_ACCOUNT_PATH = "serviceAccountKey.json"
```

## Step 4: Run the Script

```bash
python add_students.py
```

## Features

### 1. Add Single Student
- Interactive form to add one student at a time
- Validates required fields (name, admission number, section)

### 2. Bulk Import from CSV
- Import multiple students from CSV file
- Required columns: `name`, `admission_number`, `section`
- Optional column: `photo_url`

### 3. Bulk Import from Excel
- Import from Excel (.xlsx) files
- Same column requirements as CSV
- Can specify sheet name

### 4. Student Management
- List all students or filter by section
- Update student information
- Delete students (with confirmation)

### 5. Export Data
- Export current students to CSV
- Includes all student information and current status

## CSV Format Example

```csv
name,admission_number,section,photo_url
John Doe,2024001,XI Science,
Jane Smith,2024002,XI Science,
Bob Johnson,2024003,XI Commerce,https://example.com/photo.jpg
```

## Security Notes

- Keep your `serviceAccountKey.json` file secure
- Never commit this file to version control
- Set appropriate Firebase security rules for production

## Troubleshooting

### Common Issues

1. **"Module not found" error**
   ```bash
   pip install firebase-admin pandas openpyxl
   ```

2. **"Permission denied" error**
   - Check Firebase security rules
   - Verify service account has proper permissions

3. **"File not found" error**
   - Ensure `serviceAccountKey.json` is in the correct location
   - Check file path in configuration

### Getting Help

1. Check Firebase Console for error messages
2. Verify your database URL is correct
3. Ensure your service account key is valid
4. Check that all required fields are provided

## Best Practices

1. **Backup**: Always export current data before making bulk changes
2. **Testing**: Test with a small batch before importing large datasets
3. **Validation**: Verify data format and completeness before import
4. **Monitoring**: Check Firebase console for usage and errors
