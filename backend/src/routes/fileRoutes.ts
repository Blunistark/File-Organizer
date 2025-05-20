import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadPath } from '../config/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, Tag } from '@prisma/client';

const prisma = new PrismaClient();

// Create storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Create upload middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    cb(null, true);
  },
});

const router: Router = express.Router();

// Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Create a File record in the database
    const fileRecord = await prisma.file.create({
      data: {
        name: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        path: `/uploads/${req.file.filename}`,
        folderId: null, // Default to root
        userId: 'demo-user', // TODO: Replace with real user ID after auth
      },
    });

    // Return file information
    return res.status(200).json({
      success: true,
      data: fileRecord,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message,
    });
  }
});

// Get list of files
router.get('/', async (req, res) => {
  try {
    const { search, tag, tags, type, folderId, dateFrom, dateTo, sizeMin, sizeMax, description, sortBy, sortOrder } = req.query;
    const where: any = {};

    // Filter by folder
    if (folderId) {
      where.folderId = folderId;
    }

    // Filter by search (file name or originalName)
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by description
    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }

    // Filter by type (mimeType)
    if (type && typeof type === 'string' && type !== 'all') {
      if (type === 'image') where.mimeType = { startsWith: 'image/' };
      else if (type === 'text') where.mimeType = { startsWith: 'text/' };
      else if (type === 'pdf') where.mimeType = 'application/pdf';
      else if (type === 'other') where.AND = [
        { mimeType: { not: { startsWith: 'image/' } } },
        { mimeType: { not: { startsWith: 'text/' } } },
        { mimeType: { not: 'application/pdf' } },
      ];
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    // Filter by file size
    if (sizeMin || sizeMax) {
      where.size = {};
      if (sizeMin) where.size.gte = Number(sizeMin);
      if (sizeMax) where.size.lte = Number(sizeMax);
    }

    // Filter by tag (single tag, for backward compatibility)
    // and by tags (array, match any)
    let files;
    if (tags) {
      // tags can be a comma-separated string or array
      let tagList: string[] = [];
      if (Array.isArray(tags)) tagList = tags as string[];
      else if (typeof tags === 'string') tagList = tags.split(',');
      files = await prisma.file.findMany({
        where: {
          ...where,
          tags: {
            some: {
              tag: {
                OR: [
                  ...tagList.map(t => ({ id: t })),
                  ...tagList.map(t => ({ name: t })),
                ]
              }
            }
          }
        },
        orderBy: sortBy ? { [sortBy as string]: (sortOrder === 'desc' ? 'desc' : 'asc') } : { createdAt: 'desc' },
      });
    } else if (tag) {
      files = await prisma.file.findMany({
        where: {
          ...where,
          tags: {
            some: {
              tag: typeof tag === 'string' ? {
                OR: [
                  { id: tag },
                  { name: tag },
                ]
              } : undefined,
            },
          },
        },
        orderBy: sortBy ? { [sortBy as string]: (sortOrder === 'desc' ? 'desc' : 'asc') } : { createdAt: 'desc' },
      });
    } else {
      files = await prisma.file.findMany({
        where,
        orderBy: sortBy ? { [sortBy as string]: (sortOrder === 'desc' ? 'desc' : 'asc') } : { createdAt: 'desc' },
      });
    }

    res.status(200).json({
      success: true,
      data: files,
      message: 'File list retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error reading files',
      error: error.message,
    });
  }
});

// Get a specific file
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // This would normally query the database
  res.status(200).json({
    success: true,
    message: `File with ID ${id} retrieved successfully`,
  });
});

// Delete a file
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(uploadPath, id);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({
        success: true,
        message: `File with ID ${id} deleted successfully`,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `File with ID ${id} not found`,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message,
    });
  }
});

// Utility: Find or create folder by path
async function findOrCreateFolderByPath(folderPath: string, userId = 'demo-user') {
  const parts = folderPath.split('/').filter(Boolean);
  let parentId = null;
  let currentPath = '';
  let folder = null;
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    folder = await prisma.folder.findFirst({ where: { name: part, parentId, userId } });
    if (!folder) {
      folder = await prisma.folder.create({
        data: { name: part, parentId, path: currentPath, userId },
      });
    }
    parentId = folder.id;
  }
  if (!folder) throw new Error('Failed to create or find folder');
  return folder.id;
}

// Update a file's metadata (rename, description, move file, folderPath, tags)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { folderId, folderPath, tags, originalName, description } = req.body;
  try {
    let resolvedFolderId = folderId;
    if (folderPath) {
      resolvedFolderId = await findOrCreateFolderByPath(folderPath);
    }
    // Update file metadata
    const file = await prisma.file.update({
      where: { id },
      data: {
        ...(resolvedFolderId !== undefined ? { folderId: resolvedFolderId } : {}),
        ...(originalName !== undefined ? { originalName } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
    // Update tags if provided
    if (Array.isArray(tags)) {
      // Remove all current tags
      await prisma.fileTag.deleteMany({ where: { fileId: id } });
      // Add new tags (create if not exist)
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (!tag) tag = await prisma.tag.create({ data: { name: tagName } });
        await prisma.fileTag.create({ data: { fileId: id, tagId: tag.id } });
      }
    }
    res.status(200).json({ success: true, data: file, message: 'File updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error updating file', error: error.message });
  }
});

// Tagging endpoints

// Add a tag to a file (creates tag if not exists)
router.post('/:id/tags', async (req, res) => {
  const { id } = req.params;
  const { tagName } = req.body;
  if (!tagName) return res.status(400).json({ success: false, message: 'tagName is required' });
  try {
    // Find or create tag
    let tag = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
    }
    // Connect tag to file
    await prisma.fileTag.create({ data: { fileId: id, tagId: tag.id } });
    res.status(200).json({ success: true, message: 'Tag added to file', tag });
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint failed (tag already added)
      return res.status(200).json({ success: true, message: 'Tag already exists for file' });
    }
    res.status(500).json({ success: false, message: 'Error adding tag', error: error.message });
  }
});

// Remove a tag from a file
router.delete('/:id/tags/:tagId', async (req, res) => {
  const { id, tagId } = req.params;
  try {
    await prisma.fileTag.delete({ where: { fileId_tagId: { fileId: id, tagId } } });
    res.status(200).json({ success: true, message: 'Tag removed from file' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error removing tag', error: error.message });
  }
});

// List tags for a file
router.get('/:id/tags', async (req, res) => {
  const { id } = req.params;
  try {
    const fileTags = await prisma.fileTag.findMany({
      where: { fileId: id },
      include: { tag: true },
    });
    const tags = fileTags.map(ft => ft.tag);
    res.status(200).json({ success: true, data: tags });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching tags', error: error.message });
  }
});

export default router; 