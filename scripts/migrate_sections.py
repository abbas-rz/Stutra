#!/usr/bin/env python3
"""
Section Migration Script
Migrates student data from CSV files to Firebase Realtime Database
Skips Raman section as it's already in the database
"""

import os
import csv
import json
import requests
from typing import Dict, List, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local or .env file
def load_env_file():
    """Load .env.local or .env file from various possible locations"""
    possible_paths = [
        Path.cwd() / '.env.local',
        Path(__file__).parent / '.env.local',
        Path(__file__).parent.parent / '.env.local',
        Path.cwd() / '.env',
        Path(__file__).parent / '.env',
        Path(__file__).parent.parent / '.env',
    ]
    
    for env_path in possible_paths:
        if env_path.exists():
            print(f"Loading environment from: {env_path}")
            load_dotenv(env_path)
            return True
    return False

load_env_file()

# Firebase configuration - update with your actual database URL
FIREBASE_URL = "https://your-project-default-rtdb.firebaseio.com"

class SectionMigrator:
    def __init__(self, firebase_url: str = None):
        if firebase_url:
            self.firebase_url = firebase_url.rstrip('/')
        else:
            self.firebase_url = os.getenv('VITE_FIREBASE_DATABASE_URL', '').rstrip('/')
            if not self.firebase_url:
                raise ValueError("Firebase URL is required. Either pass it as parameter or set VITE_FIREBASE_DATABASE_URL in .env.local/.env file")
        
        self.csv_dir = Path(__file__).parent.parent / "csv_output"
        
    def extract_section_name(self, filename: str) -> str:
        """Extract section name from filename"""
        # Remove .csv extension and number suffix
        name = filename.replace('.csv', '')
        # Remove numbers at the end (e.g., "Amartya 32" -> "Amartya")
        section_name = ''.join(char for char in name if not char.isdigit()).strip()
        return f"XI {section_name}"
    
    def read_csv_file(self, filepath: Path) -> List[Dict[str, Any]]:
        """Read student data from CSV file"""
        students = []
        
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Handle different CSV formats
                serial_no = row.get('S.NO', '').strip()
                admission_no = row.get('A.NO.', '').strip()
                name = row.get('Name', '').strip()
                
                if serial_no and admission_no and name:
                    student = {
                        'id': int(admission_no),  # Use admission number as ID
                        'name': name,
                        'admission_number': admission_no,
                        'photo_url': '',  # Empty for now
                        'sections': [],  # Will be set later
                        'status': 'absent',
                        'activity': '',
                        'timer_end': None,
                        'notes': [],
                        'lastResetDate': ''
                    }
                    students.append(student)
        
        return students
    
    def upload_section_to_firebase(self, section_name: str, students: List[Dict[str, Any]]) -> bool:
        """Upload section data to Firebase"""
        try:
            # First, create/update the sections list
            sections_url = f"{self.firebase_url}/sections.json"
            
            # Get existing sections
            response = requests.get(sections_url)
            sections_data = response.json() if response.status_code == 200 and response.text != 'null' else {}
            
            # Add new section
            section_key = section_name.replace(' ', '_').lower()
            sections_data[section_key] = {
                'name': section_name,
                'grade': 'XI',
                'created_at': '2025-01-27'
            }
            
            # Update sections
            response = requests.put(sections_url, json=sections_data)
            if response.status_code != 200:
                print(f"❌ Failed to update sections: {response.text}")
                return False
            
            print(f"✅ Section '{section_name}' created successfully")
            
            # Upload students
            for student in students:
                student['sections'] = [section_name]  # Set section for each student
                student_url = f"{self.firebase_url}/students/{student['id']}.json"
                
                response = requests.put(student_url, json=student)
                if response.status_code != 200:
                    print(f"❌ Failed to upload student {student['name']}: {response.text}")
                    return False
            
            print(f"✅ Uploaded {len(students)} students to section '{section_name}'")
            return True
            
        except Exception as e:
            print(f"❌ Error uploading section '{section_name}': {str(e)}")
            return False
    
    def migrate_all_sections(self):
        """Migrate all CSV files to Firebase"""
        print("🚀 Starting section migration...")
        
        # Skip Raman as it's already in the database
        skip_sections = ['raman', 'xi raman']
        
        csv_files = list(self.csv_dir.glob("*.csv"))
        if not csv_files:
            print("❌ No CSV files found in csv_output directory")
            return
        
        successful_migrations = 0
        total_students = 0
        
        for csv_file in csv_files:
            section_name = self.extract_section_name(csv_file.name)
            
            # Skip Raman section
            if section_name.lower() in skip_sections:
                print(f"⏭️  Skipping {section_name} - already in database")
                continue
            
            print(f"\n📁 Processing {csv_file.name} -> {section_name}")
            
            try:
                students = self.read_csv_file(csv_file)
                if not students:
                    print(f"⚠️  No students found in {csv_file.name}")
                    continue
                
                print(f"📚 Found {len(students)} students")
                
                # Upload to Firebase
                if self.upload_section_to_firebase(section_name, students):
                    successful_migrations += 1
                    total_students += len(students)
                else:
                    print(f"❌ Failed to migrate {section_name}")
                
            except Exception as e:
                print(f"❌ Error processing {csv_file.name}: {str(e)}")
        
        print(f"\n🎉 Migration complete!")
        print(f"✅ Successfully migrated {successful_migrations} sections")
        print(f"👥 Total students migrated: {total_students}")

def main():
    try:
        # Try to use environment variable first
        migrator = SectionMigrator()
        migrator.migrate_all_sections()
    except ValueError as e:
        print(f"Environment variable not found: {str(e)}")
        # Fallback to manual input
        firebase_url = input("Enter your Firebase database URL (e.g., https://your-project-default-rtdb.firebaseio.com): ").strip()
        
        if not firebase_url:
            print("❌ Firebase URL is required")
            return
        
        migrator = SectionMigrator(firebase_url)
        migrator.migrate_all_sections()

if __name__ == "__main__":
    main()
