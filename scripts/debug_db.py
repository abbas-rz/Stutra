        #!/usr/bin/env python3
"""Simple debug script to check Firebase data structure."""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db_manager import StutraDB

def main():
    print("=== Firebase Data Structure Debug ===")
    
    db = StutraDB()
    
    # Check sections
    print("\n1. Sections data:")
    sections_data = db._make_request('GET', 'sections')
    print(f"   Type: {type(sections_data)}")
    print(f"   Data: {sections_data}")
    
    # Check students
    print("\n2. Students data (first 2 entries):")
    students_data = db._make_request('GET', 'students')
    print(f"   Type: {type(students_data)}")
    if isinstance(students_data, list):
        print(f"   Length: {len(students_data)}")
        for i, student in enumerate(students_data[:2]):
            if student:
                print(f"   Student {i}: {student}")
    else:
        print(f"   Data: {students_data}")

if __name__ == '__main__':
    main()
