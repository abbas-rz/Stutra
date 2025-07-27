#!/usr/bin/env python3
"""
Enhanced Section Migration Script
Migrates student data from CSV files to Firebase Realtime Database
Uses environment variables for secure configuration
"""

import os
import csv
import json
import requests
from typing import Dict, List, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from multiple possible locations
def load_env_file():
    """Load .env or .env.local file from various possible locations"""
    possible_paths = [
        # Check for .env.local first (higher priority)
        Path.cwd() / '.env.local',                    # Current working directory
        Path(__file__).parent / '.env.local',        # Same directory as script
        Path(__file__).parent.parent / '.env.local', # Parent directory of script
        Path(__file__).parent.parent.parent / '.env.local', # Project root
        # Then check for .env files
        Path.cwd() / '.env',                    # Current working directory
        Path(__file__).parent / '.env',        # Same directory as script
        Path(__file__).parent.parent / '.env', # Parent directory of script
        Path(__file__).parent.parent.parent / '.env', # Project root
    ]
    
    for env_path in possible_paths:
        if env_path.exists():
            print(f"📄 Loading environment from: {env_path}")
            load_dotenv(env_path)
            return True
    
    print("⚠️  No .env.local or .env file found in expected locations:")
    for path in possible_paths:
        print(f"   - {path}")
    return False

# Load environment variables
env_loaded = load_env_file()

