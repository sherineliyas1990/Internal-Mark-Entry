import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini client on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-memory storage for courses & students marks (persisted during session / restart)
import { COURSES, generate100Students } from './src/data/mockStudents.ts';
import { StudentGrade } from './src/types.ts';

const db: { [courseId: string]: { students: StudentGrade[]; isPublished: boolean } } = {};

// Initialize mock data for all courses
COURSES.forEach(course => {
  db[course.id] = {
    students: generate100Students(course.id),
    isPublished: true,
  };
});

// API Routes
app.get('/api/courses', (req, res) => {
  res.json(COURSES);
});

app.get('/api/courses/:courseId/data', (req, res) => {
  const { courseId } = req.params;
  if (!db[courseId]) {
    db[courseId] = {
      students: generate100Students(courseId),
      isPublished: true,
    };
  }
  res.json(db[courseId]);
});

app.post('/api/courses/:courseId/data', (req, res) => {
  const { courseId } = req.params;
  const { students, isPublished } = req.body;
  
  if (!db[courseId]) {
    db[courseId] = { students: [], isPublished: true };
  }
  
  if (students) {
    db[courseId].students = students;
  }
  if (typeof isPublished === 'boolean') {
    db[courseId].isPublished = isPublished;
  }
  
  res.json({ success: true, data: db[courseId] });
});

// Gemini AI Assistant endpoint for Professor Feedback & Class Insights
app.post('/api/gemini/feedback', async (req, res) => {
  try {
    const { studentName, courseName, totalScore, marks, attendanceRate } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Gemini API key is not configured in environment secrets.' });
    }

    const prompt = `Write a professional, constructive university professor's feedback comment (2-3 sentences) for student ${studentName} in ${courseName}.
    Total Score: ${totalScore}/100.
    Attendance: ${attendanceRate}%.
    Component Marks: ${JSON.stringify(marks)}.
    Provide encouraging, academic guidance and specific areas for improvement.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction: 'You are an experienced, empathetic university professor providing constructive academic feedback.',
      }
    });

    res.json({ feedback: response.text?.trim() || 'Keep up the consistent effort and participate actively in upcoming coursework.' });
  } catch (error: any) {
    console.error('Gemini Feedback Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI feedback' });
  }
});

// Gemini AI Class Performance Summary
app.post('/api/gemini/class-summary', async (req, res) => {
  try {
    const { courseName, stats } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Gemini API key is not configured.' });
    }

    const prompt = `Analyze the following class performance data for ${courseName}:
    ${JSON.stringify(stats)}
    Provide a brief executive summary (3 bullet points) for the professor highlighting overall class standing, topics needing review, and recommendations for the final exam.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction: 'You are a senior academic advisor assisting university professors with performance analytics.',
      }
    });

    res.json({ summary: response.text?.trim() || 'Class performance is stable with strong foundational scores.' });
  } catch (error: any) {
    console.error('Gemini Summary Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate class summary' });
  }
});

// Serve frontend in production / Vite middleware in dev
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`UniGrade Portal server running on http://localhost:${PORT}`);
});
