#!/usr/bin/env python3
"""
Stutra Database Manager TUI

A beautiful Terminal User Interface for managing the Firebase Realtime Database 
used by the Stutra attendance system. Built with Textual for a modern, interactive experience.

Features:
- Student management (add, edit, remove, list)
- Teacher management with section permissions
- Section management 
- Database backup/restore operations
- CSV import/export
- Data migration tools
- Real-time statistics

Author: Stutra Development Team
Version: 1.0.0
Requirements: textual, rich, requests, python-dotenv
"""

import asyncio
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from textual import on
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.screen import ModalScreen, Screen
from textual.widgets import (
    Button, DataTable, Footer, Header, Input, Label, 
    Markdown, ProgressBar, Select, Static, TextArea, 
    TabPane, TabbedContent, Tree, ListView, ListItem,
    Checkbox, RadioSet, RadioButton
)
from textual.message import Message
from textual.reactive import reactive
from rich.text import Text
from rich.panel import Panel
from rich.table import Table as RichTable
from rich.console import Console

# Import the database manager
from db_manager import StutraDB

# Color schemes and styling
THEME_COLORS = {
    'primary': '#007AFF',
    'secondary': '#FF9500', 
    'success': '#34C759',
    'danger': '#FF3B30',
    'warning': '#FF9500',
    'info': '#5AC8FA',
    'background': '#1C1C1E',
    'surface': '#2C2C2E',
    'text': '#FFFFFF'
}

class DatabaseStats:
    """Container for database statistics"""
    def __init__(self):
        self.students = 0
        self.teachers = 0
        self.sections = 0
        self.activities = 0
        self.sections_breakdown = {}

class ConfirmDialog(ModalScreen[bool]):
    """A dialog to confirm dangerous operations."""
    
    def __init__(self, message: str, title: str = "Confirm"):
        super().__init__()
        self.message = message
        self.title = title
    
    def compose(self) -> ComposeResult:
        yield Container(
            Label(self.title, classes="dialog-title"),
            Label(self.message, classes="dialog-message"),
            Horizontal(
                Button("Yes", variant="error", id="confirm"),
                Button("Cancel", variant="primary", id="cancel"),
                classes="dialog-buttons"
            ),
            classes="dialog"
        )
    
    @on(Button.Pressed, "#confirm")
    def confirm_action(self) -> None:
        self.dismiss(True)
    
    @on(Button.Pressed, "#cancel") 
    def cancel_action(self) -> None:
        self.dismiss(False)

class StudentFormDialog(ModalScreen[Optional[Dict]]):
    """Dialog for adding/editing students."""
    
    def __init__(self, student_data: Optional[Dict] = None, sections_list: List[str] = None):
        super().__init__()
        self.student_data = student_data or {}
        self.sections_list = sections_list or []
        self.is_edit = bool(student_data)
    
    def compose(self) -> ComposeResult:
        title = "Edit Student" if self.is_edit else "Add New Student"
        
        with Container(classes="dialog"):
            yield Label(title, classes="dialog-title")
            
            with Vertical(classes="form"):
                yield Label("Name:")
                yield Input(
                    value=self.student_data.get('name', ''),
                    placeholder="Enter student name",
                    id="name"
                )
                
                yield Label("Admission Number:")
                yield Input(
                    value=self.student_data.get('admissionNumber', ''),
                    placeholder="Enter admission number", 
                    id="admission"
                )
                
                yield Label("Photo URL (optional):")
                yield Input(
                    value=self.student_data.get('photoUrl', ''),
                    placeholder="Enter photo URL",
                    id="photo"
                )
                
                yield Label("Sections (comma-separated):")
                sections_str = ', '.join(self.student_data.get('sections', []))
                yield Input(
                    value=sections_str,
                    placeholder="Enter sections (e.g., Section A, Math Advanced)",
                    id="sections"
                )
                
                if self.sections_list:
                    yield Label("Available sections: " + ", ".join(self.sections_list))
            
            with Horizontal(classes="dialog-buttons"):
                yield Button("Save", variant="success", id="save")
                yield Button("Cancel", variant="default", id="cancel")
    
    @on(Button.Pressed, "#save")
    def save_student(self) -> None:
        name = self.query_one("#name", Input).value.strip()
        admission = self.query_one("#admission", Input).value.strip()
        photo = self.query_one("#photo", Input).value.strip()
        sections_text = self.query_one("#sections", Input).value.strip()
        
        if not name or not admission or not sections_text:
            self.app.bell()
            return
        
        sections = [s.strip() for s in sections_text.split(',') if s.strip()]
        
        result = {
            'name': name,
            'admissionNumber': admission,
            'photoUrl': photo,
            'sections': sections
        }
        
        if self.is_edit:
            result['id'] = self.student_data.get('id')
        
        self.dismiss(result)
    
    @on(Button.Pressed, "#cancel")
    def cancel_form(self) -> None:
        self.dismiss(None)

