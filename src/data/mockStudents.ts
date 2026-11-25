import { Course, StudentGrade } from '../types';

export const COURSES: Course[] = [
  {
    id: 'cs101',
    code: 'CS101',
    name: 'Data Structures & Algorithms',
    semester: 'Fall 2026',
    credits: 4,
    instructor: 'Dr. Alan Turing',
    components: [
      { id: 'assign1', name: 'Assignment 1', weight: 15, maxMarks: 100 },
      { id: 'midterm', name: 'Midterm Exam', weight: 30, maxMarks: 100 },
      { id: 'assign2', name: 'Assignment 2', weight: 15, maxMarks: 100 },
      { id: 'final', name: 'Final Exam', weight: 40, maxMarks: 100 },
    ],
  },
  {
    id: 'math201',
    code: 'MATH201',
    name: 'Advanced Linear Algebra',
    semester: 'Fall 2026',
    credits: 3,
    instructor: 'Dr. Katherine Johnson',
    components: [
      { id: 'quizzes', name: 'Weekly Quizzes', weight: 20, maxMarks: 100 },
      { id: 'midterm', name: 'Midterm Examination', weight: 35, maxMarks: 100 },
      { id: 'project', name: 'Computation Project', weight: 15, maxMarks: 100 },
      { id: 'final', name: 'Final Exam', weight: 30, maxMarks: 100 },
    ],
  },
  {
    id: 'phy102',
    code: 'PHY102',
    name: 'Quantum Physics Principles',
    semester: 'Fall 2026',
    credits: 4,
    instructor: 'Dr. Richard Feynman',
    components: [
      { id: 'labs', name: 'Lab Reports', weight: 25, maxMarks: 100 },
      { id: 'midterm', name: 'Midterm Assessment', weight: 30, maxMarks: 100 },
      { id: 'homework', name: 'Problem Sets', weight: 10, maxMarks: 100 },
      { id: 'final', name: 'Comprehensive Final', weight: 35, maxMarks: 100 },
    ],
  },
];

