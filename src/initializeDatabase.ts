import { googleSheetsService } from './services/googleSheets';

// Script to initialize database with XI Raman students
async function initializeDatabase() {
  try {
    console.log('Initializing Firebase...');
    await googleSheetsService.initialize();
    
    console.log('Resetting all students...');
    await googleSheetsService.resetAllStudents();
    
    console.log('Database initialized successfully with XI Raman students!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };
