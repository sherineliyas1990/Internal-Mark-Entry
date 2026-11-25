import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Upload, Sparkles, 
  Users, Award, AlertCircle, CheckCircle, Clock, 
  BookOpen, Edit3, Save, RefreshCw, BarChart2, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { Course, StudentGrade } from '../types';
import { calculateTotalScore, getGradeLetter } from '../data/mockStudents';

interface ProfessorDashboardProps {
  course: Course;
  students: StudentGrade[];
  setStudents: React.Dispatch<React.SetStateAction<StudentGrade[]>>;
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({
  course,
  students,
  setStudents,
  isPublished,
  setIsPublished,
  onSave,
  hasUnsavedChanges,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentGrade | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<string | null>(null); // studentId or 'class'
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = deptFilter === 'ALL' || student.department === deptFilter;
      const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, searchQuery, deptFilter, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (students.length === 0) return { avg: 0, passRate: 0, highest: 0, lowest: 0 };
    let totalScoreSum = 0;
    let passCount = 0;
    let highest = 0;
    let lowest = 100;

    students.forEach(st => {
      const score = calculateTotalScore(st.marks, course.id);
      totalScoreSum += score;
      if (score >= 50) passCount++;
      if (score > highest) highest = score;
      if (score < lowest) lowest = score;
    });

    return {
      avg: Math.round((totalScoreSum / students.length) * 10) / 10,
      passRate: Math.round((passCount / students.length) * 100),
      highest,
      lowest: lowest === 100 ? 0 : lowest,
    };
  }, [students, course.id]);

