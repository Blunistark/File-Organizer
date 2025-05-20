import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

export async function extractFileContent(filePath: string, mimeType: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (mimeType.startsWith('text/')) {
      // Text file
      return await fs.readFile(filePath, 'utf-8');
    } else if (mimeType === 'application/pdf' || ext === '.pdf') {
      // PDF file
      const data = await fs.readFile(filePath);
      const pdfData = await pdfParse(data);
      return pdfData.text;
    } else if (mimeType.startsWith('image/')) {
      // Image file (OCR)
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      return text;
    } else {
      // Unsupported type
      return '';
    }
  } catch (err: any) {
    return '';
  }
} 