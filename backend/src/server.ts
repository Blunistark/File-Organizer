import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import ensureDirectoriesExist from './utils/ensureDirectories';

// Load environment variables
dotenv.config();

// Ensure required directories exist
ensureDirectoriesExist();

// Import routes
import fileRoutes from './routes/fileRoutes';
import folderRoutes from './routes/folderRoutes';
import organizationRoutes from './routes/organizationRoutes';
import tagRoutes from './routes/tagRoutes';

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static file directory for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to File Organizer API' });
});

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/tags', tagRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export default app; 