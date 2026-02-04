
import { Student } from '../types.ts';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'student_record_mgmt_db_v2';

export const storageService = {
  getStudents: (): Student[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Storage Retrieval Error", e);
      return [];
    }
  },

  saveStudents: (students: Student[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  },

  addStudent: (student: Student): void => {
    const students = storageService.getStudents();
    students.push(student);
    storageService.saveStudents(students);
  },

  updateStudent: (updatedStudent: Student): void => {
    const students = storageService.getStudents();
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
      students[index] = updatedStudent;
      storageService.saveStudents(students);
    }
  },

  deleteStudent: (id: string): void => {
    const students = storageService.getStudents();
    const filtered = students.filter(s => s.id !== id);
    storageService.saveStudents(filtered);
  },

  exportData: () => {
    const students = storageService.getStudents();
    if (students.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    // Transform data for high-quality Excel output
    const excelData = students.map(s => ({
      'Roll Number': s.rollNumber,
      'Full Name': s.name,
      'GPA': s.gpa,
      'Department': s.department,
      'Email': s.email,
      'System ID': s.id,
      'Enrollment Date': s.enrollmentDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Records");

    // Standard XLSX column width adjustment
    const wscols = [
      {wch: 15}, {wch: 25}, {wch: 10}, {wch: 25}, {wch: 30}, {wch: 40}, {wch: 25}
    ];
    worksheet['!cols'] = wscols;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudentRecords_DB_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (jsonData.length === 0) {
            reject('The selected file is empty.');
            return;
          }

          // Map back to Student interface with validation
          const students: Student[] = jsonData.map(item => ({
            rollNumber: String(item['Roll Number'] || 'N/A'),
            name: String(item['Full Name'] || 'Unknown'),
            gpa: Number(item['GPA'] || 0),
            department: String(item['Department'] || 'General'),
            email: String(item['Email'] || ''),
            id: String(item['System ID'] || crypto.randomUUID()),
            enrollmentDate: String(item['Enrollment Date'] || new Date().toISOString())
          }));

          storageService.saveStudents(students);
          resolve(students);
        } catch (err) {
          reject('Import failed: Ensure the file is a valid Excel Spreadsheet.');
        }
      };
      reader.onerror = () => reject('File reading error.');
      reader.readAsArrayBuffer(file);
    });
  }
};