class TeacherFormDialog(ModalScreen[Optional[Dict]]):
    """Dialog for adding/editing teachers."""
    
    def __init__(self, teacher_data: Optional[Dict] = None, sections_list: List[str] = None):
        super().__init__()
        self.teacher_data = teacher_data or {}
        self.sections_list = sections_list or []
        self.is_edit = bool(teacher_data)
    
    def compose(self) -> ComposeResult:
        title = "Edit Teacher" if self.is_edit else "Add New Teacher"
        
        with Container(classes="dialog"):
            yield Label(title, classes="dialog-title")
            
            with Vertical(classes="form"):
                yield Label("Name:")
                yield Input(
                    value=self.teacher_data.get('name', ''),
                    placeholder="Enter teacher name",
                    id="name"
                )
                
                yield Label("Email:")
                yield Input(
                    value=self.teacher_data.get('email', ''),
                    placeholder="Enter email address",
                    id="email"
                )
                
                yield Label("Assigned Sections (comma-separated):")
                sections_str = ', '.join(self.teacher_data.get('assignedSections', []))
                yield Input(
                    value=sections_str,
                    placeholder="Enter sections (e.g., Section A, Section B)",
                    id="sections"
                )
                
                if self.sections_list:
                    yield Label("Available sections: " + ", ".join(self.sections_list))
            
            with Horizontal(classes="dialog-buttons"):
                yield Button("Save", variant="success", id="save")
                yield Button("Cancel", variant="default", id="cancel")
    
    @on(Button.Pressed, "#save")
    def save_teacher(self) -> None:
        name = self.query_one("#name", Input).value.strip()
        email = self.query_one("#email", Input).value.strip()
        sections_text = self.query_one("#sections", Input).value.strip()
        
        if not name or not email:
            self.app.bell()
            return
        
        sections = [s.strip() for s in sections_text.split(',') if s.strip()]
        
        result = {
            'name': name,
            'email': email,
            'assignedSections': sections
        }
        
        if self.is_edit:
            result['id'] = self.teacher_data.get('id')
        
        self.dismiss(result)
    
    @on(Button.Pressed, "#cancel")
    def cancel_form(self) -> None:
        self.dismiss(None)

class SectionFormDialog(ModalScreen[Optional[str]]):
    """Dialog for creating sections."""
    
    def compose(self) -> ComposeResult:
        with Container(classes="dialog"):
            yield Label("Create New Section", classes="dialog-title")
            
            with Vertical(classes="form"):
                yield Label("Section Name:")
                yield Input(
                    placeholder="Enter section name (e.g., Section A, Math Advanced)",
                    id="name"
                )
            
            with Horizontal(classes="dialog-buttons"):
                yield Button("Create", variant="success", id="create")
                yield Button("Cancel", variant="default", id="cancel")
    
    @on(Button.Pressed, "#create")
    def create_section(self) -> None:
        name = self.query_one("#name", Input).value.strip()
        if not name:
            self.app.bell()
            return
        self.dismiss(name)
    
    @on(Button.Pressed, "#cancel")
    def cancel_form(self) -> None:
        self.dismiss(None)

