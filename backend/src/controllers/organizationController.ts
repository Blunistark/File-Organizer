import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import path from 'path';
import { extractFileContent } from '../utils/extractFileContent';
import { generateEmbedding, queryChroma, addToChroma } from '../services/embeddingService';

const prisma = new PrismaClient();

export const suggestOrganization = async (req: Request, res: Response) => {
  const { fileId } = req.params;
  try {
    // 1. Fetch file metadata and content
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    // 1b. Fetch tags for the file
    const fileTags = await prisma.fileTag.findMany({ where: { fileId: file.id }, include: { tag: true } });
    const tags = fileTags.map(ft => ft.tag.name);

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

    // 3. Generate embedding for the file content
    let embedding: number[] = [];
    try {
      embedding = await generateEmbedding(fileContent);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error generating embedding', error: err.message });
    }

    // 4. Add embedding to Chroma DB (if not already present)
    try {
      await addToChroma('files', file.id, embedding, {
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        folderId: file.folderId,
        tags,
      });
    } catch (err: any) {
      // Ignore if already exists, log otherwise
    }

    // 5. Query Chroma DB for similar files (RAG retrieval)
    let similarFiles: any[] = [];
    try {
      const queryResult = await queryChroma('files', embedding, 5);
      similarFiles = (queryResult && queryResult.metadatas && queryResult.metadatas[0]) ? queryResult.metadatas[0] : [];
    } catch (err: any) {
      // If vector DB is down, fallback to empty context
      similarFiles = [];
    }

    // 6. Assemble RAG context
    const ragContext = {
      fileContent,
      fileMetadata: file,
      tags,
      similarFiles, // Array of metadata for similar files
    };

    // 7. Call MCP Model 1 for context analysis and prompt generation, passing RAG context
    let prompt;
    try {
      const mcp1Url = process.env.MCP1_API_URL || 'http://localhost:8001/api/analyze';
      const mcp1Resp = await axios.post(mcp1Url, { content: JSON.stringify(ragContext) });
      prompt = mcp1Resp.data.prompt;
      if (!prompt) throw new Error('No prompt returned from MCP Model 1');
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error calling MCP Model 1', error: err.message });
    }

    // 8. Call MCP Model 2 (organizer) with the prompt
    let organizerResult;
    try {
      const mcp2Url = process.env.MCP2_API_URL || 'http://localhost:8001/api/organize';
      const mcp2Resp = await axios.post(mcp2Url, { prompt });
      organizerResult = mcp2Resp.data;
      if (!organizerResult) throw new Error('No result returned from MCP Model 2');
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error calling MCP Model 2', error: err.message });
    }

    // 9. Return the organizer's output
    return res.status(200).json({
      success: true,
      data: organizerResult,
      message: 'Organization suggestion generated (RAG context used)',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error suggesting organization', error: error.message });
  }
};

export const applyOrganization = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Organization applied (controller stub)' });
};

export const batchSuggestOrganization = async (req: Request, res: Response) => {
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, message: 'fileIds must be a non-empty array' });
  }
  try {
    const batchContexts = [];
    for (const fileId of fileIds) {
      // Fetch file metadata
      const file = await prisma.file.findUnique({ where: { id: fileId } });
      if (!file) continue;
      // Fetch tags
      const fileTags = await prisma.fileTag.findMany({ where: { fileId: file.id }, include: { tag: true } });
      const tags = fileTags.map(ft => ft.tag.name);
      // Extract content
      let fileContent = '';
      try {
        const absPath = path.join(process.cwd(), 'backend', file.path.startsWith('/') ? file.path.slice(1) : file.path);
        fileContent = await extractFileContent(absPath, file.mimeType);
      } catch (err: any) {
        fileContent = file.originalName;
      }
      if (!fileContent) fileContent = file.originalName;
      // Generate embedding
      let embedding: number[] = [];
      try {
        embedding = await generateEmbedding(fileContent);
      } catch {}
      // Add to Chroma
      try {
        await addToChroma('files', file.id, embedding, {
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          folderId: file.folderId,
          tags,
        });
      } catch {}
      // Query Chroma for similar files
      let similarFiles: any[] = [];
      try {
        const queryResult = await queryChroma('files', embedding, 5);
        similarFiles = (queryResult && queryResult.metadatas && queryResult.metadatas[0]) ? queryResult.metadatas[0] : [];
      } catch {
        similarFiles = [];
      }
      // Assemble RAG context for this file
      batchContexts.push({
        prompt: JSON.stringify({ fileContent, fileMetadata: file, tags, similarFiles }),
        file_type: file.mimeType.startsWith('image/') ? 'image' : (file.mimeType === 'application/pdf' ? 'pdf' : 'text'),
        user_context: {},
        allowed_tags: tags,
      });
    }
    // Call MCP batch endpoint
    const mcpBatchUrl = process.env.MCP_BATCH_API_URL || 'http://localhost:8001/api/organize/batch';
    const mcpResp = await axios.post(mcpBatchUrl, { files: batchContexts });
    return res.status(200).json({
      success: true,
      data: mcpResp.data.results,
      message: 'Batch organization suggestions generated (RAG context used)',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error in batch organization', error: error.message });
  }
};

export const folderSuggestOrganization = async (req: Request, res: Response) => {
  const { folderId } = req.body;
  if (!folderId) {
    return res.status(400).json({ success: false, message: 'folderId is required' });
  }
  try {
    // Fetch all files in the folder
    const files = await prisma.file.findMany({ where: { folderId } });
    if (!files.length) {
      return res.status(404).json({ success: false, message: 'No files found in the folder' });
    }
    const file_prompts = [];
    let allTags: Set<string> = new Set();
    for (const file of files) {
      // Fetch tags
      const fileTags = await prisma.fileTag.findMany({ where: { fileId: file.id }, include: { tag: true } });
      const tags = fileTags.map(ft => ft.tag.name);
      tags.forEach(t => allTags.add(t));
      // Extract content
      let fileContent = '';
      try {
        const absPath = path.join(process.cwd(), 'backend', file.path.startsWith('/') ? file.path.slice(1) : file.path);
        fileContent = await extractFileContent(absPath, file.mimeType);
      } catch (err: any) {
        fileContent = file.originalName;
      }
      if (!fileContent) fileContent = file.originalName;
      // Generate embedding
      let embedding: number[] = [];
      try {
        embedding = await generateEmbedding(fileContent);
      } catch {}
      // Add to Chroma
      try {
        await addToChroma('files', file.id, embedding, {
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          folderId: file.folderId,
          tags,
        });
      } catch {}
      // Query Chroma for similar files
      let similarFiles: any[] = [];
      try {
        const queryResult = await queryChroma('files', embedding, 5);
        similarFiles = (queryResult && queryResult.metadatas && queryResult.metadatas[0]) ? queryResult.metadatas[0] : [];
      } catch {
        similarFiles = [];
      }
      // Assemble RAG context for this file
      file_prompts.push(JSON.stringify({ fileContent, fileMetadata: file, tags, similarFiles }));
    }
    // Call MCP folder endpoint
    const mcpFolderUrl = process.env.MCP_FOLDER_API_URL || 'http://localhost:8001/api/organize/folder';
    const mcpResp = await axios.post(mcpFolderUrl, {
      file_prompts,
      user_context: {},
      allowed_tags: Array.from(allTags),
      existing_folders: [], // Optionally fetch and pass existing folder names
      existing_tags: Array.from(allTags),
    });
    return res.status(200).json({
      success: true,
      data: mcpResp.data,
      message: 'Folder organization suggestion generated (RAG context used)',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error in folder organization', error: error.message });
  }
}; 