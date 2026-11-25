import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProfessorDashboard } from './components/ProfessorDashboard';
import { StudentPortal } from './components/StudentPortal';
import { Course, StudentGrade } from './types';
import { COURSES } from './data/mockStudents';

export default function App() {
  const [role, setRole] = useState<'professor' | 'student'>('professor');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(COURSES[0].id);
  const [courses, setCourses] = useState<Course[]>(COURSES);
  
  // State for all courses student grades
  const [allCourseStudents, setAllCourseStudents] = useState<{
    [courseId: string]: { students: StudentGrade[]; isPublished: boolean }
  }>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch initial data from server
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      })
      .catch(err => console.error('Failed to fetch courses:', err));

    // Fetch data for all courses
    COURSES.forEach(course => {
      fetch(`/api/courses/${course.id}/data`)
        .then(res => res.json())
        .then(data => {
          setAllCourseStudents(prev => ({
            ...prev,
            [course.id]: data
          }));
        })
        .catch(err => console.error(`Failed to fetch data for ${course.id}:`, err));
    });
  }, []);

  const currentCourseData = allCourseStudents[selectedCourseId] || { students: [], isPublished: true };
  const currentStudents = currentCourseData.students;

  const setCurrentStudents: React.Dispatch<React.SetStateAction<StudentGrade[]>> = (action) => {
    setAllCourseStudents(prev => {
      const current = prev[selectedCourseId] || { students: [], isPublished: true };
      const updatedStudents = typeof action === 'function' ? action(current.students) : action;
      return {
        ...prev,
        [selectedCourseId]: {
          ...current,
          students: updatedStudents
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const setIsPublished = (published: boolean) => {
    setAllCourseStudents(prev => {
      const current = prev[selectedCourseId] || { students: [], isPublished: true };
      return {
        ...prev,
        [selectedCourseId]: {
          ...current,
          isPublished: published
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // Save changes to backend
  const handleSaveMarks = async () => {
    setIsSaving(true);
    try {
      const currentData = allCourseStudents[selectedCourseId];
      const res = await fetch(`/api/courses/${selectedCourseId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData),
      });
      const data = await res.json();
      if (data.success) {
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to save marks:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        role={role}
        setRole={setRole}
        courses={courses}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        isPublished={currentCourseData.isPublished}
        onSave={handleSaveMarks}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <main className="flex-1">
        {role === 'professor' ? (
          <ProfessorDashboard
            course={activeCourse}
            students={currentStudents}
            setStudents={setCurrentStudents}
            isPublished={currentCourseData.isPublished}
            setIsPublished={setIsPublished}
            onSave={handleSaveMarks}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        ) : (
          <StudentPortal
            courses={courses}
            allCourseStudents={allCourseStudents}
          />
        )}
      </main>
    </div>
  );
}