class FileDialog(ModalScreen[Optional[str]]):
    """Dialog for file operations."""
    
    def __init__(self, title: str, placeholder: str):
        super().__init__()
        self.title = title
        self.placeholder = placeholder
    
    def compose(self) -> ComposeResult:
        with Container(classes="dialog"):
            yield Label(self.title, classes="dialog-title")
            
            with Vertical(classes="form"):
                yield Label("File Path:")
                yield Input(placeholder=self.placeholder, id="filepath")
            
            with Horizontal(classes="dialog-buttons"):
                yield Button("OK", variant="success", id="ok")
                yield Button("Cancel", variant="default", id="cancel")
    
    @on(Button.Pressed, "#ok")
    def ok_action(self) -> None:
        filepath = self.query_one("#filepath", Input).value.strip()
        if not filepath:
            self.app.bell()
            return
        self.dismiss(filepath)
    
    @on(Button.Pressed, "#cancel")
    def cancel_action(self) -> None:
        self.dismiss(None)

class StudentsTab(TabPane):
    """Student management tab."""
    
    def __init__(self, title: str, db_manager: StutraDB):
        super().__init__(title, id="students-tab")
        self.db = db_manager
        self.students_data = []
        
    def compose(self) -> ComposeResult:
        with Vertical():
            with Horizontal(classes="tab-actions"):
                yield Button("Add Student", variant="success", id="add-student")
                yield Button("Edit Student", variant="primary", id="edit-student")
                yield Button("Remove Student", variant="error", id="remove-student")
                yield Button("Refresh", variant="default", id="refresh-students")
                yield Button("Import CSV", variant="default", id="import-csv")
                yield Button("Export CSV", variant="default", id="export-csv")
            
            yield DataTable(id="students-table")
    
    async def on_mount(self) -> None:
        """Initialize the students table."""
        table = self.query_one("#students-table", DataTable)
        table.add_columns("ID", "Name", "Admission", "Sections", "Created")
        await self.refresh_students()
    
    async def refresh_students(self) -> None:
        """Refresh the students table."""
        table = self.query_one("#students-table", DataTable)
        table.clear()
        
        try:
            self.students_data = self.db.list_students()
            
            for student in self.students_data:
                sections = student.get('sections', [])
                if isinstance(sections, str):
                    sections_str = sections
                elif isinstance(sections, list):
                    sections_str = ', '.join(sections)
                else:
                    sections_str = 'N/A'
                
                created = student.get('createdAt', '')[:10] if student.get('createdAt') else 'N/A'
                
                table.add_row(
                    student['id'][:8] + "...",
                    student.get('name', 'N/A'),
                    student.get('admissionNumber', 'N/A'),
                    sections_str,
                    created
                )
        except Exception as e:
            self.app.notify(f"Error loading students: {e}", severity="error")
    
    @on(Button.Pressed, "#add-student")
    async def add_student(self) -> None:
        """Show add student dialog."""
        sections_list = await self.get_sections_list()
        result = await self.app.push_screen(StudentFormDialog(sections_list=sections_list))
        
        if result:
            try:
                self.db.add_student(
                    result['name'],
                    result['admissionNumber'], 
                    result['sections'],
                    result['photoUrl']
                )
                self.app.notify("Student added successfully!", severity="information")
                await self.refresh_students()
            except Exception as e:
                self.app.notify(f"Error adding student: {e}", severity="error")
    
    @on(Button.Pressed, "#edit-student")
    async def edit_student(self) -> None:
        """Show edit student dialog."""
        table = self.query_one("#students-table", DataTable)
        if not table.cursor_row or table.cursor_row >= len(self.students_data):
            self.app.notify("Please select a student to edit", severity="warning")
            return
        
        student = self.students_data[table.cursor_row]
        sections_list = await self.get_sections_list()
        result = await self.app.push_screen(StudentFormDialog(student, sections_list))
        
        if result:
            try:
                # Update student data
                student_id = result['id']
                updated_data = {
                    'name': result['name'],
                    'admissionNumber': result['admissionNumber'],
                    'sections': result['sections'],
                    'photoUrl': result['photoUrl'],
                    'updatedAt': datetime.now().isoformat()
                }
                
                self.db._make_request('PUT', f'students/{student_id}', updated_data)
                self.app.notify("Student updated successfully!", severity="information")
                await self.refresh_students()
            except Exception as e:
                self.app.notify(f"Error updating student: {e}", severity="error")
    
    @on(Button.Pressed, "#remove-student")
    async def remove_student(self) -> None:
        """Remove selected student."""
        table = self.query_one("#students-table", DataTable)
        if not table.cursor_row or table.cursor_row >= len(self.students_data):
            self.app.notify("Please select a student to remove", severity="warning")
            return
        
        student = self.students_data[table.cursor_row]
        confirmed = await self.app.push_screen(
            ConfirmDialog(
                f"Are you sure you want to remove {student.get('name', 'this student')}?",
                "Remove Student"
            )
        )
        
        if confirmed:
            try:
                self.db.remove_student(student['id'])
                self.app.notify("Student removed successfully!", severity="information")
                await self.refresh_students()
            except Exception as e:
                self.app.notify(f"Error removing student: {e}", severity="error")
    
    @on(Button.Pressed, "#refresh-students")
    async def refresh_students_action(self) -> None:
        """Refresh students table."""
        await self.refresh_students()
        self.app.notify("Students refreshed", severity="information")
    
    @on(Button.Pressed, "#import-csv")
    async def import_csv(self) -> None:
        """Import students from CSV."""
        filepath = await self.app.push_screen(
            FileDialog("Import Students from CSV", "Enter CSV file path (e.g., students.csv)")
        )
        
        if filepath:
            try:
                self.db.import_students_csv(filepath)
                self.app.notify("Students imported successfully!", severity="information")
                await self.refresh_students()
            except Exception as e:
                self.app.notify(f"Error importing CSV: {e}", severity="error")
    
    @on(Button.Pressed, "#export-csv")
    async def export_csv(self) -> None:
        """Export students to CSV."""
        filepath = await self.app.push_screen(
            FileDialog("Export Students to CSV", "Enter CSV file path (e.g., students_export.csv)")
        )
        
        if filepath:
            try:
                self.db.export_students_csv(filepath)
                self.app.notify("Students exported successfully!", severity="information")
            except Exception as e:
                self.app.notify(f"Error exporting CSV: {e}", severity="error")
    
    async def get_sections_list(self) -> List[str]:
        """Get list of available sections."""
        try:
            sections = self.db.list_sections()
            return [info['name'] for info in sections.values()]
        except:
            return []

