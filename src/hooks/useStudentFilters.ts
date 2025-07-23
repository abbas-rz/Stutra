import { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import type { Student } from '../types';
import { DEFAULTS } from '../constants/index';
import { googleSheetsService } from '../services/googleSheets';

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
        const serviceSections = await googleSheetsService.getSections();
        if (serviceSections.length > 0) {
          setSections([DEFAULTS.SECTION, ...serviceSections]);
          return;
        }
      } catch {
        console.log('Could not load sections from service, extracting from students');
      }

      // Fallback: extract from students
      if (students.length > 0) {
        const uniqueSections = Array.from(new Set(students.map(student => student.section)));
        const sectionsWithAll = [DEFAULTS.SECTION, ...uniqueSections.sort()];
        setSections(sectionsWithAll);
      }
    };

    loadSections();
  }, [students]);

  // Filter students based on section and search term
  const filteredStudents = useMemo(() => {
    let studentsToFilter = students;
    
    // Filter by section first
    if (selectedSection && selectedSection !== DEFAULTS.SECTION) {
      studentsToFilter = students.filter(student => student.section === selectedSection);
    }
    
    // Then apply search filter
    if (searchTerm) {
      const filteredForSearch = selectedSection && selectedSection !== DEFAULTS.SECTION
        ? students.filter(student => student.section === selectedSection)
        : students;
      
      const fuseForSearch = new Fuse(filteredForSearch, {
        keys: ['name', 'admission_number'],
        threshold: 0.3,
      });
      
      const results = fuseForSearch.search(searchTerm);
      return results.map(result => result.item);
    }
    
    return studentsToFilter;
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
