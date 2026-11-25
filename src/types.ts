export interface GradeComponent {
  id: string;
  name: string;
  weight: number; // percentage, e.g. 20
  maxMarks: number; // e.g. 100
}

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  credits: number;
  instructor: string;
  components: GradeComponent[];
}

export interface StudentGrade {
  studentId: string;
  name: string;
  email: string;
  department: string;
  avatar?: string;
  attendanceRate: number; // percentage e.g. 94
  marks: {
    [componentId: string]: number; // score obtained
  };
  feedback: string;
  status: 'draft' | 'submitted' | 'verified';
  updatedAt?: string;
}

export interface CourseData {
  courseId: string;
  students: StudentGrade[];
  isPublished: boolean;
}