class TeachersTab(TabPane):
    """Teacher management tab."""
    
    def __init__(self, title: str, db_manager: StutraDB):
        super().__init__(title, id="teachers-tab")
        self.db = db_manager
        self.teachers_data = []
        
    def compose(self) -> ComposeResult:
        with Vertical():
            with Horizontal(classes="tab-actions"):
                yield Button("Add Teacher", variant="success", id="add-teacher")
                yield Button("Edit Teacher", variant="primary", id="edit-teacher")
                yield Button("Remove Teacher", variant="error", id="remove-teacher")
                yield Button("Refresh", variant="default", id="refresh-teachers")
                yield Button("View Students", variant="default", id="view-teacher-students")
            
            yield DataTable(id="teachers-table")
    
    async def on_mount(self) -> None:
        """Initialize the teachers table."""
        table = self.query_one("#teachers-table", DataTable)
        table.add_columns("ID", "Name", "Email", "Sections", "Created")
        await self.refresh_teachers()
    
    async def refresh_teachers(self) -> None:
        """Refresh the teachers table."""
        table = self.query_one("#teachers-table", DataTable)
        table.clear()
        
        try:
            self.teachers_data = self.db.list_teachers()
            
            for teacher in self.teachers_data:
                sections = teacher.get('assignedSections', [])
                sections_str = ', '.join(sections) if sections else 'None'
                
                created = teacher.get('createdAt', '')[:10] if teacher.get('createdAt') else 'N/A'
                
                table.add_row(
                    teacher['id'][:8] + "...",
                    teacher.get('name', 'N/A'),
                    teacher.get('email', 'N/A'),
                    sections_str,
                    created
                )
        except Exception as e:
            self.app.notify(f"Error loading teachers: {e}", severity="error")
    
    @on(Button.Pressed, "#add-teacher")
    async def add_teacher(self) -> None:
        """Show add teacher dialog."""
        sections_list = await self.get_sections_list()
        result = await self.app.push_screen(TeacherFormDialog(sections_list=sections_list))
        
        if result:
            try:
                self.db.add_teacher(
                    result['email'],
                    result['name'],
                    result['assignedSections']
                )
                self.app.notify("Teacher added successfully!", severity="information")
                await self.refresh_teachers()
            except Exception as e:
                self.app.notify(f"Error adding teacher: {e}", severity="error")
    
    @on(Button.Pressed, "#edit-teacher")
    async def edit_teacher(self) -> None:
        """Show edit teacher dialog."""
        table = self.query_one("#teachers-table", DataTable)
        if not table.cursor_row or table.cursor_row >= len(self.teachers_data):
            self.app.notify("Please select a teacher to edit", severity="warning")
            return
        
        teacher = self.teachers_data[table.cursor_row]
        sections_list = await self.get_sections_list()
        result = await self.app.push_screen(TeacherFormDialog(teacher, sections_list))
        
        if result:
            try:
                # Update teacher data
                teacher_id = result['id']
                updated_data = {
                    'name': result['name'],
                    'email': result['email'],
                    'assignedSections': result['assignedSections'],
                    'updatedAt': datetime.now().isoformat()
                }
                
                self.db._make_request('PUT', f'teachers/{teacher_id}', updated_data)
                self.app.notify("Teacher updated successfully!", severity="information")
                await self.refresh_teachers()
            except Exception as e:
                self.app.notify(f"Error updating teacher: {e}", severity="error")
    
    @on(Button.Pressed, "#remove-teacher")
    async def remove_teacher(self) -> None:
        """Remove selected teacher."""
        table = self.query_one("#teachers-table", DataTable)
        if not table.cursor_row or table.cursor_row >= len(self.teachers_data):
            self.app.notify("Please select a teacher to remove", severity="warning")
            return
        
        teacher = self.teachers_data[table.cursor_row]
        confirmed = await self.app.push_screen(
            ConfirmDialog(
                f"Are you sure you want to remove {teacher.get('name', 'this teacher')}?",
                "Remove Teacher"
            )
        )
        
        if confirmed:
            try:
                self.db.remove_teacher(teacher['id'])
                self.app.notify("Teacher removed successfully!", severity="information")
                await self.refresh_teachers()
            except Exception as e:
                self.app.notify(f"Error removing teacher: {e}", severity="error")
    
    @on(Button.Pressed, "#refresh-teachers")
    async def refresh_teachers_action(self) -> None:
        """Refresh teachers table."""
        await self.refresh_teachers()
        self.app.notify("Teachers refreshed", severity="information")
    
    @on(Button.Pressed, "#view-teacher-students")
    async def view_teacher_students(self) -> None:
        """View students accessible to selected teacher."""
        table = self.query_one("#teachers-table", DataTable)
        if not table.cursor_row or table.cursor_row >= len(self.teachers_data):
            self.app.notify("Please select a teacher to view their students", severity="warning")
            return
        
        teacher = self.teachers_data[table.cursor_row]
        try:
            students = self.db.list_students_for_teacher(teacher['id'])
            student_count = len(students)
            
            # Create a summary message
            sections = teacher.get('assignedSections', [])
            sections_str = ', '.join(sections) if sections else 'None'
            
            message = f"""
Teacher: {teacher.get('name', 'N/A')}
Email: {teacher.get('email', 'N/A')}
Assigned Sections: {sections_str}
Accessible Students: {student_count}

Students will be shown in the console output.
            """
            
            self.app.notify(message.strip(), severity="information")
            
        except Exception as e:
            self.app.notify(f"Error viewing teacher students: {e}", severity="error")
    
    async def get_sections_list(self) -> List[str]:
        """Get list of available sections."""
        try:
            sections = self.db.list_sections()
            return [info['name'] for info in sections.values()]
        except:
            return []

