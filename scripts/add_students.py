#!/usr/bin/env python3
"""
Student Database Management Script for Stutra

This script provides an easy interface to add, update, and manage students
in the Firebase Realtime Database used by the Stutra application.

Usage:
    python add_students.py

Requirements:
    pip install firebase-admin pandas openpyxl

Setup:
    1. Download your Firebase service account key JSON file
    2. Update the FIREBASE_CONFIG and SERVICE_ACCOUNT_PATH variables below
    3. Run the script and follow the interactive prompts
"""

import json
import csv
import sys
from typing import Dict, List, Optional
from datetime import datetime
import os

try:
    import firebase_admin
    from firebase_admin import credentials, db
    import pandas as pd
except ImportError:
    print("❌ Missing required packages!")
    print("Please install them using:")
    print("pip install firebase-admin pandas openpyxl")
    sys.exit(1)

# Configuration - Update these with your Firebase details
FIREBASE_CONFIG = {
    "databaseURL": "https://your-project-default-rtdb.firebaseio.com/"  # Replace with your database URL
}

SERVICE_ACCOUNT_PATH = "path/to/your/serviceAccountKey.json"  # Replace with your service account key path

class StudentManager:
    def __init__(self):
        self.app = None
        self.db_ref = None
        self.initialize_firebase()
    
    def initialize_firebase(self):
        """Initialize Firebase connection"""
        try:
            if not os.path.exists(SERVICE_ACCOUNT_PATH):
                print("❌ Service account key file not found!")
                print(f"Please download your Firebase service account key and save it as: {SERVICE_ACCOUNT_PATH}")
                print("\nTo get your service account key:")
                print("1. Go to Firebase Console > Project Settings > Service Accounts")
                print("2. Click 'Generate new private key'")
                print("3. Save the JSON file and update SERVICE_ACCOUNT_PATH in this script")
                sys.exit(1)
            
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            self.app = firebase_admin.initialize_app(cred, FIREBASE_CONFIG)
            self.db_ref = db.reference('students')
            print("✅ Connected to Firebase successfully!")
        except Exception as e:
            print(f"❌ Failed to connect to Firebase: {e}")
            sys.exit(1)
    
    def get_next_student_id(self) -> int:
        """Get the next available student ID"""
        try:
            students = self.db_ref.get() or {}
            if not students:
                return 1
            return max(int(id) for id in students.keys()) + 1
        except Exception as e:
            print(f"❌ Error getting next ID: {e}")
            return 1
    
    def add_student(self, name: str, admission_number: str, section: str, photo_url: str = "") -> bool:
        """Add a single student to the database"""
        try:
            student_id = self.get_next_student_id()
            student_data = {
                "id": student_id,
                "name": name.strip(),
                "admission_number": admission_number.strip(),
                "photo_url": photo_url.strip(),
                "section": section.strip(),
                "status": "present",
                "activity": "",
                "timer_end": None,
                "notes": []
            }
            
            self.db_ref.child(str(student_id)).set(student_data)
            print(f"✅ Added student: {name} (ID: {student_id})")
            return True
        except Exception as e:
            print(f"❌ Failed to add student {name}: {e}")
            return False
    
    def add_students_from_csv(self, csv_file: str) -> bool:
        """Add multiple students from a CSV file"""
        try:
            with open(csv_file, 'r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                required_columns = ['name', 'admission_number', 'section']
                
                if not all(col in reader.fieldnames for col in required_columns):
                    print(f"❌ CSV must contain columns: {', '.join(required_columns)}")
                    print(f"Found columns: {', '.join(reader.fieldnames)}")
                    return False
                
                count = 0
                for row in reader:
                    if row['name'].strip() and row['admission_number'].strip():
                        photo_url = row.get('photo_url', '').strip()
                        if self.add_student(row['name'], row['admission_number'], row['section'], photo_url):
                            count += 1
                
                print(f"✅ Successfully added {count} students from CSV")
                return True
        except Exception as e:
            print(f"❌ Failed to read CSV file: {e}")
            return False
    
    def add_students_from_excel(self, excel_file: str, sheet_name: str = None) -> bool:
        """Add multiple students from an Excel file"""
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            required_columns = ['name', 'admission_number', 'section']
            
            if not all(col in df.columns for col in required_columns):
                print(f"❌ Excel must contain columns: {', '.join(required_columns)}")
                print(f"Found columns: {', '.join(df.columns)}")
                return False
            
            count = 0
            for _, row in df.iterrows():
                if pd.notna(row['name']) and pd.notna(row['admission_number']):
                    photo_url = row.get('photo_url', '') if pd.notna(row.get('photo_url')) else ''
                    if self.add_student(str(row['name']), str(row['admission_number']), str(row['section']), str(photo_url)):
                        count += 1
            
            print(f"✅ Successfully added {count} students from Excel")
            return True
        except Exception as e:
            print(f"❌ Failed to read Excel file: {e}")
            return False
    
    def list_students(self, section: str = None) -> List[Dict]:
        """List all students or students from a specific section"""
        try:
            students = self.db_ref.get() or {}
            student_list = list(students.values())
            
            if section:
                student_list = [s for s in student_list if s.get('section', '').lower() == section.lower()]
            
            return sorted(student_list, key=lambda x: x.get('name', ''))
        except Exception as e:
            print(f"❌ Failed to list students: {e}")
            return []
    
    def delete_student(self, student_id: int) -> bool:
        """Delete a student by ID"""
        try:
            self.db_ref.child(str(student_id)).delete()
            print(f"✅ Deleted student with ID: {student_id}")
            return True
        except Exception as e:
            print(f"❌ Failed to delete student: {e}")
            return False
    
    def update_student(self, student_id: int, **kwargs) -> bool:
        """Update student information"""
        try:
            updates = {}
            allowed_fields = ['name', 'admission_number', 'section', 'photo_url']
            
            for field, value in kwargs.items():
                if field in allowed_fields and value is not None:
                    updates[field] = str(value).strip()
            
            if updates:
                self.db_ref.child(str(student_id)).update(updates)
                print(f"✅ Updated student {student_id}: {updates}")
                return True
            else:
                print("❌ No valid fields to update")
                return False
        except Exception as e:
            print(f"❌ Failed to update student: {e}")
            return False

def create_sample_csv():
    """Create a sample CSV file for reference"""
    sample_data = [
        ["name", "admission_number", "section", "photo_url"],
        ["John Doe", "2024001", "XI Science", ""],
        ["Jane Smith", "2024002", "XI Science", ""],
        ["Bob Johnson", "2024003", "XI Commerce", ""],
    ]
    
    with open("sample_students.csv", "w", newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerows(sample_data)
    
    print("✅ Created sample_students.csv - you can use this as a template")

def interactive_menu():
    """Main interactive menu"""
    print("\n" + "="*60)
    print("📚 STUTRA STUDENT DATABASE MANAGER")
    print("="*60)
    
    # Check configuration
    if SERVICE_ACCOUNT_PATH == "path/to/your/serviceAccountKey.json":
        print("⚠️  SETUP REQUIRED!")
        print("Please update the configuration in this script:")
        print("1. Set SERVICE_ACCOUNT_PATH to your Firebase service account key file")
        print("2. Set FIREBASE_CONFIG['databaseURL'] to your database URL")
        print("\nGet these from Firebase Console > Project Settings > Service Accounts")
        return
    
    manager = StudentManager()
    
    while True:
        print("\n" + "-"*40)
        print("MAIN MENU")
        print("-"*40)
        print("1. Add single student")
        print("2. Add students from CSV file")
        print("3. Add students from Excel file")
        print("4. List all students")
        print("5. List students by section")
        print("6. Update student information")
        print("7. Delete student")
        print("8. Create sample CSV template")
        print("9. Export current students to CSV")
        print("0. Exit")
        
        try:
            choice = input("\nEnter your choice (0-9): ").strip()
            
            if choice == "0":
                print("👋 Goodbye!")
                break
            
            elif choice == "1":
                print("\n--- ADD SINGLE STUDENT ---")
                name = input("Student name: ").strip()
                admission_number = input("Admission number: ").strip()
                section = input("Section: ").strip()
                photo_url = input("Photo URL (optional): ").strip()
                
                if name and admission_number and section:
                    manager.add_student(name, admission_number, section, photo_url)
                else:
                    print("❌ Name, admission number, and section are required!")
            
            elif choice == "2":
                print("\n--- ADD FROM CSV ---")
                csv_file = input("CSV file path: ").strip()
                if os.path.exists(csv_file):
                    manager.add_students_from_csv(csv_file)
                else:
                    print("❌ File not found!")
            
            elif choice == "3":
                print("\n--- ADD FROM EXCEL ---")
                excel_file = input("Excel file path: ").strip()
                sheet_name = input("Sheet name (press Enter for default): ").strip() or None
                if os.path.exists(excel_file):
                    manager.add_students_from_excel(excel_file, sheet_name)
                else:
                    print("❌ File not found!")
            
            elif choice == "4":
                print("\n--- ALL STUDENTS ---")
                students = manager.list_students()
                if students:
                    print(f"Found {len(students)} students:")
                    for student in students:
                        print(f"  ID: {student['id']} | {student['name']} | {student['admission_number']} | {student['section']}")
                else:
                    print("No students found.")
            
            elif choice == "5":
                print("\n--- STUDENTS BY SECTION ---")
                section = input("Section name: ").strip()
                students = manager.list_students(section)
                if students:
                    print(f"Found {len(students)} students in section '{section}':")
                    for student in students:
                        print(f"  ID: {student['id']} | {student['name']} | {student['admission_number']}")
                else:
                    print(f"No students found in section '{section}'.")
            
            elif choice == "6":
                print("\n--- UPDATE STUDENT ---")
                try:
                    student_id = int(input("Student ID: ").strip())
                    print("Enter new values (press Enter to skip):")
                    name = input("Name: ").strip()
                    admission_number = input("Admission number: ").strip()
                    section = input("Section: ").strip()
                    photo_url = input("Photo URL: ").strip()
                    
                    updates = {}
                    if name: updates['name'] = name
                    if admission_number: updates['admission_number'] = admission_number
                    if section: updates['section'] = section
                    if photo_url: updates['photo_url'] = photo_url
                    
                    if updates:
                        manager.update_student(student_id, **updates)
                    else:
                        print("❌ No updates provided!")
                except ValueError:
                    print("❌ Invalid student ID!")
            
            elif choice == "7":
                print("\n--- DELETE STUDENT ---")
                try:
                    student_id = int(input("Student ID to delete: ").strip())
                    confirm = input(f"Are you sure you want to delete student {student_id}? (yes/no): ").strip().lower()
                    if confirm == "yes":
                        manager.delete_student(student_id)
                    else:
                        print("❌ Deletion cancelled.")
                except ValueError:
                    print("❌ Invalid student ID!")
            
            elif choice == "8":
                create_sample_csv()
            
            elif choice == "9":
                print("\n--- EXPORT TO CSV ---")
                students = manager.list_students()
                if students:
                    filename = f"students_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                    with open(filename, 'w', newline='', encoding='utf-8') as file:
                        writer = csv.DictWriter(file, fieldnames=['id', 'name', 'admission_number', 'section', 'photo_url', 'status'])
                        writer.writeheader()
                        for student in students:
                            writer.writerow({
                                'id': student['id'],
                                'name': student['name'],
                                'admission_number': student['admission_number'],
                                'section': student['section'],
                                'photo_url': student.get('photo_url', ''),
                                'status': student.get('status', 'present')
                            })
                    print(f"✅ Exported {len(students)} students to {filename}")
                else:
                    print("❌ No students to export!")
            
            else:
                print("❌ Invalid choice! Please enter 0-9.")
        
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    interactive_menu()
