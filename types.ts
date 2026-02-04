
export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  gpa: number;
  department: string;
  email: string;
  enrollmentDate: string;
}

export type StudentFormData = Omit<Student, 'id' | 'enrollmentDate'>;

export interface DashboardStats {
  totalStudents: number;
  averageGpa: number;
  topPerformer: string;
  departmentCount: Record<string, number>;
}