class SectionsTab(TabPane):
    """Section management tab."""
    
    def __init__(self, title: str, db_manager: StutraDB):
        super().__init__(title, id="sections-tab")
        self.db = db_manager
        self.sections_data = {}
        
    def compose(self) -> ComposeResult:
        with Vertical():
            with Horizontal(classes="tab-actions"):
                yield Button("Create Section", variant="success", id="create-section")
                yield Button("Refresh", variant="default", id="refresh-sections")
            
            yield DataTable(id="sections-table")
    
    async def on_mount(self) -> None:
        """Initialize the sections table."""
        table = self.query_one("#sections-table", DataTable)
        table.add_columns("ID", "Name", "Teachers", "Students", "Status")
        await self.refresh_sections()
    
    async def refresh_sections(self) -> None:
        """Refresh the sections table."""
        table = self.query_one("#sections-table", DataTable)
        table.clear()
        
        try:
            self.sections_data = self.db.list_sections()
            
            for section_id, section_info in self.sections_data.items():
                table.add_row(
                    section_id[:8] + "...",
                    section_info.get('name', 'N/A'),
                    str(section_info.get('teacher_count', 0)),
                    str(section_info.get('student_count', 0)),
                    "Active" if section_info.get('student_count', 0) > 0 else "Empty"
                )
        except Exception as e:
            self.app.notify(f"Error loading sections: {e}", severity="error")
    
    @on(Button.Pressed, "#create-section")
    async def create_section(self) -> None:
        """Show create section dialog."""
        result = await self.app.push_screen(SectionFormDialog())
        
        if result:
            try:
                self.db.create_section(result)
                self.app.notify(f"Section '{result}' created successfully!", severity="information")
                await self.refresh_sections()
            except Exception as e:
                self.app.notify(f"Error creating section: {e}", severity="error")
    
    @on(Button.Pressed, "#refresh-sections")
    async def refresh_sections_action(self) -> None:
        """Refresh sections table."""
        await self.refresh_sections()
        self.app.notify("Sections refreshed", severity="information")