  // Handle mark change
  const handleMarkChange = (studentId: string, componentId: string, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(value) || 0));
    setStudents(prev => 
      prev.map(st => {
        if (st.studentId === studentId) {
          return {
            ...st,
            marks: { ...st.marks, [componentId]: numValue },
            status: 'draft',
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return st;
      })
    );
  };

  // Generate AI feedback for single student
  const handleGenerateAiFeedback = async (student: StudentGrade) => {
    setIsGeneratingAI(student.studentId);
    try {
      const totalScore = calculateTotalScore(student.marks, course.id);
      const res = await fetch('/api/gemini/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          courseName: course.name,
          totalScore,
          marks: student.marks,
          attendanceRate: student.attendanceRate,
        })
      });
      const data = await res.json();
      if (data.feedback) {
        setStudents(prev => prev.map(st => st.studentId === student.studentId ? { ...st, feedback: data.feedback } : st));
        showToast(`AI feedback generated for ${student.name}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to generate AI feedback');
    } finally {
      setIsGeneratingAI(null);
    }
  };

  // Generate Class AI Summary
  const handleGenerateClassSummary = async () => {
    setIsGeneratingAI('class');
    try {
      const res = await fetch('/api/gemini/class-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.name,
          stats: {
            totalEnrolled: students.length,
            classAverage: stats.avg,
            passRate: stats.passRate,
            highestScore: stats.highest,
            lowestScore: stats.lowest,
          }
        })
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to generate class summary');
    } finally {
      setIsGeneratingAI(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Student ID', 'Name', 'Email', 'Department', 'Attendance %', ...course.components.map(c => c.name), 'Total Score', 'Grade', 'Status'];
    const rows = students.map(st => {
      const total = calculateTotalScore(st.marks, course.id);
      const grade = getGradeLetter(total).letter;
      return [
        st.studentId,
        `"${st.name}"`,
        st.email,
        `"${st.department}"`,
        st.attendanceRate,
        ...course.components.map(c => st.marks[c.id] ?? 0),
        total,
        grade,
        st.status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${course.code}_grades_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Grades exported to CSV successfully');
  };

  // Import CSV / Paste Handler
  const handleImportSubmit = () => {
    try {
      const lines = importText.trim().split('\n');
      if (lines.length < 2) {
        alert('Please paste valid CSV data with header row.');
        return;
      }
      
      let updatedCount = 0;
      const newStudents = [...students];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
        const studentId = parts[0];
        const student = newStudents.find(s => s.studentId === studentId);
        if (student && parts.length >= 5 + course.components.length) {
          // parse marks
          course.components.forEach((comp, idx) => {
            const markVal = parseFloat(parts[5 + idx]);
            if (!isNaN(markVal)) {
              student.marks[comp.id] = Math.min(100, Math.max(0, markVal));
            }
          });
          student.status = 'verified';
          updatedCount++;
        }
      }

      setStudents(newStudents);
      setShowImportModal(false);
      setImportText('');
      showToast(`Successfully imported/updated grades for ${updatedCount} students`);
    } catch (e) {
      alert('Error parsing CSV format. Please check the structure.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-indigo-500/30 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30">
              {course.code} • {course.semester}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
              isPublished ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              {isPublished ? 'Published to Students' : 'Draft / Unpublished'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.name}</h1>
          <p className="text-slate-300 text-sm mt-1">Instructor: <span className="font-medium text-white">{course.instructor}</span> • Credits: {course.credits}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Publish Toggle */}
          <button
            onClick={() => {
              setIsPublished(!isPublished);
              showToast(isPublished ? 'Grades unpublished from students' : 'Grades successfully published to students!');
            }}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition shadow-sm flex items-center space-x-2 ${
              isPublished 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <span>{isPublished ? 'Unpublish Grades' : 'Publish to Students'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-2 transition"
          >
            <Download className="h-4 w-4 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-2 transition"
          >
            <Upload className="h-4 w-4 text-emerald-400" />
            <span>Import / Paste</span>
          </button>

          <button
            onClick={onSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-2 transition ${
              hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>{hasUnsavedChanges ? 'Save Marks*' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{students.length}</h3>
            <p className="text-xs text-slate-500 mt-1">100% active roster</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Average</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.avg}%</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Letter: {getGradeLetter(stats.avg).letter}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl">
            <BarChart2 className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Rate (≥50%)</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.passRate}%</h3>
            <p className="text-xs text-slate-500 mt-1">{Math.round((stats.passRate * students.length) / 100)} passing students</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl">
            <Award className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest / Lowest</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.highest}% / {stats.lowest}%</h3>
            <p className="text-xs text-slate-500 mt-1">Spread: {stats.highest - stats.lowest} pts</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* AI Professor Assistant Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-indigo-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
            <Sparkles className="h-7 w-7 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold">Gemini Professor AI Assistant</h2>
              <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">AI Powered</span>
            </div>
            <p className="text-indigo-200 text-xs mt-1 max-w-2xl">
              Instantly analyze class performance distribution, flag at-risk students, or generate tailored academic remarks with a single click.
            </p>
            {aiSummary && (
              <div className="mt-3 bg-black/30 p-3 rounded-xl text-xs text-indigo-100 border border-indigo-500/20 whitespace-pre-line">
                <strong>Class AI Analysis:</strong> {aiSummary}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleGenerateClassSummary}
          disabled={isGeneratingAI === 'class'}
          className="bg-white text-indigo-950 font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-indigo-50 transition shadow-md flex items-center space-x-2 shrink-0"
        >
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span>{isGeneratingAI === 'class' ? 'Analyzing Class...' : 'Generate Class Analytics'}</span>
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="draft">Draft (Unsaved)</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium ml-auto">
            Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of {students.length} students
          </span>
        </div>
      </div>

      {/* Main Student Mark Entry Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">Student ID & Name</th>
                <th className="py-4 px-3">Department</th>
                <th className="py-4 px-3">Attendance</th>
                {course.components.map(comp => (
                  <th key={comp.id} className="py-4 px-3 text-center">
                    <div>{comp.name}</div>
                    <span className="text-[10px] text-slate-400 font-normal">({comp.weight}%)</span>
                  </th>
                ))}
                <th className="py-4 px-3 text-center">Total Score</th>
                <th className="py-4 px-3 text-center">Grade</th>
                <th className="py-4 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6 + course.components.length} className="py-12 text-center text-slate-500">
                    No students found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const total = calculateTotalScore(student.marks, course.id);
                  const gradeInfo = getGradeLetter(total);
                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50/80 transition">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs shrink-0">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-500">{student.studentId} • {student.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-xs text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md font-medium text-slate-700">
                          {student.department}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-3 text-xs font-medium text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-2 h-2 rounded-full ${student.attendanceRate >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{student.attendanceRate}%</span>
                        </div>
                      </td>

                      {/* Dynamic Component Marks Inputs */}
                      {course.components.map(comp => (
                        <td key={comp.id} className="py-3 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={student.marks[comp.id] ?? ''}
                            onChange={(e) => handleMarkChange(student.studentId, comp.id, e.target.value)}
                            className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                          />
                        </td>
                      ))}

                      {/* Total Score */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {total}
                      </td>

                      {/* Grade Letter */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${gradeInfo.color}`}>
                          {gradeInfo.letter}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleGenerateAiFeedback(student)}
                            disabled={isGeneratingAI === student.studentId}
                            title="Generate AI Feedback Remark"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                          >
                            <Sparkles className={`h-4 w-4 ${isGeneratingAI === student.studentId ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => setSelectedStudentForModal(student)}
                            title="View / Edit Details"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details / Feedback Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedStudentForModal.name}</h3>
                <p className="text-xs text-slate-500">{selectedStudentForModal.studentId} • {selectedStudentForModal.email}</p>
              </div>
              <button 
                onClick={() => setSelectedStudentForModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Department: <strong className="text-slate-900">{selectedStudentForModal.department}</strong></span>
                <span>Attendance: <strong className="text-slate-900">{selectedStudentForModal.attendanceRate}%</strong></span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Calculated Score: <strong className="text-slate-900">{calculateTotalScore(selectedStudentForModal.marks, course.id)}%</strong></span>
                <span>Grade Letter: <strong className="text-indigo-600">{getGradeLetter(calculateTotalScore(selectedStudentForModal.marks, course.id)).letter}</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Professor Feedback Remark (Visible to Student)
              </label>
              <textarea
                rows={3}
                value={selectedStudentForModal.feedback}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStudentForModal(prev => prev ? { ...prev, feedback: val } : null);
                  setStudents(prev => prev.map(s => s.studentId === selectedStudentForModal.studentId ? { ...s, feedback: val } : s));
                }}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => handleGenerateAiFeedback(selectedStudentForModal)}
                disabled={isGeneratingAI === selectedStudentForModal.studentId}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Regenerate AI Feedback</span>
              </button>
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import / Paste Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Import / Paste Grades (CSV format)</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-500">
              Paste CSV rows where column 1 is Student ID, followed by name, email, department, attendance, and scores for: {course.components.map(c => c.name).join(', ')}.
            </p>
            <textarea
              rows={8}
              placeholder={`STU001,Aiden Smith,aiden@university.edu,Computer Science,94,85,90,88,92`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 shadow-sm"
              >
                Process & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
