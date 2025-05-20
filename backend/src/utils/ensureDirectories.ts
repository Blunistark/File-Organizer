import fs from 'fs';
import path from 'path';
import { uploadPath } from '../config/config';

/**
 * Ensures that required directories exist
 */
export const ensureDirectoriesExist = (): void => {
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadPath)) {
    console.log(`Creating uploads directory at ${uploadPath}`);
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};

export default ensureDirectoriesExist; 