class DatabaseTab(TabPane):
    """Database operations tab."""
    
    def __init__(self, title: str, db_manager: StutraDB):
        super().__init__(title, id="database-tab")
        self.db = db_manager
        self.stats = DatabaseStats()
        
    def compose(self) -> ComposeResult:
        with Vertical():
            with Horizontal(classes="tab-actions"):
                yield Button("Backup Database", variant="primary", id="backup-db")
                yield Button("Restore Database", variant="warning", id="restore-db")
                yield Button("Migrate to Multi-Section", variant="default", id="migrate-db")
                yield Button("Validate Data", variant="default", id="validate-data")
                yield Button("Refresh Stats", variant="default", id="refresh-stats")
            
            with Container(id="stats-container"):
                yield Label("Database Statistics", classes="stats-title")
                yield Static("Loading statistics...", id="stats-display")
    
    async def on_mount(self) -> None:
        """Initialize database stats."""
        await self.refresh_stats()
    
    async def refresh_stats(self) -> None:
        """Refresh database statistics."""
        try:
            # Get database stats
            data = self.db._make_request('GET', '')
            
            students_data = data.get('students', {})
            teachers_data = data.get('teachers', {})
            sections_data = data.get('sections', {})
            activities_data = data.get('activities', {})
            
            self.stats.students = len(students_data) if students_data else 0
            self.stats.teachers = len(teachers_data) if teachers_data else 0
            self.stats.sections = len(sections_data) if sections_data else 0
            self.stats.activities = len(activities_data) if activities_data else 0
            
            # Section breakdown
            sections_breakdown = {}
            if students_data:
                if isinstance(students_data, dict):
                    student_items = students_data.values()
                else:
                    student_items = students_data
                    
                for student_data in student_items:
                    if student_data is None:
                        continue
                        
                    if 'sections' in student_data:
                        student_sections = student_data.get('sections', [])
                        if isinstance(student_sections, list):
                            for section in student_sections:
                                sections_breakdown[section] = sections_breakdown.get(section, 0) + 1
                    else:
                        section = student_data.get('section', 'Unknown')
                        sections_breakdown[section] = sections_breakdown.get(section, 0) + 1
            
            self.stats.sections_breakdown = sections_breakdown
            
            # Update display
            stats_text = f"""📊 Database Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Total Students: {self.stats.students}
👨‍🏫 Total Teachers: {self.stats.teachers}
📚 Total Sections: {self.stats.sections}
📝 Total Activities: {self.stats.activities}

📋 Students by Section:"""
            
            for section, count in sorted(self.stats.sections_breakdown.items()):
                stats_text += f"\n   • {section}: {count} students"
            
            if not self.stats.sections_breakdown:
                stats_text += "\n   No section data available"
            
            stats_display = self.query_one("#stats-display", Static)
            stats_display.update(stats_text)
            
        except Exception as e:
            stats_display = self.query_one("#stats-display", Static)
            stats_display.update(f"Error loading statistics: {e}")
    
    @on(Button.Pressed, "#backup-db")
    async def backup_database(self) -> None:
        """Create database backup."""
        try:
            backup_file = self.db.backup_database()
            self.app.notify(f"Database backed up to: {backup_file}", severity="information")
        except Exception as e:
            self.app.notify(f"Error creating backup: {e}", severity="error")
    
    @on(Button.Pressed, "#restore-db")
    async def restore_database(self) -> None:
        """Restore database from backup."""
        filepath = await self.app.push_screen(
            FileDialog("Restore Database from Backup", "Enter backup file name (e.g., backup_20250127.json)")
        )
        
        if filepath:
            confirmed = await self.app.push_screen(
                ConfirmDialog(
                    "This will overwrite ALL data in the database. Are you sure?",
                    "Restore Database"
                )
            )
            
            if confirmed:
                try:
                    self.db.restore_database(filepath, confirm=True)
                    self.app.notify("Database restored successfully!", severity="information")
                    await self.refresh_stats()
                except Exception as e:
                    self.app.notify(f"Error restoring database: {e}", severity="error")
    
    @on(Button.Pressed, "#migrate-db")
    async def migrate_database(self) -> None:
        """Migrate database to multi-section format."""
        confirmed = await self.app.push_screen(
            ConfirmDialog(
                "This will migrate old single-section data to multi-section format. Continue?",
                "Migrate Database"
            )
        )
        
        if confirmed:
            try:
                success = self.db.migrate_to_multisection()
                if success:
                    self.app.notify("Database migration completed successfully!", severity="information")
                    await self.refresh_stats()
                else:
                    self.app.notify("Migration failed. Check console for details.", severity="error")
            except Exception as e:
                self.app.notify(f"Error during migration: {e}", severity="error")
    
    @on(Button.Pressed, "#validate-data")
    async def validate_data(self) -> None:
        """Validate data integrity."""
        try:
            is_valid = self.db.validate_data_integrity()
            if is_valid:
                self.app.notify("Data validation passed - all data is consistent!", severity="information")
            else:
                self.app.notify("Data validation failed - inconsistencies found! Check console for details.", severity="warning")
        except Exception as e:
            self.app.notify(f"Error during validation: {e}", severity="error")
    
    @on(Button.Pressed, "#refresh-stats")
    async def refresh_stats_action(self) -> None:
        """Refresh database statistics."""
        await self.refresh_stats()
        self.app.notify("Statistics refreshed", severity="information")

