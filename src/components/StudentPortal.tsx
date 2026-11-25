import React, { useState } from 'react';
import { 
  GraduationCap, Search, Award, BookOpen, 
  CheckCircle, AlertCircle, Download, FileText, UserCheck, Sparkles 
} from 'lucide-react';
import { Course, StudentGrade } from '../types';
import { calculateTotalScore, getGradeLetter } from '../data/mockStudents';

interface StudentPortalProps {
  courses: Course[];
  allCourseStudents: { [courseId: string]: { students: StudentGrade[]; isPublished: boolean } };
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ courses, allCourseStudents }) => {
  const [selectedStudentId, setSelectedStudentId] = useState('STU001');
  const [searchIdInput, setSearchIdInput] = useState('');

  // Get list of all unique students from course 1
  const baseStudents = allCourseStudents[courses[0]?.id]?.students || [];
  const currentStudent = baseStudents.find(s => s.studentId === selectedStudentId) || baseStudents[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = baseStudents.find(s => 
      s.studentId.toLowerCase() === searchIdInput.trim().toLowerCase() ||
      s.name.toLowerCase().includes(searchIdInput.trim().toLowerCase())
    );
    if (found) {
      setSelectedStudentId(found.studentId);
      setSearchIdInput('');
    } else {
      alert('Student not found. Please check the ID (e.g. STU001) or name.');
    }
  };

  if (!currentStudent) {
    return <div className="p-8 text-center text-slate-500">Loading student records...</div>;
  }

  // Calculate overall GPA across all courses for this student
  let totalScoreSum = 0;
  courses.forEach(course => {
    const courseData = allCourseStudents[course.id];
    const studentRecord = courseData?.students.find(s => s.studentId === currentStudent.studentId);
    if (studentRecord) {
      totalScoreSum += calculateTotalScore(studentRecord.marks, course.id);
    }
  });
  const overallAverage = Math.round((totalScoreSum / courses.length) * 10) / 10;
  const overallGrade = getGradeLetter(overallAverage);

  const handleDownloadTranscript = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Selector / Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-2xl flex items-center justify-center shadow-inner">
            {currentStudent.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/40">
                Student Portal
              </span>
              <span className="text-xs text-slate-300 font-mono">{currentStudent.studentId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">{currentStudent.name}</h1>
            <p className="text-emerald-200 text-xs mt-0.5">{currentStudent.department} • {currentStudent.email}</p>
          </div>
        </div>

        {/* Search Student ID */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Switch ID (e.g. STU045)"
              value={searchIdInput}
              onChange={(e) => setSearchIdInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
          >
            Switch
          </button>
        </form>
      </div>

      {/* Academic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Cumulative GPA</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{overallAverage}%</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Standing: {overallGrade.letter} (Honors)</p>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl">
            <Award className="h-7 w-7 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester Attendance</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{currentStudent.attendanceRate}%</h3>
            <p className="text-xs text-slate-500 mt-1">Excellent class presence</p>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl">
            <UserCheck className="h-7 w-7 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{courses.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Fall 2026 Semester</p>
          </div>
          <div className="bg-indigo-50 p-3.5 rounded-2xl">
            <BookOpen className="h-7 w-7 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Enrolled Course Grades & Feedback</h2>
        <button
          onClick={handleDownloadTranscript}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2 transition"
        >
          <Download className="h-4 w-4" />
          <span>Download Official Transcript</span>
        </button>
      </div>

      {/* Course Cards List */}
      <div className="space-y-6">
        {courses.map(course => {
          const courseData = allCourseStudents[course.id];
          const isPublished = courseData?.isPublished ?? true;
          const studentRecord = courseData?.students.find(s => s.studentId === currentStudent.studentId) || currentStudent;
          const total = calculateTotalScore(studentRecord.marks, course.id);
          const gradeInfo = getGradeLetter(total);

          return (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-500/30 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-md border border-indigo-500/30">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-400">{course.semester} • {course.credits} Credits</span>
                  </div>
                  <h3 className="text-lg font-bold mt-1">{course.name}</h3>
                  <p className="text-xs text-slate-300">Instructor: {course.instructor}</p>
                </div>

                {isPublished ? (
                  <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Score</div>
                      <div className="text-lg font-bold text-white">{total}%</div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${gradeInfo.color}`}>
                      {gradeInfo.letter}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span>Grades under review (Unpublished)</span>
                  </div>
                )}
              </div>

              {isPublished ? (
                <div className="p-6 space-y-6">
                  {/* Assessment Components Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assessment Breakdown</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {course.components.map(comp => {
                        const score = studentRecord.marks[comp.id] ?? 0;
                        return (
                          <div key={comp.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="text-xs font-medium text-slate-500">{comp.name}</div>
                            <div className="text-xl font-bold text-slate-900 mt-1">{score} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
                            <div className="text-[10px] text-indigo-600 font-semibold mt-1">Weight: {comp.weight}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Professor Feedback Remark */}
                  {studentRecord.feedback && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3">
                      <div className="bg-indigo-600 p-2 rounded-xl text-white mt-0.5">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-indigo-900 uppercase">Professor Feedback Remark</h5>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed italic">
                          "{studentRecord.feedback}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Scores for this course have not been published by the instructor yet.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
