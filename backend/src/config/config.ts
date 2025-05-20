import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/file_organizer',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  llmServiceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:11434',
};

// Create absolute path for upload directory
const uploadPath = path.resolve(__dirname, '../../', config.uploadDir);

export { config, uploadPath }; 