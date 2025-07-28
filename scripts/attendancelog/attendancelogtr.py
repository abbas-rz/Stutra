import json
import pandas as pd
import glob
import os
from datetime import datetime
from collections import defaultdict

def get_student_sections_from_json(json_file_path):
    """
    Extract student sections mapping from JSON file
    Returns a dictionary: {student_name: [sections]}
    """
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    students = data.get('students', {})
    student_sections = {}
    
    for student_id, student_info in students.items():
        student_name = student_info.get('name', '')
        sections = student_info.get('sections', [])
        if student_name:
            student_sections[student_name] = sections
    
    return student_sections

def find_latest_attendance_csv():
    """
    Find the latest dated attendance CSV file in the current directory
    """
    # Look for attendance CSV files with date pattern
    csv_files = glob.glob('attendance_*.csv')
    
    if not csv_files:
        raise FileNotFoundError("No attendance CSV files found in current directory")
    
    # Sort files by modification time (most recent first)
    csv_files.sort(key=os.path.getmtime, reverse=True)
    
    return csv_files[0]

def process_attendance_data(csv_file_path, student_sections):
    """
    Process CSV attendance data and organize by sections
    """
    df = pd.read_csv(csv_file_path)
    
    # Get the date column (should be the last column that's not "Student Name" or "Roll Number")
    date_columns = [col for col in df.columns if col not in ['Student Name', 'Roll Number']]
    if not date_columns:
        raise ValueError("No date column found in CSV file")
    
    # Use the last date column (most recent)
    date_column = date_columns[-1]
    print(f"Using attendance data for date: {date_column}")
    
    # Initialize section data
    section_data = defaultdict(lambda: {
        'total_strength': 0,
        'present': [],
        'absent': [],
        'all_students': set()
    })
    
    # Process each student
    for _, row in df.iterrows():
        student_name = row['Student Name']
        attendance_status = row[date_column]
        
        # Get sections for this student from JSON data
        sections = student_sections.get(student_name, ['Unknown Section'])
        
        # Add student to each of their sections
        for section in sections:
            section_data[section]['all_students'].add(student_name)
            section_data[section]['total_strength'] += 1
            
            if attendance_status == 'P':
                section_data[section]['present'].append(student_name)
            else:  # 'A' or any other value considered absent
                section_data[section]['absent'].append(student_name)
    
    return section_data, date_column

def create_outputs_folder():
    """
    Create outputs folder if it doesn't exist
    """
    outputs_folder = "outputs"
    if not os.path.exists(outputs_folder):
        os.makedirs(outputs_folder)
        print(f"Created outputs folder: {outputs_folder}")
    return outputs_folder

def generate_attendance_report(section_data, date):
    """
    Generate attendance report in the requested format and save to CSV
    """
    # Create outputs folder
    outputs_folder = create_outputs_folder()
    
    # Print to console
    print("=" * 120)
    print(f"ATTENDANCE REPORT - {date}")
    print("=" * 120)
    print(f"{'Section':<25} {'Total Strength':<15} {'Present':<10} {'Absent':<10} {'Absentees'}")
    print("-" * 120)
    
    # Prepare data for CSV
    csv_data = []
    
    for section, data in sorted(section_data.items()):
        total_strength = data['total_strength']
        num_present = len(data['present'])
        num_absent = len(data['absent'])
        absentees = ', '.join(sorted(data['absent'])) if data['absent'] else "None"
        
        # For console display, truncate absentees list if too long
        display_absentees = absentees
        if len(display_absentees) > 80:
            display_absentees = display_absentees[:77] + "..."
        
        print(f"{section:<25} {total_strength:<15} {num_present:<10} {num_absent:<10} {display_absentees}")
        
        # Add to CSV data (full absentees list, not truncated)
        csv_data.append({
            'Section': section,
            'Total_Strength': total_strength,
            'Present': num_present,
            'Absent': num_absent,
            'Attendance_Rate': f"{(num_present/total_strength)*100:.1f}%" if total_strength > 0 else "0.0%",
            'Absentees': absentees
        })
    
    # Save to CSV
    df = pd.DataFrame(csv_data)
    csv_filename = f"attendance_report_{date.replace('/', '_').replace(' ', '_')}.csv"
    csv_path = os.path.join(outputs_folder, csv_filename)
    df.to_csv(csv_path, index=False, encoding='utf-8')
    
    return csv_path

def generate_detailed_student_report(section_data, date, outputs_folder):
    """
    Generate detailed student attendance report with individual student records
    """
    detailed_data = []
    
    for section, data in section_data.items():
        # Add present students
        for student in data['present']:
            detailed_data.append({
                'Student_Name': student,
                'Section': section,
                'Date': date,
                'Status': 'Present'
            })
        
        # Add absent students
        for student in data['absent']:
            detailed_data.append({
                'Student_Name': student,
                'Section': section,
                'Date': date,
                'Status': 'Absent'
            })
    
    # Sort by section then by student name
    detailed_data.sort(key=lambda x: (x['Section'], x['Student_Name']))
    
    # Save detailed report to CSV
    df_detailed = pd.DataFrame(detailed_data)
    detailed_csv_filename = f"detailed_attendance_{date.replace('/', '_').replace(' ', '_')}.csv"
    detailed_csv_path = os.path.join(outputs_folder, detailed_csv_filename)
    df_detailed.to_csv(detailed_csv_path, index=False, encoding='utf-8')
    
    return detailed_csv_path

def main():
    try:
        # Get student sections from JSON
        print("Loading student sections from master.json...")
        student_sections = get_student_sections_from_json('master.json')
        print(f"Loaded sections for {len(student_sections)} students")
        
        # Find latest attendance CSV
        print("\nSearching for latest attendance CSV file...")
        csv_file = find_latest_attendance_csv()
        print(f"Found latest attendance file: {csv_file}")
        
        # Process attendance data
        print("\nProcessing attendance data...")
        section_data, date_used = process_attendance_data(csv_file, student_sections)
        
        # Generate report
        print("\nGenerating attendance report...")
        csv_path = generate_attendance_report(section_data, date_used)
        
        # Generate detailed student report
        outputs_folder = create_outputs_folder()
        detailed_csv_path = generate_detailed_student_report(section_data, date_used, outputs_folder)
        
        # Summary statistics
        print("\n" + "=" * 120)
        print("SUMMARY")
        print("=" * 120)
        total_students = sum(data['total_strength'] for data in section_data.values())
        total_present = sum(len(data['present']) for data in section_data.values())
        total_absent = sum(len(data['absent']) for data in section_data.values())
        
        print(f"Total Students: {total_students}")
        print(f"Total Present: {total_present}")
        print(f"Total Absent: {total_absent}")
        print(f"Overall Attendance Rate: {(total_present/total_students)*100:.1f}%")
        print(f"\nReports saved to:")
        print(f"  - Summary report: {csv_path}")
        print(f"  - Detailed report: {detailed_csv_path}")
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Please ensure 'master.json' exists and attendance CSV files are in the current directory")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