class StutraTUI(App):
    """Main Stutra Database Manager TUI Application."""
    
    TITLE = "Stutra Database Manager"
    SUB_TITLE = "Terminal User Interface for Firebase Database Management"
    
    CSS = """
    Screen {
        background: $background;
    }
    
    .tab-actions {
        height: 3;
        padding: 1;
        background: $surface;
    }
    
    .dialog {
        width: 80;
        height: auto;
        background: $surface;
        border: solid $primary;
        padding: 1;
    }
    
    .dialog-title {
        text-align: center;
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }
    
    .dialog-message {
        text-align: center;
        margin-bottom: 1;
    }
    
    .dialog-buttons {
        height: 3;
        align-horizontal: center;
    }
    
    .form {
        padding: 1 0;
    }
    
    .form Label {
        margin-bottom: 1;
        color: $text;
    }
    
    .form Input {
        margin-bottom: 2;
    }
    
    .stats-title {
        text-style: bold;
        color: $primary;
        text-align: center;
        margin-bottom: 1;
    }
    
    #stats-container {
        padding: 1;
        background: $surface;
        border: solid $primary;
        margin: 1;
    }
    
    #stats-display {
        padding: 1;
        background: $background;
        color: $text;
    }
    
    DataTable {
        height: 1fr;
    }
    
    Button {
        margin: 0 1;
    }
    """
    
    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("r", "refresh_all", "Refresh All"),
        Binding("h", "help", "Help"),
    ]
    
    def __init__(self):
        super().__init__()
        self.db = None
    
    def compose(self) -> ComposeResult:
        """Create child widgets for the app."""
        yield Header()
        
        # Check if database connection is available
        try:
            self.db = StutraDB()
            
            with TabbedContent(initial="students-tab"):
                yield StudentsTab("Students", self.db)
                yield TeachersTab("Teachers", self.db)
                yield SectionsTab("Sections", self.db)
                yield DatabaseTab("Database", self.db)
                
        except Exception as e:
            yield Container(
                Label("❌ Database Connection Error", classes="dialog-title"),
                Label(f"Failed to connect to Firebase database: {e}"),
                Label("\nPlease check your environment configuration:"),
                Label("1. Ensure .env.local or .env file exists in project root"),
                Label("2. Verify VITE_FIREBASE_DATABASE_URL is set correctly"),
                Label("3. Check your internet connection"),
                Label("\nPress 'q' to quit and fix the configuration."),
                classes="dialog"
            )
        
        yield Footer()
    
    def action_quit(self) -> None:
        """Quit the application."""
        self.exit()
    
    def action_help(self) -> None:
        """Show help information."""
        help_text = """
🔑 Keyboard Shortcuts:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

q - Quit application
r - Refresh all data
h - Show this help

📋 Navigation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tab - Switch between tabs
Enter - Activate selected button
Escape - Close dialogs
Arrow keys - Navigate tables and forms

🎯 Features:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Student Management: Add, edit, remove, and list students
• Teacher Management: Manage teachers and their section permissions
• Section Management: Create and organize sections
• Database Operations: Backup, restore, migrate, and validate data
• CSV Import/Export: Bulk data operations
• Real-time Statistics: View database metrics

🚀 Quick Start:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Start with the Database tab to check connection
2. Create sections in the Sections tab
3. Add teachers with section permissions in the Teachers tab
4. Add students and assign them to sections in the Students tab
5. Use CSV import for bulk student data

For detailed help, see the documentation in the docs/ folder.
        """
        
        self.notify(help_text.strip(), severity="information")
    
    async def action_refresh_all(self) -> None:
        """Refresh all data in all tabs."""
        try:
            # Get currently active tab
            tabbed_content = self.query_one(TabbedContent)
            active_tab = tabbed_content.active_pane
            
            if hasattr(active_tab, 'refresh_students'):
                await active_tab.refresh_students()
            elif hasattr(active_tab, 'refresh_teachers'):
                await active_tab.refresh_teachers()
            elif hasattr(active_tab, 'refresh_sections'):
                await active_tab.refresh_sections()
            elif hasattr(active_tab, 'refresh_stats'):
                await active_tab.refresh_stats()
            
            self.notify("Data refreshed", severity="information")
            
        except Exception as e:
            self.notify(f"Error refreshing data: {e}", severity="error")

def main():
    """Main entry point for the TUI application."""
    
    # Check for help argument
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        print("""
🎯 Stutra Database Manager TUI

A beautiful Terminal User Interface for managing the Firebase Realtime Database 
used by the Stutra attendance system.

Usage:
    python stutra_tui.py

Features:
    • Student Management (CRUD operations)
    • Teacher Management with Section Permissions  
    • Section Management
    • Database Operations (backup, restore, migrate)
    • CSV Import/Export
    • Real-time Statistics
    • Modern TUI with keyboard shortcuts

Requirements:
    • Python 3.7+
    • textual, rich, requests, python-dotenv
    • Firebase Realtime Database configured

Setup:
    1. Install dependencies: pip install -r requirements.txt
    2. Configure environment: Create .env.local with VITE_FIREBASE_DATABASE_URL
    3. Run: python stutra_tui.py

For detailed setup instructions, see scripts/README.md
        """)
        return
    
    # Run the TUI application
    app = StutraTUI()
    app.run()

if __name__ == "__main__":
    main()
