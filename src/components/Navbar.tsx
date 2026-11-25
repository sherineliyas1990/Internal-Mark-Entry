import React from 'react';
import { GraduationCap, Users, Shield, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { Course } from '../types';

interface NavbarProps {
  role: 'professor' | 'student';
  setRole: (role: 'professor' | 'student') => void;
  courses: Course[];
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  isPublished: boolean;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  setRole,
  courses,
  selectedCourseId,
  setSelectedCourseId,
  isPublished,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => {
  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center shadow-inner">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight">UniGrade</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium border border-indigo-500/30">
                  Portal v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">University Mark Entry & Academic Dashboard</p>
            </div>
          </div>

          {/* Course Selector (Professor Mode) */}
          {role === 'professor' && courses.length > 0 && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span className="text-xs text-slate-400 font-medium">Course:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id} className="bg-slate-900 text-white">
                    {course.code}: {course.name} ({course.semester})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Right Actions & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Role Toggle */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setRole('professor')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === 'professor'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Professor Portal</span>
              </button>
              <button
                onClick={() => setRole('student')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === 'student'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Student Portal</span>
              </button>
            </div>

            {/* Save Marks Button (Professor View) */}
            {role === 'professor' && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                  hasUnsavedChanges
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes*' : 'Marks Saved'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
