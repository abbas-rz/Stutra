import { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import type { Student } from '../types';
import { DEFAULTS } from '../constants/index';
import { firebaseService } from '../services/firebase';

export interface UseStudentFiltersResult {
  searchTerm: string;
  selectedSection: string;
  filteredStudents: Student[];
  sections: string[];
  setSearchTerm: (term: string) => void;
  setSelectedSection: (section: string) => void;
  setSections: (sections: string[]) => void;
}

export function useStudentFilters(students: Student[]): UseStudentFiltersResult {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>(DEFAULTS.SECTION);
  const [sections, setSections] = useState<string[]>([DEFAULTS.SECTION]);

  // Load sections from service and students
  useEffect(() => {
    const loadSections = async () => {
      try {
        // Try to load from service first
        const serviceSections = await firebaseService.getSections();
        if (serviceSections.length > 0) {
          setSections([DEFAULTS.SECTION, ...serviceSections]);
          return;
        }
      } catch {
        // Could not load sections from service, extracting from students
      }

      // Fallback: extract from students (using multi-section support)
      if (students.length > 0) {
        const allSectionsSet = new Set<string>();
        students.forEach(student => {
          // Handle both old single-section and new multi-section formats
          if (student.sections && Array.isArray(student.sections)) {
            student.sections.forEach(section => allSectionsSet.add(section));
          } else if (student.section) {
            allSectionsSet.add(student.section);
          }
        });
        const uniqueSections = Array.from(allSectionsSet);
        const sectionsWithAll = [DEFAULTS.SECTION, ...uniqueSections.sort()];
        setSections(sectionsWithAll);
      }
    };

    loadSections();
  }, [students]);

  // Filter students based on section and search term
  const filteredStudents = useMemo(() => {
    let studentsToFilter = students;
    
    // Filter by section first (support multi-section students)
    if (selectedSection && selectedSection !== DEFAULTS.SECTION) {
      studentsToFilter = students.filter(student => {
        // Check if student belongs to the selected section
        if (student.sections && Array.isArray(student.sections)) {
          return student.sections.includes(selectedSection);
        } else if (student.section) {
          // Backward compatibility
          return student.section === selectedSection;
        }
        return false;
      });
    }
    
    // Then apply search filter
    if (searchTerm) {
      const filteredForSearch = selectedSection && selectedSection !== DEFAULTS.SECTION
        ? students.filter(student => {
            if (student.sections && Array.isArray(student.sections)) {
              return student.sections.includes(selectedSection);
            } else if (student.section) {
              return student.section === selectedSection;
            }
            return false;
          })
        : students;
      
      const fuseForSearch = new Fuse(filteredForSearch, {
        keys: ['name', 'admission_number'],
        threshold: 0.3,
      });
      
      const results = fuseForSearch.search(searchTerm);
      return results.map(result => result.item).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Sort all students alphabetically by name
    return studentsToFilter.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, students, selectedSection]);

  return {
    searchTerm,
    selectedSection,
    filteredStudents,
    sections,
    setSearchTerm,
    setSelectedSection,
    setSections,
  };
}
