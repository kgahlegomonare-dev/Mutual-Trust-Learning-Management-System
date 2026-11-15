import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Required to recreate __dirname

// Import your routes (ESM requires the .js extension in the path)
import authRoutes from './routes/authRoutes.js';
import generalRoutes from './routes/routes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import learnerRoutes from './routes/learnerRoutes.js';
import oversightRoutes from './routes/oversightRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import { errorHandler } from './middleware/common.js';
import assessmentRoutes from './assessments/routes.js';
import reportRoutes from './routes/adminReportRoutes.js';
import teacherReportRoutes from './routes/teacherReportRoutes.js'
import learnerReportRoutes from './routes/learnerReportRoutes.js'
import managerReportRoutes from './routes/managerReportRoutes.js'

// import classRoutes from './routes/classRoutes.js'; // NEW: Injected Class/Classroom Module Routes

// 1. Recreate __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Configure dotenv (looking in the same folder as index.js)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'],
  credentials: true
}));

app.use(express.json());

// 3. Serve Static Files from the frontend folder
// Since index.js is in /backend and frontend is outside, go up one level
app.use(express.static(path.join(__dirname, '../frontend')));



// 4. Use the imported routes
app.use('/api', generalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/oversight', oversightRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/assessments', assessmentRoutes); 
app.use('/api/reports', reportRoutes)
app.use('/api/teacher-reports', teacherReportRoutes);
app.use('/api/learner-reports',learnerReportRoutes);
app.use('/api/manager-reports', managerReportRoutes);




// app.use('/api/manager', subjectRoutes);
// app.use('/api/manager', teacherAssignmentRoutes);

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Fixed: Corrected standard wildcard matching expression syntax
// This catches all non-API requests and hands them over to React Router safely on page refreshes
app.get('*__catchall__', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html')); 
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port} and listening on all network interfaces`);
});