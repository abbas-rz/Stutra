#!/usr/bin/env python3
"""
Stutra Database Manager

A command-line tool for managing the Firebase Realtime Database used by the Stutra attendance system.
Provides functionality to manage students, teachers, create backups, and perform data operations.

Author: Stutra Development Team
Version: 1.0.0
Requirements: requests, python-dotenv
"""

import argparse
import json
import os
import sys
import csv
from datetime import datetime
from typing import Dict, Any, Optional, List
import requests
from dotenv import load_dotenv

# Load environment variables from main project folder
# Look for .env.local first, then .env as fallback
project_root = os.path.dirname(os.path.dirname(__file__))
env_local_path = os.path.join(project_root, '.env.local')
env_path = os.path.join(project_root, '.env')

if os.path.exists(env_local_path):
    load_dotenv(env_local_path)
    print(f"📄 Loaded environment from: {env_local_path}")
elif os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"📄 Loaded environment from: {env_path}")
else:
    print("⚠️  No .env.local or .env file found in project root")

class StutraDB:
    """Firebase Realtime Database manager for Stutra application."""
    
    def __init__(self):
        """Initialize database connection."""
        self.database_url = os.getenv('VITE_FIREBASE_DATABASE_URL')
        if not self.database_url:
            print("❌ VITE_FIREBASE_DATABASE_URL environment variable not found!")
            print(f"Please create a .env.local file in: {project_root}")
            print("And add your Firebase database URL:")
            print("VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/")
            raise ValueError("VITE_FIREBASE_DATABASE_URL environment variable is required")
        
        # Remove trailing slash if present
        self.database_url = self.database_url.rstrip('/')
        
        print(f"🔗 Connected to Firebase: {self.database_url}")
    
    def _make_request(self, method: str, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Firebase REST API."""
        url = f"{self.database_url}/{path}.json"
        
        try:
            if method == 'GET':
                response = requests.get(url)
            elif method == 'PUT':
                response = requests.put(url, json=data)
            elif method == 'POST':
                response = requests.post(url, json=data)
            elif method == 'DELETE':
                response = requests.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Database request failed: {e}")
            sys.exit(1)
    
    def backup_database(self, filename: Optional[str] = None) -> str:
        """Create a complete backup of the database."""
        print("📦 Creating database backup...")
        
        # Get all data
        data = self._make_request('GET', '')
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"backup_{timestamp}.json"
        
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Backup created: {filepath}")
        return filepath
    
    def restore_database(self, filename: str, confirm: bool = False) -> None:
        """Restore database from backup file."""
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        if not os.path.exists(filepath):
            print(f"❌ Backup file not found: {filepath}")
            sys.exit(1)
        
        if not confirm:
            response = input("⚠️  This will overwrite ALL data in the database. Continue? (yes/no): ")
            if response.lower() != 'yes':
                print("🚫 Restore cancelled")
                return
        
        print("🔄 Restoring database from backup...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Clear existing data and restore
        self._make_request('PUT', '', data)
        
        print("✅ Database restored successfully")
    
    def add_student(self, name: str, admission_number: str, sections: List[str], photo_url: str = "") -> str:
        """Add a new student to the database with multiple sections support."""
        if not sections:
            sections = ["default"]  # Default section if none provided
            
        student_data = {
            'name': name,
            'admissionNumber': admission_number,
            'sections': sections,  # Changed from single section to array
            'photoUrl': photo_url,
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        print(f"👤 Adding student: {name} (#{admission_number}) to sections: {', '.join(sections)}")
        
        # Add to students collection
        result = self._make_request('POST', 'students', student_data)
        student_id = result.get('name')  # Firebase returns the generated key as 'name'
        
        # Update each section's student list
        for section_id in sections:
            self._add_student_to_section(student_id, section_id)
        
        print(f"✅ Student added with ID: {student_id}")
        return student_id
    
    def _add_student_to_section(self, student_id: str, section_id: str):
        """Add student to a section's student list."""
        section = self._make_request('GET', f'sections/{section_id}') or {}
        students_list = section.get('students', [])
        
        if student_id not in students_list:
            students_list.append(student_id)
            self._make_request('PUT', f'sections/{section_id}/students', students_list)
    
    def add_teacher(self, email: str, name: str, assigned_sections: List[str] = None) -> str:
        """Add a new teacher with assigned sections."""
        assigned_sections = assigned_sections or []
        
        teacher_data = {
            'email': email,
            'name': name,
            'assignedSections': assigned_sections,
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        print(f"👨‍🏫 Adding teacher: {name} ({email}) with sections: {', '.join(assigned_sections)}")
        
        # Add to teachers collection
        result = self._make_request('POST', 'teachers', teacher_data)
        teacher_id = result.get('name')
        
        # Update each section's teacher list
        for section_id in assigned_sections:
            self._add_teacher_to_section(teacher_id, section_id)
        
        print(f"✅ Teacher added with ID: {teacher_id}")
        return teacher_id
    
    def _add_teacher_to_section(self, teacher_id: str, section_id: str):
        """Add teacher to a section's teacher list."""
        section = self._make_request('GET', f'sections/{section_id}') or {}
        teachers_list = section.get('teachers', [])
        
        if teacher_id not in teachers_list:
            teachers_list.append(teacher_id)
            self._make_request('PUT', f'sections/{section_id}/teachers', teachers_list)
    
    def create_section(self, name: str) -> str:
        """Create a new section."""
        section_data = {
            'name': name,
            'teachers': [],
            'students': [],
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        print(f"🏫 Creating section: {name}")
        result = self._make_request('POST', 'sections', section_data)
        section_id = result.get('name')
        
        print(f"✅ Section created with ID: {section_id}")
        return section_id
    
    def list_students_for_teacher(self, teacher_id: str) -> List[Dict[str, Any]]:
        """List students that a teacher can access based on their assigned sections."""
        print(f"📋 Fetching students for teacher: {teacher_id}")
        
        # Get teacher's assigned sections
        teacher = self._make_request('GET', f'teachers/{teacher_id}')
        if not teacher:
            print(f"❌ Teacher not found: {teacher_id}")
            return []
        
        assigned_sections = teacher.get('assignedSections', [])
        if not assigned_sections:
            print("📭 Teacher has no assigned sections")
            return []
        
        # Get all students
        students_data = self._make_request('GET', 'students') or {}
        accessible_students = []
        
        for student_id, student_data in students_data.items():
            student_sections = student_data.get('sections', [])
            
            # Check if student is in any of teacher's sections
            if any(section in assigned_sections for section in student_sections):
                student_data['id'] = student_id
                accessible_students.append(student_data)
        
        # Sort alphabetically by name
        accessible_students.sort(key=lambda x: x.get('name', '').lower())
        
        print(f"\n📊 Found {len(accessible_students)} accessible students:")
        print("-" * 80)
        print(f"{'ID':<20} {'Name':<25} {'Admission':<12} {'Sections':<20}")
        print("-" * 80)
        
        for student in accessible_students:
            sections_str = ', '.join(student.get('sections', []))
            print(f"{student['id'][:20]:<20} {student.get('name', 'N/A'):<25} "
                  f"{student.get('admissionNumber', 'N/A'):<12} {sections_str:<20}")
        
        return accessible_students
    
    def list_students(self, section: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all students or students from specific section."""
        print("📋 Fetching students...")
        
        data = self._make_request('GET', 'students')
        if not data:
            print("📭 No students found")
            return []
        
        students = []
        for student_id, student_data in data.items():
            if section:
                student_sections = student_data.get('sections', [])
                # Handle backward compatibility with old single section format
                if isinstance(student_sections, str):
                    student_sections = [student_sections]
                elif not student_sections and student_data.get('section'):
                    # Handle old 'section' field
                    student_sections = [student_data.get('section')]
                
                if section not in student_sections:
                    continue
            
            student_data['id'] = student_id
            students.append(student_data)
        
        # Sort alphabetically by name
        students.sort(key=lambda x: x.get('name', '').lower())
        
        print(f"\n📊 Found {len(students)} students:")
        print("-" * 80)
        print(f"{'ID':<20} {'Name':<25} {'Admission':<12} {'Sections':<20}")
        print("-" * 80)
        
        for student in students:
            sections_data = student.get('sections', [])
            # Handle both old single section format and new array format for display
            if isinstance(sections_data, str):
                sections_str = sections_data
            elif isinstance(sections_data, list):
                sections_str = ', '.join(sections_data)
            else:
                sections_str = 'N/A'
            
            print(f"{student['id'][:20]:<20} {student.get('name', 'N/A'):<25} "
                  f"{student.get('admissionNumber', 'N/A'):<12} {sections_str:<20}")
        
        return students
    
    def list_sections(self) -> Dict[str, Any]:
        """List all sections."""
        print("📋 Fetching sections...")
        
        data = self._make_request('GET', 'sections')
        if not data:
            print("📭 No sections found")
            return {}
        
        # Handle both list and dict formats
        if isinstance(data, list):
            print("📭 No sections found (data is in list format)")
            return {}
        
        sections_info = {}
        for section_id, section_data in data.items():
            # Count teachers and students in this section
            teachers_count = len(section_data.get('teachers', []))
            students_count = len(section_data.get('students', []))
            
            sections_info[section_id] = {
                'name': section_data.get('name', 'Unknown'),
                'teacher_count': teachers_count,
                'student_count': students_count
            }
        
        return sections_info
    
    def migrate_to_multisection(self) -> None:
        """Migrate existing single-section data to multi-section format."""
        print("🔄 Starting migration to multi-section format...")
        
        # Backup current data first
        backup_file = self.backup_database(f"pre_migration_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        print(f"📦 Pre-migration backup created: {backup_file}")
        
        # Get current students
        students_data = self._make_request('GET', 'students') or {}
        sections_to_create = set()
        migrated_count = 0
        
        print(f"📊 Found {len(students_data)} students to migrate")
        
        # Handle both list and dict formats
        if isinstance(students_data, list):
            student_items = [(i, student_data) for i, student_data in enumerate(students_data) if student_data is not None]
        else:
            student_items = students_data.items()
        
        for student_id, student_data in student_items:
            # Check if already migrated (has sections array)
            if 'sections' in student_data and isinstance(student_data['sections'], list):
                continue
            
            # Get old section value
            old_section = student_data.get('section', 'default')
            
            # Update student with sections array
            student_data['sections'] = [old_section]
            student_data['updatedAt'] = datetime.now().isoformat()
            
            # Remove old section field
            if 'section' in student_data:
                del student_data['section']
            
            # Update student record
            self._make_request('PUT', f'students/{student_id}', student_data)
            
            # Track sections to create
            sections_to_create.add(old_section)
            migrated_count += 1
            
            print(f"✅ Migrated student: {student_data.get('name', student_id)} -> [{old_section}]")
        
        # Create section records
        print(f"\n🏫 Creating {len(sections_to_create)} sections...")
        for section_name in sections_to_create:
            if section_name and section_name != 'default':
                self.create_section(section_name)
        
        print(f"\n✅ Migration completed!")
        print(f"   - Migrated {migrated_count} students")
        print(f"   - Created {len(sections_to_create)} sections")
        print(f"   - Backup saved as: {backup_file}")
        return True
    
    def validate_data_integrity(self) -> bool:
        """Validate data integrity after migration."""
        print("🔍 Validating data integrity...")
        
        students_data = self._make_request('GET', 'students') or {}
        sections_data = self._make_request('GET', 'sections') or {}
        
        issues = []
        
        # Check students - handle both list and dict formats
        if isinstance(students_data, list):
            student_items = [(i, student_data) for i, student_data in enumerate(students_data) if student_data is not None]
        else:
            student_items = students_data.items()
            
        for student_id, student_data in student_items:
            # Ensure sections field exists and is array
            if 'sections' not in student_data:
                issues.append(f"Student {student_id} missing 'sections' field")
            elif not isinstance(student_data['sections'], list):
                issues.append(f"Student {student_id} 'sections' is not an array")
            elif not student_data['sections']:
                issues.append(f"Student {student_id} has empty sections array")
        
        # Check sections
        if isinstance(sections_data, dict):
            for section_id, section_data in sections_data.items():
                if 'name' not in section_data:
                    issues.append(f"Section {section_id} missing 'name' field")
                if 'students' not in section_data:
                    issues.append(f"Section {section_id} missing 'students' field")
                if 'teachers' not in section_data:
                    issues.append(f"Section {section_id} missing 'teachers' field")
        
        if issues:
            print(f"❌ Found {len(issues)} data integrity issues:")
            for issue in issues:
                print(f"   - {issue}")
        else:
            print("✅ Data integrity validation passed!")
        
        print(f"\n📊 Summary:")
        print(f"   - Students: {len(students_data)}")
        print(f"   - Sections: {len(sections_data) if isinstance(sections_data, dict) else 0}")
        print(f"   - Issues: {len(issues)}")
        
        return len(issues) == 0
    
    def list_teachers(self) -> List[Dict[str, Any]]:
        """List all teachers."""
        print("📋 Fetching teachers...")
        
        data = self._make_request('GET', 'teachers')
        if not data:
            print("📭 No teachers found")
            return []
        
        teachers = []
        for teacher_id, teacher_data in data.items():
            teacher_data['id'] = teacher_id
            teachers.append(teacher_data)
        
        # Sort alphabetically by name
        teachers.sort(key=lambda x: x.get('name', '').lower())
        
        print(f"\n📊 Found {len(teachers)} teachers:")
        print("-" * 70)
        print(f"{'ID':<20} {'Name':<25} {'Email':<25}")
        print("-" * 70)
        
        for teacher in teachers:
            print(f"{teacher['id'][:20]:<20} {teacher.get('name', 'N/A'):<25} "
                  f"{teacher.get('email', 'N/A'):<25}")
        
        return teachers
    
    def remove_student(self, student_id: str) -> None:
        """Remove a student from the database."""
        print(f"🗑️  Removing student: {student_id}")
        
        # Check if student exists
        student = self._make_request('GET', f'students/{student_id}')
        if not student:
            print(f"❌ Student not found: {student_id}")
            return
        
        # Remove student
        self._make_request('DELETE', f'students/{student_id}')
        
        print(f"✅ Student removed: {student.get('name', student_id)}")
    
    def remove_teacher(self, teacher_id: str) -> None:
        """Remove a teacher from the database."""
        print(f"🗑️  Removing teacher: {teacher_id}")
        
        # Check if teacher exists
        teacher = self._make_request('GET', f'teachers/{teacher_id}')
        if not teacher:
            print(f"❌ Teacher not found: {teacher_id}")
            return
        
        # Remove teacher
        self._make_request('DELETE', f'teachers/{teacher_id}')
        
        print(f"✅ Teacher removed: {teacher.get('name', teacher_id)}")
    
    def import_students_csv(self, filename: str) -> None:
        """Import students from CSV file."""
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        if not os.path.exists(filepath):
            print(f"❌ CSV file not found: {filepath}")
            sys.exit(1)
        
        print(f"📥 Importing students from: {filename}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            
            for row in reader:
                name = row.get('name', '').strip()
                admission = row.get('admission_number', '').strip()
                section = row.get('section', '').strip()
                photo_url = row.get('photo_url', '').strip()
                
                if not name or not admission or not section:
                    print(f"⚠️  Skipping incomplete row: {row}")
                    continue
                
                try:
                    self.add_student(name, admission, section, photo_url)
                    count += 1
                except Exception as e:
                    print(f"❌ Failed to add student {name}: {e}")
        
        print(f"✅ Successfully imported {count} students")
    
    def export_students_csv(self, filename: str, section: Optional[str] = None) -> None:
        """Export students to CSV file."""
        students = self.list_students(section)  # This will print the list
        
        if not students:
            print("📭 No students to export")
            return
        
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        print(f"📤 Exporting {len(students)} students to: {filename}")
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['id', 'name', 'admission_number', 'section', 'photo_url', 'created_at']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for student in students:
                writer.writerow({
                    'id': student['id'],
                    'name': student.get('name', ''),
                    'admission_number': student.get('admissionNumber', ''),
                    'section': student.get('section', ''),
                    'photo_url': student.get('photoUrl', ''),
                    'created_at': student.get('createdAt', '')
                })
        
        print(f"✅ Students exported to: {filepath}")
    
    def show_stats(self) -> None:
        """Show database statistics."""
        print("📊 Database Statistics")
        print("=" * 50)
        
        # Get all data
        data = self._make_request('GET', '')
        
        students_data = data.get('students', {})
        teachers_data = data.get('teachers', {})
        activities_data = data.get('activities', {})
        
        total_students = len(students_data) if students_data else 0
        total_teachers = len(teachers_data) if teachers_data else 0
        total_activities = len(activities_data) if activities_data else 0
        
        print(f"👤 Total Students: {total_students}")
        print(f"👨‍🏫 Total Teachers: {total_teachers}")
        print(f"📝 Total Activities: {total_activities}")
        
        # Section breakdown
        if students_data:
            sections = {}
            # Handle both list and dict formats
            if isinstance(students_data, list):
                student_items = students_data
            else:
                student_items = students_data.values()
                
            for student_data in student_items:
                if student_data is None:
                    continue
                    
                # Handle both old format (single section) and new format (sections array)
                if 'sections' in student_data:
                    # New multi-section format
                    student_sections = student_data.get('sections', [])
                    if isinstance(student_sections, list):
                        for section in student_sections:
                            sections[section] = sections.get(section, 0) + 1
                    else:
                        # Handle case where sections is not a list
                        sections['Unknown'] = sections.get('Unknown', 0) + 1
                else:
                    # Old single-section format
                    section = student_data.get('section', 'Unknown')
                    sections[section] = sections.get(section, 0) + 1
            
            print(f"\n📚 Students by Section:")
            for section, count in sorted(sections.items()):
                print(f"   Section {section}: {count} students")
        
        print("=" * 50)

def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(
        description="Stutra Database Manager - Manage Firebase database for attendance system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Database operations
  python db_manager.py backup
  python db_manager.py backup --file my_backup.json
  python db_manager.py restore backup_20250127.json
  python db_manager.py stats
  
  # Migration (run once to convert old data)
  python db_manager.py migrate-to-multisection
  python db_manager.py validate-data
  
  # Section management
  python db_manager.py create-section --name "Section A" 
  python db_manager.py list-sections
  
  # Student management (new multi-section format)
  python db_manager.py add-student --name "John Doe" --admission "2024001" --sections "Section A,Math Advanced"  
  python db_manager.py list-students
  python db_manager.py list-students --section "Section A"
  
  # Teacher management
  python db_manager.py add-teacher --email "teacher@school.com" --name "Jane Smith" --sections "Section A,Section B"
  python db_manager.py list-teachers
  python db_manager.py list-teacher-students --teacher teacherId123
  
  # Data operations
  python db_manager.py import-students students.csv
  python db_manager.py export-students all_students.csv
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Backup command
    backup_parser = subparsers.add_parser('backup', help='Create database backup')
    backup_parser.add_argument('--file', '-f', help='Backup filename (auto-generated if not provided)')
    
    # Restore command
    restore_parser = subparsers.add_parser('restore', help='Restore database from backup')
    restore_parser.add_argument('filename', help='Backup file to restore from')
    restore_parser.add_argument('--confirm', action='store_true', help='Skip confirmation prompt')
    
    # Add student command
    add_student_parser = subparsers.add_parser('add-student', help='Add new student')
    add_student_parser.add_argument('--name', '-n', required=True, help='Student name')
    add_student_parser.add_argument('--admission', '-a', required=True, help='Admission number')
    add_student_parser.add_argument('--sections', '-s', required=True, help='Comma-separated section names')
    add_student_parser.add_argument('--photo', '-p', default='', help='Photo URL')
    
    # Add teacher command
    add_teacher_parser = subparsers.add_parser('add-teacher', help='Add new teacher')
    add_teacher_parser.add_argument('--email', '-e', required=True, help='Teacher email')
    add_teacher_parser.add_argument('--name', '-n', required=True, help='Teacher name')
    add_teacher_parser.add_argument('--sections', '-s', help='Comma-separated section names to assign')
    
    # Create section command
    create_section_parser = subparsers.add_parser('create-section', help='Create new section')
    create_section_parser.add_argument('--name', '-n', required=True, help='Section name')
    
    # List students command
    list_students_parser = subparsers.add_parser('list-students', help='List all students')
    list_students_parser.add_argument('--section', '-s', help='Filter by section')
    
    # List students for teacher command  
    list_teacher_students_parser = subparsers.add_parser('list-teacher-students', help='List students accessible to a teacher')
    list_teacher_students_parser.add_argument('--teacher', '-t', required=True, help='Teacher ID')
    
    # List teachers command
    subparsers.add_parser('list-teachers', help='List all teachers')
    
    # List sections command
    subparsers.add_parser('list-sections', help='List all sections')
    
    # Migration commands
    subparsers.add_parser('migrate-to-multisection', help='Migrate existing data to multi-section format')
    subparsers.add_parser('validate-data', help='Validate data integrity after migration')
    
    # Remove student command
    remove_student_parser = subparsers.add_parser('remove-student', help='Remove student')
    remove_student_parser.add_argument('student_id', help='Student ID to remove')
    
    # Remove teacher command
    remove_teacher_parser = subparsers.add_parser('remove-teacher', help='Remove teacher')
    remove_teacher_parser.add_argument('teacher_id', help='Teacher ID to remove')
    
    # Import students command
    import_parser = subparsers.add_parser('import-students', help='Import students from CSV')
    import_parser.add_argument('filename', help='CSV file to import')
    
    # Export students command
    export_parser = subparsers.add_parser('export-students', help='Export students to CSV')
    export_parser.add_argument('filename', help='CSV file to export to')
    export_parser.add_argument('--section', '-s', help='Export only specific section')
    
    # Stats command
    subparsers.add_parser('stats', help='Show database statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        db = StutraDB()
        
        if args.command == 'backup':
            db.backup_database(args.file)
        
        elif args.command == 'restore':
            db.restore_database(args.filename, args.confirm)
        
        elif args.command == 'add-student':
            sections = [s.strip() for s in args.sections.split(',')]
            db.add_student(args.name, args.admission, sections, args.photo)
        
        elif args.command == 'add-teacher':
            sections = [s.strip() for s in args.sections.split(',')] if args.sections else []
            db.add_teacher(args.email, args.name, sections)
        
        elif args.command == 'migrate-to-multisection':
            if db.migrate_to_multisection():
                print("✅ Migration completed successfully! Run 'validate-data' to verify.")
            else:
                print("❌ Migration failed. Check logs above.")
        
        elif args.command == 'validate-data':
            if db.validate_data_integrity():
                print("✅ Data validation passed - all data is consistent!")
            else:
                print("❌ Data validation failed - inconsistencies found!")
        
        elif args.command == 'list-sections':
            sections = db.list_sections()
            if sections:
                print(f"\n📚 Found {len(sections)} sections:")
                for section_id, section_info in sections.items():
                    print(f"  • {section_info['name']} (ID: {section_id})")
                    print(f"    Teachers: {section_info.get('teacher_count', 0)}, Students: {section_info.get('student_count', 0)}")
            else:
                print("📚 No sections found.")
        
        elif args.command == 'create-section':
            db.create_section(args.name)
        
        elif args.command == 'list-students':
            db.list_students(args.section)
        
        elif args.command == 'list-teacher-students':
            db.list_students_for_teacher(args.teacher)
        
        elif args.command == 'list-teachers':
            db.list_teachers()
        
        elif args.command == 'remove-student':
            db.remove_student(args.student_id)
        
        elif args.command == 'remove-teacher':
            db.remove_teacher(args.teacher_id)
        
        elif args.command == 'import-students':
            db.import_students_csv(args.filename)
        
        elif args.command == 'export-students':
            db.export_students_csv(args.filename, args.section)
        
        elif args.command == 'stats':
            db.show_stats()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
