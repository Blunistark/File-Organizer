import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import path from 'path';
import { extractFileContent } from '../utils/extractFileContent';

const prisma = new PrismaClient();

export const suggestOrganization = async (req: Request, res: Response) => {
  const { fileId } = req.params;
  try {
    // 1. Fetch file metadata and content
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    // 2. Extract file content
    let fileContent = '';
    try {
      // file.path is assumed to be the relative path; adjust as needed for your uploads dir
      const absPath = path.join(process.cwd(), 'backend', file.path.startsWith('/') ? file.path.slice(1) : file.path);
      fileContent = await extractFileContent(absPath, file.mimeType);
    } catch (err: any) {
      // fallback: use originalName if extraction fails
      fileContent = file.originalName;
    }
    if (!fileContent) fileContent = file.originalName;

    // 3. Call MCP Model 1 for context analysis and prompt generation
    let prompt;
    try {
      const mcp1Url = process.env.MCP1_API_URL || 'http://localhost:8001/api/analyze';
      const mcp1Resp = await axios.post(mcp1Url, { content: fileContent });
      prompt = mcp1Resp.data.prompt;
      if (!prompt) throw new Error('No prompt returned from MCP Model 1');
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error calling MCP Model 1', error: err.message });
    }

    // 4. Call MCP Model 2 (organizer) with the prompt
    let organizerResult;
    try {
      const mcp2Url = process.env.MCP2_API_URL || 'http://localhost:8001/api/organize';
      const mcp2Resp = await axios.post(mcp2Url, { prompt });
      organizerResult = mcp2Resp.data;
      if (!organizerResult) throw new Error('No result returned from MCP Model 2');
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error calling MCP Model 2', error: err.message });
    }

    // 5. Return the organizer's output
    return res.status(200).json({
      success: true,
      data: organizerResult,
      message: 'Organization suggestion generated',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error suggesting organization', error: error.message });
  }
};

export const applyOrganization = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Organization applied (controller stub)' });
}; 