class EnhancedSectionMigrator:
    def __init__(self):
        self.firebase_url = os.getenv('VITE_FIREBASE_DATABASE_URL', '').rstrip('/')
        self.csv_dir = Path(__file__).parent.parent / "csv_output"
        
        if not self.firebase_url:
            print("❌ VITE_FIREBASE_DATABASE_URL environment variable not found")
            print("💡 Please create a .env.local or .env file with your Firebase database URL")
            print(f"📁 Expected .env.local/.env file locations:")
            print(f"   - {Path.cwd() / '.env.local'}")
            print(f"   - {Path(__file__).parent / '.env.local'}")
            print(f"   - {Path(__file__).parent.parent / '.env.local'}")
            print(f"   - {Path.cwd() / '.env'}")
            print(f"   - {Path(__file__).parent / '.env'}")
            print(f"   - {Path(__file__).parent.parent / '.env'}")
            print("")
            print("📝 .env.local file should contain:")
            print("VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/")
            raise ValueError("Firebase database URL is required")
    
    def extract_section_name(self, filename: str) -> str:
        """Extract section name from filename and format consistently"""
        # Remove .csv extension
        name = filename.replace('.csv', '')
        
        # Handle special cases and extract clean section name
        name_mapping = {
            'amartya': 'Amartya',
            'ambedkar': 'Ambedkar', 
            'curie': 'Curie',
            'eliot': 'Eliot',
            'hawking': 'Hawking',
            'lewis': 'Lewis',
            'raman': 'Raman',
            'satyarthi': 'Satyarthi',
            'tagore': 'Tagore',
            'yunus': 'Yunus'
        }
        
        # Extract base name (remove numbers)
        base_name = ''.join(char for char in name if not char.isdigit()).strip().lower()
        
        # Get proper case name
        proper_name = name_mapping.get(base_name, base_name.capitalize())
        
        return f"XI {proper_name}"
    
    def read_csv_file(self, filepath: Path) -> List[Dict[str, Any]]:
        """Read student data from CSV file with robust parsing"""
        students = []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                # Try to detect the format
                sample = file.read(1024)
                file.seek(0)
                
                reader = csv.DictReader(file)
                
                for row_num, row in enumerate(reader, 1):
                    try:
                        # Handle different CSV formats
                        serial_no = row.get('S.NO', '').strip()
                        admission_no = row.get('A.NO.', '').strip()
                        name = row.get('Name', '').strip()
                        
                        if not all([serial_no, admission_no, name]):
                            print(f"⚠️  Skipping row {row_num} - missing data: {row}")
                            continue
                        
                        # Validate admission number is numeric
                        try:
                            admission_id = int(admission_no)
                        except ValueError:
                            print(f"⚠️  Skipping row {row_num} - invalid admission number: {admission_no}")
                            continue
                        
                        student = {
                            'id': admission_id,
                            'name': name.title(),  # Proper case
                            'admission_number': admission_no,
                            'photo_url': '',
                            'sections': [],  # Will be set during upload
                            'status': 'absent',
                            'activity': '',
                            'timer_end': None,
                            'notes': [],
                            'lastResetDate': ''
                        }
                        students.append(student)
                        
                    except Exception as e:
                        print(f"⚠️  Error processing row {row_num}: {str(e)}")
                        continue
                
        except Exception as e:
            print(f"❌ Error reading CSV file {filepath}: {str(e)}")
            return []
        
        return students
    
    def check_existing_students(self, students: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check for existing students and handle conflicts"""
        try:
            response = requests.get(f"{self.firebase_url}/students.json")
            if response.status_code != 200:
                print("⚠️  Could not check existing students, proceeding with upload")
                return students
            
            existing_data = response.json()
            if not existing_data:
                return students
            
            existing_ids = set(str(key) for key in existing_data.keys())
            existing_admission_numbers = set()
            
            for student_data in existing_data.values():
                if isinstance(student_data, dict) and 'admission_number' in student_data:
                    existing_admission_numbers.add(student_data['admission_number'])
            
            new_students = []
            conflicts = []
            
            for student in students:
                student_id = str(student['id'])
                admission_no = student['admission_number']
                
                if student_id in existing_ids or admission_no in existing_admission_numbers:
                    conflicts.append(student)
                else:
                    new_students.append(student)
            
            if conflicts:
                print(f"⚠️  Found {len(conflicts)} potential conflicts:")
                for student in conflicts[:5]:  # Show first 5
                    print(f"   - {student['name']} (ID: {student['id']}, Admission: {student['admission_number']})")
                if len(conflicts) > 5:
                    print(f"   ... and {len(conflicts) - 5} more")
                
                choice = input("Continue with non-conflicting students only? (y/n): ").lower()
                if choice != 'y':
                    print("Migration cancelled")
                    return []
            
            return new_students
            
        except Exception as e:
            print(f"⚠️  Error checking existing students: {str(e)}")
            return students
    
    def upload_section_to_firebase(self, section_name: str, students: List[Dict[str, Any]]) -> bool:
        """Upload section and students to Firebase"""
        try:
            # Check for existing students
            students_to_upload = self.check_existing_students(students)
            if not students_to_upload:
                print(f"⚠️  No new students to upload for {section_name}")
                return True
            
            # Update sections metadata
            section_key = section_name.replace(' ', '_').lower()
            section_data = {
                'name': section_name,
                'grade': 'XI',
                'student_count': len(students_to_upload),
                'created_at': '2025-01-27',
                'updated_at': '2025-01-27'
            }
            
            response = requests.put(f"{self.firebase_url}/sections/{section_key}.json", json=section_data)
            if response.status_code != 200:
                print(f"❌ Failed to create section metadata: {response.text}")
                return False
            
            # Upload students in batches
            batch_size = 10
            successful_uploads = 0
            
            for i in range(0, len(students_to_upload), batch_size):
                batch = students_to_upload[i:i + batch_size]
                
                for student in batch:
                    student['sections'] = [section_name]
                    
                    response = requests.put(
                        f"{self.firebase_url}/students/{student['id']}.json",
                        json=student
                    )
                    
                    if response.status_code == 200:
                        successful_uploads += 1
                    else:
                        print(f"❌ Failed to upload {student['name']}: {response.text}")
                
                print(f"📤 Uploaded batch {i//batch_size + 1}/{(len(students_to_upload) + batch_size - 1)//batch_size}")
            
            print(f"✅ Section '{section_name}': {successful_uploads}/{len(students_to_upload)} students uploaded")
            return successful_uploads > 0
            
        except Exception as e:
            print(f"❌ Error uploading section '{section_name}': {str(e)}")
            return False
    
    def migrate_all_sections(self):
        """Migrate all CSV files to Firebase, skipping Raman"""
        print("🚀 Starting enhanced section migration...")
        print(f"📡 Firebase URL: {self.firebase_url}")
        print(f"📁 CSV Directory: {self.csv_dir}")
        
        # Skip sections already in database
        skip_sections = ['xi raman']
        
        csv_files = list(self.csv_dir.glob("*.csv"))
        if not csv_files:
            print("❌ No CSV files found in csv_output directory")
            return
        
        print(f"📚 Found {len(csv_files)} CSV files")
        
        successful_migrations = 0
        total_students = 0
        
        for csv_file in csv_files:
            section_name = self.extract_section_name(csv_file.name)
            
            # Skip already migrated sections
            if section_name.lower() in skip_sections:
                print(f"\n⏭️  Skipping {section_name} - already in database")
                continue
            
            print(f"\n📁 Processing: {csv_file.name} -> {section_name}")
            
            students = self.read_csv_file(csv_file)
            if not students:
                print(f"⚠️  No valid students found in {csv_file.name}")
                continue
            
            print(f"👥 Found {len(students)} students")
            
            # Show sample students
            if students:
                print("📋 Sample students:")
                for student in students[:3]:
                    print(f"   - {student['name']} (ID: {student['id']}, Admission: {student['admission_number']})")
                if len(students) > 3:
                    print(f"   ... and {len(students) - 3} more")
            
            # Upload to Firebase
            if self.upload_section_to_firebase(section_name, students):
                successful_migrations += 1
                total_students += len(students)
            else:
                print(f"❌ Failed to migrate {section_name}")
        
        print(f"\n🎉 Migration complete!")
        print(f"✅ Successfully migrated: {successful_migrations} sections")
        print(f"👥 Total students processed: {total_students}")

def main():
    try:
        migrator = EnhancedSectionMigrator()
        migrator.migrate_all_sections()
    except ValueError as e:
        print(f"❌ Configuration error: {str(e)}")
        print("💡 Please set VITE_FIREBASE_DATABASE_URL in your .env file")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()