const FIRST_NAMES = [
  'Aiden', 'Sophia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Jackson', 'Ava', 'Lucas', 'Isabella',
  'Mason', 'Mia', 'Ethan', 'Harper', 'Alexander', 'Evelyn', 'Oliver', 'Abigail', 'Elijah', 'Emily',
  'Benjamin', 'Elizabeth', 'Logan', 'Mila', 'James', 'Ella', 'Evelyn', 'Aria', 'Harper', 'Sofia',
  'Michael', 'Camila', 'Daniel', 'Aria', 'Henry', 'Scarlett', 'Theodore', 'Victoria', 'Caleb', 'Madison',
  'Nathan', 'Luna', 'Owen', 'Grace', 'Gabriel', 'Chloe', 'Ryan', 'Penelope', 'Asher', 'Layla',
  'Leo', 'Riley', 'Lincoln', 'Zoey', 'Grayson', 'Nora', 'Julian', 'Lily', 'Mateo', 'Eleanor',
  'Ezra', 'Hannah', 'Jaxon', 'Lillian', 'Axel', 'Addison', 'Carson', 'Aubrey', 'Maverick', 'Ellie',
  'Ezekiel', 'Stella', 'Jose', 'Natalie', 'Isaiah', 'Zoe', 'Charles', 'Leah', 'Hudson', 'Hazel',
  'Dominic', 'Violet', 'Josiah', 'Aurora', 'Xavier', 'Savannah', 'Christian', 'Audrey', 'Hunter', 'Brooklyn',
  'Thomas', 'Bella', 'Landon', 'Claire', 'Easton', 'Skylar', 'Nolan', 'Paisley', 'Jeremiah', 'Everly'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const DEPARTMENTS = [
  'Computer Science', 'Computer Science', 'Computer Science', 
  'Electrical Engineering', 'Electrical Engineering', 
  'Mechanical Engineering', 'Mathematics', 'Physics'
];

export function generate100Students(courseId: string): StudentGrade[] {
  const students: StudentGrade[] = [];
  const seedMultiplier = courseId === 'cs101' ? 1.0 : courseId === 'math201' ? 0.95 : 1.05;

  for (let i = 1; i <= 100; i++) {
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor((i - 1) / FIRST_NAMES.length) % LAST_NAMES.length] || LAST_NAMES[i % LAST_NAMES.length];
    const studentId = `STU${String(i).padStart(3, '0')}`;
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@university.edu`;

    // Realistic baseline marks between 60 and 98
    const base = Math.min(98, Math.max(50, Math.round(75 + (Math.sin(i * 12.3) * 18) * seedMultiplier)));
    
    let marks: { [key: string]: number } = {};
    if (courseId === 'cs101') {
      marks = {
        assign1: Math.min(100, Math.max(40, base + Math.round(Math.cos(i) * 10))),
        midterm: Math.min(100, Math.max(35, base + Math.round(Math.sin(i * 2) * 12))),
        assign2: Math.min(100, Math.max(45, base + Math.round(Math.cos(i * 3) * 8))),
        final: Math.min(100, Math.max(30, base + Math.round(Math.sin(i * 4) * 15))),
      };
    } else if (courseId === 'math201') {
      marks = {
        quizzes: Math.min(100, Math.max(50, base + Math.round(Math.sin(i) * 10))),
        midterm: Math.min(100, Math.max(30, base + Math.round(Math.cos(i * 2) * 14))),
        project: Math.min(100, Math.max(60, base + Math.round(Math.sin(i * 3) * 8))),
        final: Math.min(100, Math.max(35, base + Math.round(Math.cos(i * 4) * 12))),
      };
    } else {
      marks = {
        labs: Math.min(100, Math.max(55, base + Math.round(Math.cos(i) * 9))),
        midterm: Math.min(100, Math.max(35, base + Math.round(Math.sin(i * 1.5) * 11))),
        homework: Math.min(100, Math.max(60, base + Math.round(Math.cos(i * 2.5) * 10))),
        final: Math.min(100, Math.max(30, base + Math.round(Math.sin(i * 3.5) * 14))),
      };
    }

    const attendanceRate = Math.min(100, Math.max(70, Math.round(88 + (Math.sin(i * 7) * 12))));

    let feedback = '';
    const avg = calculateTotalScore(marks, courseId);
    if (avg >= 90) {
      feedback = 'Outstanding academic performance. Demonstrates exceptional grasp of advanced concepts.';
    } else if (avg >= 80) {
      feedback = 'Very good work throughout the semester. Solid analytical skills and consistent participation.';
    } else if (avg >= 70) {
      feedback = 'Satisfactory performance. Meets expectations; can improve with deeper problem-solving practice.';
    } else if (avg >= 60) {
      feedback = 'Passing grade. Requires more attention to coursework and foundational theory in upcoming modules.';
    } else {
      feedback = 'Needs immediate academic support. Please schedule office hours for remedial guidance.';
    }

    students.push({
      studentId,
      name: `${firstName} ${lastName}`,
      email,
      department,
      attendanceRate,
      marks,
      feedback,
      status: i % 5 === 0 ? 'draft' : 'verified',
      updatedAt: '2026-11-24',
    });
  }

  return students;
}

export function calculateTotalScore(marks: { [key: string]: number }, courseId: string): number {
  const course = COURSES.find(c => c.id === courseId) || COURSES[0];
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const comp of course.components) {
    const score = marks[comp.id] ?? 0;
    totalWeighted += score * (comp.weight / 100);
    totalWeight += comp.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round((totalWeighted / (totalWeight / 100)) * 10) / 10;
}

export function getGradeLetter(score: number): { letter: string; color: string } {
  if (score >= 93) return { letter: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (score >= 87) return { letter: 'A', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (score >= 80) return { letter: 'B+', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (score >= 75) return { letter: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (score >= 70) return { letter: 'C+', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (score >= 60) return { letter: 'C', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (score >= 50) return { letter: 'D', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  return { letter: 'F', color: 'text-rose-700 bg-rose-50 border-rose-200' };
}
